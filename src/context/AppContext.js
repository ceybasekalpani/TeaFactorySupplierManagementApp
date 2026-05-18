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


const PROFILE_IMAGE_PATH_KEY = "profileImageLocalPath";
const PROFILE_IMAGE_DIR = (FileSystem.documentDirectory ?? "") + "profiles/";

const profileImagePathKey = (regNo) => `profileImageLocalPath_${regNo}`;

async function getStoredLocalImagePath(regNo) {
  try {
    if (!regNo) return null;
    const stored = await AsyncStorage.getItem(profileImagePathKey(regNo));
    if (!stored) return null;
    const info = await FileSystem.getInfoAsync(stored);
    return info.exists ? stored : null;
  } catch (_) {
    return null;
  }
}

async function activateLocalImagePath(newPath, regNo) {
  if (!regNo) return;
  try {
    const key = profileImagePathKey(regNo);
    const old = await AsyncStorage.getItem(key);
    if (old && old !== newPath) {
      FileSystem.deleteAsync(old, { idempotent: true }).catch(() => {});
    }
  } catch (_) {}
  await AsyncStorage.setItem(profileImagePathKey(regNo), newPath);
}

function newLocalImagePath() {
  return `${PROFILE_IMAGE_DIR}profile_${Date.now()}.jpg`;
}

async function copyPickedImageLocally(sourceUri, regNo) {
  try {
    await FileSystem.makeDirectoryAsync(PROFILE_IMAGE_DIR, { intermediates: true });
    const dest = newLocalImagePath();
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      await activateLocalImagePath(dest, regNo);
      return dest;
    }
    return null;
  } catch (e) {
    console.log("[profile] copyAsync failed:", e?.message || e);
    return null;
  }
}

async function downloadProfileImageViaBackend(token, regNo) {
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
        await activateLocalImagePath(dest, regNo);
        return dest;
      }
    }
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
  // "loading" | "authenticated" | "pin-required" | "unauthenticated"
  const [authState, setAuthState] = useState("loading");
  const [savedRegNo, setSavedRegNo] = useState(null);
  const [savedName, setSavedName] = useState(null);

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

  const tokenRef = useRef(null);
  tokenRef.current = token;
  const activeRegRef = useRef(null);
  activeRegRef.current = activeReg;

  // ── Restore session on startup ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const storedRegNo = await AsyncStorage.getItem("savedRegNo");
        const storedName  = await AsyncStorage.getItem("savedName");
        const isPinSet    = await AsyncStorage.getItem("isPinSet");
        const savedToken  = await tokenStorage.get();

        if (savedToken) {
          try {
            const user = await authApi.me(savedToken);
            const regs = await authApi.registrations(savedToken);

            setToken(savedToken);
            setCurrentUser(mapUser(user));
            setRegistrations(regs || []);

            const savedRegJson = await AsyncStorage.getItem("activeReg");
            let savedReg = null;
            if (savedRegJson) {
              savedReg = JSON.parse(savedRegJson);
              setActiveReg(savedReg);
            }

            await loadSettings(savedToken, savedReg?.regNo);
            await loadAppData(savedToken);

            const cachedImage = await AsyncStorage.getItem("profileImage");
            if (cachedImage) {
              setCurrentUser((prev) => prev ? { ...prev, image: prev.image || cachedImage } : prev);
            }

            // ── KEY CHANGE: even with a valid token, if a PIN is set we require
            // the user to verify with PIN on every cold start.
            if (storedRegNo && isPinSet === "true") {
              setSavedRegNo(storedRegNo);
              setSavedName(storedName || "");
              setAuthState("pin-required");
            } else {
              setAuthState("authenticated");
            }
          } catch (_) {
            // Token expired — fall back to PIN if available
            await tokenStorage.remove();
            if (storedRegNo && isPinSet === "true") {
              setSavedRegNo(storedRegNo);
              setSavedName(storedName || "");
              setAuthState("pin-required");
            } else {
              setAuthState("unauthenticated");
            }
          }
        } else if (storedRegNo && isPinSet === "true") {
          setSavedRegNo(storedRegNo);
          setSavedName(storedName || "");
          setAuthState("pin-required");
        } else {
          setAuthState("unauthenticated");
        }
      } catch (_) {
        setAuthState("unauthenticated");
      }
    })();
  }, []);

  // ── Settings loader ──────────────────────────────────────────────────────────
  const loadSettings = async (tok, regNo) => {
    try {
      const s = await settingsApi.get(tok);
      if (!s) return;

      const themeVal   = s.theme || s.Theme;
      const lang       = s.language || s.Language;
      const fSize      = s.fontSize ?? s.FontSize;
      const remoteImage = s.profileImage || s.ProfileImage || s.imageUrl;

      if (themeVal) setTheme(themeVal);
      if (lang) setLanguage(lang);
      if (fSize !== undefined) setFontSize(Number(fSize));

      let imageToUse = null;
      const localExists = regNo ? await getStoredLocalImagePath(regNo) : null;
      if (localExists) {
        imageToUse = localExists;
      } else if (remoteImage) {
        const downloaded = regNo ? await downloadProfileImageViaBackend(tok, regNo) : null;
        imageToUse = downloaded || remoteImage.split('?')[0];
      }

      setCurrentUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          name:          s.name          || s.Name          || prev.name,
          address:       s.address       || s.Address       || prev.address,
          phone:         s.phone         || s.Phone         || prev.phone,
          phone2:        s.phone2        || s.Phone2        || prev.phone2  || "",
          phone3:        s.phone3        || s.Phone3        || prev.phone3  || "",
          bankName:      s.bankName      || s.BankName      || prev.bankName,
          accountNumber: s.accountNumber || s.AccountNumber || prev.accountNumber,
          image: imageToUse !== null ? imageToUse : prev.image,
        };
      });
    } catch (err) {
      console.error("[loadSettings] error:", err);
    }
  };

  // ── App data loader ──────────────────────────────────────────────────────────
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

  /**
   * Password login. After success the caller should always navigate to
   * /(auth)/pin-setup so the user sets (or re-confirms) their PIN.
   * Returns { user, registrations, token, hasPinSet } on success.
   */
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
    await loadSettings(result.token, result.regNo ?? username);

    // Persist identity for PIN screen
    const regNoStr = result.regNo ?? username;
    const nameStr  = result.name  ?? mappedUser.name ?? "";
    await AsyncStorage.setItem("savedRegNo", regNoStr);
    await AsyncStorage.setItem("savedName",  nameStr);
    setSavedRegNo(regNoStr);
    setSavedName(nameStr);

    // Do NOT set authState to "authenticated" here — the PIN setup/entry
    // screen will do that once the PIN is confirmed.

    return {
      user:          mappedUser,
      registrations: Array.isArray(regs) ? regs : [],
      token:         result.token,
      hasPinSet:     result.hasPinSet ?? false,
    };
  };

  /**
   * Save PIN for the currently logged-in user and mark it as set.
   */
  const setupPin = async (pin) => {
    await authApi.setupPin(tokenRef.current, pin);
    await AsyncStorage.setItem("isPinSet", "true");
  };

  /**
   * PIN login. Verifies PIN server-side, refreshes token, returns
   * { user, registrations, token } on success.
   */
  const pinLogin = async (regNo, pin) => {
    const result = await authApi.pinLogin(regNo, pin);
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

    return {
      user:          mappedUser,
      registrations: Array.isArray(regs) ? regs : [],
      token:         result.token,
    };
  };

  /**
   * Called after a registration is chosen (or when there is only one).
   * Loads settings + all app data then sets authState → "authenticated".
   */
  const login = async (reg, tok) => {
    const activeTok = tok || tokenRef.current;
    setActiveReg(reg);
    setNewsShown(false);
    setCurrentUser((prev) => prev ? { ...prev, image: null } : prev);
    await AsyncStorage.setItem("activeReg", JSON.stringify(reg));
    await loadSettings(activeTok, reg?.regNo);
    await loadAppData(activeTok);
    setAuthState("authenticated");
  };

  /**
   * Reset PIN: clears isPinSet flag and returns to unauthenticated so the
   * user has to go through password login → pin-setup again.
   */
  const resetPin = async () => {
    await AsyncStorage.removeItem("isPinSet");
    await tokenStorage.remove();
    setToken(null);
    setCurrentUser(null);
    setActiveReg(null);
    setRegistrations([]);
    setAuthState("unauthenticated");
  };

  const logout = async () => {
    await tokenStorage.remove();
    await AsyncStorage.removeItem("activeReg");
    await AsyncStorage.removeItem("profileImage");
    try {
      const regsToClean = registrations.length > 0 ? registrations : (activeReg ? [activeReg] : []);
      for (const reg of regsToClean) {
        const key = profileImagePathKey(reg.regNo);
        const localPath = await AsyncStorage.getItem(key);
        if (localPath) FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
        await AsyncStorage.removeItem(key);
      }
    } catch (_) {}
    try {
      const oldPath = await AsyncStorage.getItem(PROFILE_IMAGE_PATH_KEY);
      if (oldPath) FileSystem.deleteAsync(oldPath, { idempotent: true }).catch(() => {});
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

    // Keep savedRegNo / savedName / isPinSet — user can re-enter PIN to get back in
    const isPinSet = await AsyncStorage.getItem("isPinSet");
    if (isPinSet === "true") {
      setAuthState("pin-required");
    } else {
      setAuthState("unauthenticated");
    }
  };

  const updateProfile = async (data) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        name:          data.name          ?? prev.name,
        address:       data.address       ?? prev.address,
        phone:         data.phone         ?? prev.phone,
        phone2:        data.phone2        ?? prev.phone2 ?? "",
        phone3:        data.phone3        ?? prev.phone3 ?? "",
        bankName:      data.bankName      ?? prev.bankName,
        accountNumber: data.accountNumber ?? prev.accountNumber,
        accountHolder: data.accountHolder ?? prev.accountHolder,
        branch:        data.branch        ?? prev.branch,
      };
    });

    let uploadedImageUrl = null;

    if (data.imageAsset) {
      try {
        const result = await settingsApi.updateProfileImage(tokenRef.current, data.imageAsset);
        const remoteUrl = result?.imageUrl || result?.profileImage || result?.url || result?.imagePath;
        if (remoteUrl) {
          setCurrentUser((prev) => prev ? { ...prev, image: data.imageAsset.uri } : prev);

          const regNo = activeRegRef.current?.regNo;
          let localPath = await copyPickedImageLocally(data.imageAsset.uri, regNo);
          if (!localPath) {
            localPath = await downloadProfileImageViaBackend(tokenRef.current, regNo);
          }

          const displayUrl = localPath || remoteUrl;
          uploadedImageUrl = displayUrl;
          setCurrentUser((prev) => prev ? { ...prev, image: displayUrl } : prev);
        }
        await loadSettings(tokenRef.current, activeRegRef.current?.regNo);
      } catch (err) {
        console.log("[updateProfile] image upload error:", err?.message || err);
        await loadSettings(tokenRef.current, activeRegRef.current?.regNo);
        throw err;
      }
    }

    if (data.address !== undefined || data.phone !== undefined || data.name !== undefined || data.phone2 !== undefined || data.phone3 !== undefined) {
      await settingsApi.updateSettings(tokenRef.current, {
        name:    data.name,
        address: data.address,
        phone:   data.phone,
        phone2:  data.phone2,
        phone3:  data.phone3,
      });
    }

    if (data.bankName !== undefined || data.accountNumber !== undefined ||
        data.accountHolder !== undefined || data.branch !== undefined) {
      await settingsApi.updateAccountDetails(tokenRef.current, {
        bankName:      data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        branch:        data.branch,
      });
    }

    return uploadedImageUrl;
  };

  // ── Leaf data ────────────────────────────────────────────────────────────────
  const getLeafData = (monthKey) => leafCache[monthKey];

  const fetchLeafData = async (monthKey) => {
    const tok = tokenRef.current;
    if (!tok) return;
    try {
      const [year, month] = monthKey.split("-").map(Number);
      const data = await leafApi.monthly(tok, year, month);
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
    try { await notificationApi.markRead(tokenRef.current, id); } catch (_) {}
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await notificationApi.markAllRead(tokenRef.current); } catch (_) {}
  };

  const removeNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try { await notificationApi.dismiss(tokenRef.current, id); } catch (_) {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── News actions ─────────────────────────────────────────────────────────────
  const dismissNews = async (id) => {
    setSpecialNews((prev) => prev.filter((n) => n.id !== String(id)));
    try { await newsApi.dismiss(tokenRef.current, id); } catch (_) {}
  };

  // ── Request actions ──────────────────────────────────────────────────────────
  const addCashRequest = async (requestData) => {
    const result = await cashApi.create(tokenRef.current, {
      requestType: requestData.type,
      month:       requestData.month,
      amount:      Number(requestData.amount),
    });
    const mapped = mapCashRequest(result);
    setCashRequests((prev) => [mapped, ...prev]);
    return mapped;
  };

  const addFertilizerRequest = async (requestData) => {
    const result = await fertilizerApi.create(tokenRef.current, {
      fertilizerType: requestData.fertilizerType ?? requestData.fertType,
      month:          requestData.month,
      quantity:       Number(requestData.quantity),
    });
    const mapped = mapFertilizerRequest(result);
    setFertilizerRequests((prev) => [mapped, ...prev]);
    return mapped;
  };

  const addItemRequest = async (requestData) => {
    const result = await itemApi.create(tokenRef.current, {
      itemType: requestData.itemType,
      month:    requestData.month,
      quantity: Number(requestData.quantity),
    });
    const mapped = mapItemRequest(result);
    setItemRequests((prev) => [mapped, ...prev]);
    return mapped;
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
      authState, savedRegNo, savedName,
      currentUser, activeReg, registrations,
      signIn, login, logout, setupPin, pinLogin, resetPin, updateProfile,
      // Leaf
      getLeafData, fetchLeafData, getTodayLeaf, getTodayLeafData, getSixMonthHistory,
      // Feature flags
      getFeatureFlags,
      // Notifications
      notifications, unreadCount, markNotificationRead, markAllRead, removeNotification,
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

// ── Field mappers ──────────────────────────────────────────────────────────────

function mapUser(u) {
  if (!u) return null;
  const img = u.profileImage || u.ProfileImage || u.image || null;
  return {
    id:            String(u.regNo ?? u.id ?? ""),
    name:          u.name          ?? u.regName ?? "",
    username:      u.username      ?? "",
    image:         img ? img.split('?')[0] : null,
    address:       u.address       ?? u.Address ?? "",
    phone:         u.phone         ?? u.Phone   ?? u.telNo ?? "",
    phone2:        u.phone2        ?? u.Phone2  ?? "",
    phone3:        u.phone3        ?? u.Phone3  ?? "",
    bankName:      u.bankName      ?? u.BankName      ?? "",
    accountNumber: u.accountNumber ?? u.AccountNumber ?? "",
    accountHolder: u.accountHolder ?? u.AccountHolder ?? "",
    branch:        u.branch        ?? u.Branch        ?? "",
  };
}

function mapCashRequest(r) {
  if (!r) return r;
  return {
    id:            r.id,
    type:          r.requestType    ?? r.type   ?? "",
    month:         r.month          ?? "",
    amount:        Number(r.amount  ?? 0),
    date:          r.requestDate    ? r.requestDate.split("T")[0] : (r.date ?? ""),
    status:        r.status         ?? "pending",
    createdAt:     r.createdAt      ?? new Date().toISOString(),
    requestedDate: r.requestDate    ?? r.requestedDate ?? "",
    regNo:         r.regNo,
    remarks:       r.remarks        ?? "",
  };
}

function mapFertilizerRequest(r) {
  if (!r) return r;
  return {
    id:            r.id,
    month:         r.month          ?? "",
    fertType:      r.fertilizerType ?? r.fertType ?? "",
    quantity:      Number(r.quantity ?? 0),
    date:          r.requestDate    ? r.requestDate.split("T")[0] : (r.date ?? ""),
    status:        r.status         ?? "pending",
    createdAt:     r.createdAt      ?? new Date().toISOString(),
    requestedDate: r.requestDate    ?? r.requestedDate ?? "",
    regNo:         r.regNo,
    remarks:       r.remarks        ?? "",
  };
}

function mapItemRequest(r) {
  if (!r) return r;
  return {
    id:            r.id,
    month:         r.month     ?? "",
    itemType:      r.itemType  ?? "",
    quantity:      Number(r.quantity ?? 0),
    date:          r.requestDate ? r.requestDate.split("T")[0] : (r.date ?? ""),
    status:        r.status    ?? "pending",
    createdAt:     r.createdAt ?? new Date().toISOString(),
    requestedDate: r.requestDate ?? r.requestedDate ?? "",
    regNo:         r.regNo,
    remarks:       r.remarks   ?? "",
  };
}