import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../constants/config";
import {
  authApi,
  cashApi,
  fertilizerApi,
  itemApi,
  leafApi,
  newsApi,
  notificationApi,
  settingsApi,
  tokenStorage,
} from "../utils/api";

const AppContext = createContext(null);

// AsyncStorage key that holds the CURRENT local image file path.
// Each upload writes to a NEW uniquely-named file so expo-image always sees a
// different URI and can never serve a stale cached version of the old photo.
const PROFILE_IMAGE_PATH_KEY = "profileImageLocalPath";
const PROFILE_IMAGE_DIR = (FileSystem.documentDirectory ?? "") + "profiles/";

// Returns the stored local path if the file still exists on disk, otherwise null
async function getStoredLocalImagePath() {
  try {
    const stored = await AsyncStorage.getItem(PROFILE_IMAGE_PATH_KEY);
    if (!stored) return null;
    const info = await FileSystem.getInfoAsync(stored);
    return info.exists ? stored : null;
  } catch (_) {
    return null;
  }
}

// Persists `newPath` as the active profile image path in AsyncStorage and
// deletes the previous file (different path) to avoid accumulating old photos.
async function activateLocalImagePath(newPath) {
  try {
    const old = await AsyncStorage.getItem(PROFILE_IMAGE_PATH_KEY);
    if (old && old !== newPath) {
      FileSystem.deleteAsync(old, { idempotent: true }).catch(() => {});
    }
  } catch (_) {}
  await AsyncStorage.setItem(PROFILE_IMAGE_PATH_KEY, newPath);
}

// Generates a unique local file path for each upload
function newLocalImagePath() {
  return `${PROFILE_IMAGE_DIR}profile_${Date.now()}.jpg`;
}

// Fast path: copy the already-local picked file to a new persistent path (no network)
async function copyPickedImageLocally(sourceUri) {
  try {
    await FileSystem.makeDirectoryAsync(PROFILE_IMAGE_DIR, { intermediates: true });
    const dest = newLocalImagePath();
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      await activateLocalImagePath(dest);
      return dest;
    }
    console.log("[profile] copyAsync ran but file missing:", dest);
    return null;
  } catch (e) {
    console.log("[profile] copyAsync failed:", e?.message || e);
    return null;
  }
}

// Reliable fallback: download via the authenticated backend endpoint.
// The backend uses the Supabase service-role key, so bucket visibility doesn't matter.
async function downloadProfileImageViaBackend(token) {
  try {
    await FileSystem.makeDirectoryAsync(PROFILE_IMAGE_DIR, { intermediates: true });
    const dest = newLocalImagePath();
    const dl = await FileSystem.downloadAsync(
      `${API_BASE_URL}/api/settings/profile-image`,
      dest,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (dl.status === 200) {
      const info = await FileSystem.getInfoAsync(dest);
      if (info.exists) {
        await activateLocalImagePath(dest);
        return dest;
      }
    }
    console.log("[profile] backend download status:", dl.status);
    return null;
  } catch (e) {
    console.log("[profile] backend download failed:", e?.message || e);
    return null;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  // ── Auth / session ───────────────────────────────────────────────────────────
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeReg, setActiveReg] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  // ── Settings / theme ─────────────────────────────────────────────────────────
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("english");
  const [fontSize, setFontSize] = useState(50);

  // ── App data ─────────────────────────────────────────────────────────────────
  const [leafCache, setLeafCache] = useState({});
  const [sixMonthHistory, setSixMonthHistory] = useState([]);
  const [todayLeafTotal, setTodayLeafTotal] = useState(0);
  const [todayLeafData, setTodayLeafData] = useState({ normalNet: 0, superNet: 0, hasSuper: false });
  const [featureFlags, setFeatureFlags] = useState({ cash: true, fertilizer: true, item: true });
  const [notifications, setNotifications] = useState([]);
  const [cashRequests, setCashRequests] = useState([]);
  const [fertilizerRequests, setFertilizerRequests] = useState([]);
  const [itemRequests, setItemRequests] = useState([]);
  const [specialNews, setSpecialNews] = useState([]);
  const [newsShown, setNewsShown] = useState(false);

  // Keep a ref so async callbacks always see the latest token
  const tokenRef = useRef(null);
  tokenRef.current = token;

  // ── Restore session on startup ───────────────────────────────────────────────
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const savedToken = await tokenStorage.get();
  //       if (!savedToken) return;

  //       // Validate token by fetching user
  //       const user = await authApi.me(savedToken);
  //       const regs = await authApi.registrations(savedToken);

  //       setToken(savedToken);
  //       setCurrentUser(mapUser(user));
  //       setRegistrations(regs || []);

  //       // Restore active registration from AsyncStorage
  //       const savedRegJson = await AsyncStorage.getItem("activeReg");
  //       if (savedRegJson) {
  //         setActiveReg(JSON.parse(savedRegJson));
  //       }

  //       // Load settings first — this sets profileImage from DB into context
  //       await loadSettings(savedToken);

  //       // Guaranteed fallback: if the API returned no profileImage, use AsyncStorage cache
  //       const cachedImage = await AsyncStorage.getItem("profileImage");
  //       if (cachedImage) {
  //         setCurrentUser((prev) => prev ? { ...prev, image: prev.image || cachedImage } : prev);
  //       }
  //     } catch (_) {
  //       // Token expired or invalid — clear it
  //       await tokenStorage.remove();
  //     }
  //   })();
  // }, []);
useEffect(() => {
  (async () => {
    try {
      // Show the locally-saved profile image immediately — no network, no delay
      const localImage = await getStoredLocalImagePath();
      if (localImage) {
        setCurrentUser({ image: localImage });
      }

      const savedToken = await tokenStorage.get();
      if (!savedToken) return;

      setToken(savedToken);

      const user = await authApi.me(savedToken);
      const regs = await authApi.registrations(savedToken);
      setRegistrations(regs || []);

      const mapped = mapUser(user);
      setCurrentUser(prev => ({
        ...mapped,
        // Keep the local file path — it's what the user sees instantly
        image: localImage || prev?.image || mapped.image,
      }));

      const savedRegJson = await AsyncStorage.getItem("activeReg");
      if (savedRegJson) setActiveReg(JSON.parse(savedRegJson));

      await loadSettings(savedToken);

    } catch (err) {
      console.log("Startup Error:", err);
      await tokenStorage.remove();
      setToken(null);       // clear stale token from React state
      setCurrentUser(null); // clear stale user so screens don't show wrong data
    }
  })();
}, []);

  // Load settings and apply them
const loadSettings = async (tok) => {
  try {
    const s = await settingsApi.get(tok);
    if (!s) return;

    const theme = s.theme || s.Theme;
    const lang = s.language || s.Language;
    const fSize = s.fontSize ?? s.FontSize;
    const remoteImage = s.profileImage || s.ProfileImage || s.imageUrl;

    if (theme) setTheme(theme);
    if (lang) setLanguage(lang);
    if (fSize !== undefined) setFontSize(Number(fSize));

    // Image resolution priority:
    // 1. Local file on device (instant, works offline)
    // 2. Download via backend proxy (authenticated — works regardless of Supabase bucket visibility)
    // 3. Fall back to the remote Supabase URL directly (last resort)
    let imageToUse = null;

    const localExists = await getStoredLocalImagePath();
    if (localExists) {
      imageToUse = localExists; // use the stored unique path
    } else if (remoteImage) {
      // No local file — download via the backend so auth/visibility config doesn't matter
      const downloaded = await downloadProfileImageViaBackend(tok);
      imageToUse = downloaded || remoteImage.split('?')[0];
    }

    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        address: s.address || s.Address || prev.address,
        phone: s.phone || s.Phone || prev.phone,
        bankName: s.bankName || s.BankName || prev.bankName,
        accountNumber: s.accountNumber || s.AccountNumber || prev.accountNumber,
        image: imageToUse || prev.image,
      };
    });
  } catch (err) {
    console.error("[loadSettings] error:", err);
  }
};

  // Load all app data after a registration is selected
  const loadAppData = useCallback(async (tok) => {
    if (!tok) return;
    await Promise.allSettled([
      loadNotifications(tok),
      loadCashRequests(tok),
      loadFertilizerRequests(tok),
      loadItemRequests(tok),
      loadSpecialNews(tok),
      loadTodayLeaf(tok),
      loadHistory(tok),
      loadFeatureFlags(tok),
    ]);
  }, []);

  // ── Data loaders ─────────────────────────────────────────────────────────────
  const loadNotifications = async (tok) => {
    try {
      const data = await notificationApi.list(tok);
      setNotifications(
        Array.isArray(data)
          ? data.map((n) => ({
              id:        n.id,
              title:     n.title     ?? "",
              message:   n.message   ?? "",
              type:      n.type      ?? "info",
              createdAt: n.createdAt ?? null,
              read:      n.isRead    ?? n.read ?? false,
            }))
          : []
      );
    } catch (_) {}
  };

  const loadCashRequests = async (tok) => {
    try {
      const data = await cashApi.list(tok);
      setCashRequests(Array.isArray(data) ? data.map(mapCashRequest) : []);
    } catch (_) {}
  };

  const loadFertilizerRequests = async (tok) => {
    try {
      const data = await fertilizerApi.list(tok);
      setFertilizerRequests(Array.isArray(data) ? data.map(mapFertilizerRequest) : []);
    } catch (_) {}
  };

  const loadItemRequests = async (tok) => {
    try {
      const data = await itemApi.list(tok);
      setItemRequests(Array.isArray(data) ? data.map(mapItemRequest) : []);
    } catch (_) {}
  };

  const mapNews = (n) => ({
    id:      String(n.id),
    title:   n.title   || "",
    message: n.content || n.message || "",
  });

  const loadSpecialNews = async (tok) => {
    try {
      const data = await newsApi.activePopup(tok);
      // Backend returns a single NewsDto object (or null), not an array
      if (!data) {
        setSpecialNews([]);
      } else if (Array.isArray(data)) {
        setSpecialNews(data.map(mapNews));
      } else {
        setSpecialNews([mapNews(data)]);
      }
    } catch (_) {}
  };

  const loadTodayLeaf = async (tok) => {
    try {
      const data = await leafApi.today(tok);
      // Backend returns TodayLeafDto: { normalNet, superNet, hasSuper, bagCount }
      const normalNet = data?.normalNet ?? 0;
      const superNet  = data?.superNet  ?? 0;
      const hasSuper  = data?.hasSuper  ?? false;
      setTodayLeafData({ normalNet, superNet, hasSuper });
      setTodayLeafTotal(normalNet + superNet);
    } catch (_) {}
  };

  const loadFeatureFlags = async (tok) => {
    try {
      const [cash, fertilizer, item] = await Promise.allSettled([
        cashApi.featureEnabled(tok),
        fertilizerApi.featureEnabled(tok),
        itemApi.featureEnabled(tok),
      ]);
      setFeatureFlags({
        cash:       cash.status       === "fulfilled" ? !!(cash.value?.enabled       ?? cash.value?.isEnabled       ?? true) : true,
        fertilizer: fertilizer.status === "fulfilled" ? !!(fertilizer.value?.enabled ?? fertilizer.value?.isEnabled ?? true) : true,
        item:       item.status       === "fulfilled" ? !!(item.value?.enabled        ?? item.value?.isEnabled        ?? true) : true,
      });
    } catch (_) {}
  };

  const loadHistory = async (tok) => {
    try {
      const data = await leafApi.history(tok);
      setSixMonthHistory(
        Array.isArray(data)
          ? data.map((h) => ({
              key:        h.monthKey   ?? h.key   ?? "",
              label:      h.monthLabel ?? h.label ?? "",
              totalGross: h.totalGross ?? 0,
              totalNet:   h.totalNet   ?? 0,
              days:       h.days       ?? 0,
            }))
          : []
      );
    } catch (_) {}
  };

  // ── Auth functions ───────────────────────────────────────────────────────────

  // Returns { user, registrations } on success, throws on error
  const signIn = async (username, password) => {
    const result = await authApi.login(username, password);
    if (!result?.token) return null;

    await tokenStorage.set(result.token);
    setToken(result.token);

    const [user, regs] = await Promise.all([
      authApi.me(result.token),
      authApi.registrations(result.token),
    ]);

    const mappedUser = mapUser(user);
    setCurrentUser(mappedUser);
    setRegistrations(Array.isArray(regs) ? regs : []);
    await loadSettings(result.token);

    return { user: mappedUser, registrations: Array.isArray(regs) ? regs : [] };
  };

  // Call after registration is chosen — loads all app data
  const login = async (reg) => {
    setActiveReg(reg);
    setNewsShown(false);
    await AsyncStorage.setItem("activeReg", JSON.stringify(reg));
    await loadAppData(tokenRef.current);
  };

  const logout = async () => {
    await tokenStorage.remove();
    await AsyncStorage.removeItem("activeReg");
    await AsyncStorage.removeItem("profileImage");
    // Delete local profile image so the next user's image doesn't bleed through
    try {
      const localPath = await AsyncStorage.getItem(PROFILE_IMAGE_PATH_KEY);
      if (localPath) FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
    } catch (_) {}
    await AsyncStorage.removeItem(PROFILE_IMAGE_PATH_KEY);
    setToken(null);
    setCurrentUser(null);
    setActiveReg(null);
    setRegistrations([]);
    setLeafCache({});
    setSixMonthHistory([]);
    setTodayLeafTotal(0);
    setNotifications([]);
    setCashRequests([]);
    setFertilizerRequests([]);
    setItemRequests([]);
    setSpecialNews([]);
    setNewsShown(false);
  };

  const updateProfile = async (data) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        address: data.address ?? prev.address,
        phone: data.phone ?? prev.phone,
        bankName: data.bankName ?? prev.bankName,
        accountNumber: data.accountNumber ?? prev.accountNumber,
        accountHolder: data.accountHolder ?? prev.accountHolder,
        branch: data.branch ?? prev.branch,
      };
    });

    let uploadedImageUrl = null;

    if (data.imageAsset) {
      try {
        const result = await settingsApi.updateProfileImage(tokenRef.current, data.imageAsset);
        const remoteUrl = result?.imageUrl || result?.profileImage || result?.url || result?.imagePath;
        if (remoteUrl) {
          // 1. Show the picked local file immediately (zero-delay feedback)
          setCurrentUser((prev) => prev ? { ...prev, image: data.imageAsset.uri } : prev);

          // 2. Try to copy the local picked file to persistent storage (fastest, no network)
          let localPath = await copyPickedImageLocally(data.imageAsset.uri);

          // 3. If copy failed, download from backend proxy (reliable, auth-based)
          if (!localPath) {
            localPath = await downloadProfileImageViaBackend(tokenRef.current);
          }

          const displayUrl = localPath || remoteUrl;
          uploadedImageUrl = displayUrl;
          setCurrentUser((prev) => prev ? { ...prev, image: displayUrl } : prev);
        }
        await loadSettings(tokenRef.current);
      } catch (err) {
        console.log("[updateProfile] image upload error:", err?.message || err);
        await loadSettings(tokenRef.current);
        throw err;
      }
    }

    if (data.address !== undefined || data.phone !== undefined) {
      await settingsApi.updateSettings(tokenRef.current, {
        address: data.address,
        phone: data.phone,
      });
    }

    if (data.bankName !== undefined || data.accountNumber !== undefined ||
        data.accountHolder !== undefined || data.branch !== undefined) {
      await settingsApi.updateAccountDetails(tokenRef.current, {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        branch: data.branch,
      });
    }

    return uploadedImageUrl;
  };

  // ── Leaf data ────────────────────────────────────────────────────────────────

  // Sync read from cache — returns undefined if not yet fetched, DTO object once fetched
  const getLeafData = (monthKey) => leafCache[monthKey];

  // Async fetch — call from screens when month changes
  // Backend returns MonthlyLeafSummaryDto: { month, year, totalGross, totalNet, totalSuperNet, totalDays, collections[], hasSuper }
  const fetchLeafData = async (monthKey) => {
    const tok = tokenRef.current;
    if (!tok) return;
    try {
      const [year, month] = monthKey.split("-").map(Number);
      const data = await leafApi.monthly(tok, year, month);
      // Store the full summary object; screens extract .collections and .hasSuper
      setLeafCache((prev) => ({ ...prev, [monthKey]: data ?? null }));
    } catch (_) {}
  };

  const getTodayLeaf = () => todayLeafTotal;
  const getTodayLeafData = () => todayLeafData;
  const getSixMonthHistory = () => sixMonthHistory;
  const getFeatureFlags = () => featureFlags;

  // ── Notification actions ─────────────────────────────────────────────────────
  const markNotificationRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationApi.markRead(tokenRef.current, id);
    } catch (_) {}
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationApi.markAllRead(tokenRef.current);
    } catch (_) {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── News actions ─────────────────────────────────────────────────────────────
  const dismissNews = async (id) => {
    // Optimistically remove from local state so it won't re-show this session
    setSpecialNews((prev) => prev.filter((n) => n.id !== String(id)));
    try {
      await newsApi.dismiss(tokenRef.current, id);
    } catch (_) {}
  };

  // ── Request actions ──────────────────────────────────────────────────────────
  const addCashRequest = async (requestData) => {
    try {
      const result = await cashApi.create(tokenRef.current, {
        requestType: requestData.type,
        month: requestData.month,
        amount: Number(requestData.amount),
      });
      const mapped = mapCashRequest(result);
      setCashRequests((prev) => [mapped, ...prev]);
      return mapped;
    } catch (err) {
      throw err;
    }
  };

  const addFertilizerRequest = async (requestData) => {
    try {
      const result = await fertilizerApi.create(tokenRef.current, {
        fertilizerType: requestData.fertilizerType ?? requestData.fertType,
        month: requestData.month,
        quantity: Number(requestData.quantity),
      });
      const mapped = mapFertilizerRequest(result);
      setFertilizerRequests((prev) => [mapped, ...prev]);
      return mapped;
    } catch (err) {
      throw err;
    }
  };

  const addItemRequest = async (requestData) => {
    try {
      const result = await itemApi.create(tokenRef.current, {
        itemType: requestData.itemType,
        month: requestData.month,
        quantity: Number(requestData.quantity),
      });
      const mapped = mapItemRequest(result);
      setItemRequests((prev) => [mapped, ...prev]);
      return mapped;
    } catch (err) {
      throw err;
    }
  };

  // ── Settings actions ─────────────────────────────────────────────────────────
  const updateTheme = async (t) => {
    setTheme(t);
    try { await settingsApi.updateTheme(tokenRef.current, t); } catch (_) {}
  };

  const updateLanguage = async (l) => {
    setLanguage(l);
    try { await settingsApi.updateLanguage(tokenRef.current, l); } catch (_) {}
  };

  const updateFontSize = async (f) => {
    setFontSize(f);
    try { await settingsApi.updateFontSize(tokenRef.current, f); } catch (_) {}
  };

  // ── Context value ────────────────────────────────────────────────────────────
  const isDark = theme === "dark";

  return (
    <AppContext.Provider value={{
      // Theme
      theme, isDark, updateTheme,
      language, updateLanguage,
      fontSize, updateFontSize,
      // Auth
      currentUser, activeReg, registrations,
      signIn, login, logout, updateProfile,
      // Leaf
      getLeafData, fetchLeafData, getTodayLeaf, getTodayLeafData, getSixMonthHistory,
      // Feature flags
      getFeatureFlags,
      // Notifications
      notifications, unreadCount, markNotificationRead, markAllRead,
      // Requests
      cashRequests, addCashRequest,
      fertilizerRequests, addFertilizerRequest,
      itemRequests, addItemRequest,
      // News
      specialNews, newsShown, setNewsShown, dismissNews,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};

// ── Field mappers (backend → frontend shape) ───────────────────────────────────

function mapUser(u) {
  if (!u) return null;
  const img = u.profileImage || u.ProfileImage || u.image || null;
  return {
    id: String(u.regNo ?? u.id ?? ""),
    name: u.name ?? u.regName ?? "",
    username: u.username ?? "",
    image: img ? img.split('?')[0] : null, // clean base URL; version is managed separately
    address: u.address ?? u.Address ?? "",
    phone: u.phone ?? u.Phone ?? u.telNo ?? "",
    bankName: u.bankName ?? u.BankName ?? "",
    accountNumber: u.accountNumber ?? u.AccountNumber ?? "",
    accountHolder: u.accountHolder ?? u.AccountHolder ?? "",
    branch: u.branch ?? u.Branch ?? "",
  };
}

function mapCashRequest(r) {
  if (!r) return r;
  return {
    id: r.id,
    type: r.requestType ?? r.type ?? "",
    month: r.month ?? "",
    amount: Number(r.amount ?? 0),
    date: r.requestDate ? r.requestDate.split("T")[0] : (r.date ?? ""),
    status: r.status ?? "pending",
    createdAt: r.createdAt ?? new Date().toISOString(),
    requestedDate: r.requestDate ?? r.requestedDate ?? "",
    regNo: r.regNo,
    remarks: r.remarks ?? "",
  };
}

function mapFertilizerRequest(r) {
  if (!r) return r;
  return {
    id: r.id,
    month: r.month ?? "",
    fertType: r.fertilizerType ?? r.fertType ?? "",
    quantity: Number(r.quantity ?? 0),
    date: r.requestDate ? r.requestDate.split("T")[0] : (r.date ?? ""),
    status: r.status ?? "pending",
    createdAt: r.createdAt ?? new Date().toISOString(),
    requestedDate: r.requestDate ?? r.requestedDate ?? "",
    regNo: r.regNo,
    remarks: r.remarks ?? "",
  };
}

function mapItemRequest(r) {
  if (!r) return r;
  return {
    id: r.id,
    month: r.month ?? "",
    itemType: r.itemType ?? "",
    quantity: Number(r.quantity ?? 0),
    date: r.requestDate ? r.requestDate.split("T")[0] : (r.date ?? ""),
    status: r.status ?? "pending",
    createdAt: r.createdAt ?? new Date().toISOString(),
    requestedDate: r.requestDate ?? r.requestedDate ?? "",
    regNo: r.regNo,
    remarks: r.remarks ?? "",
  };
}
