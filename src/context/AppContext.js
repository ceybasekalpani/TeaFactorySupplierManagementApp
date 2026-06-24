import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { API_BASE_URL } from "../constants/config";
import {
  accountSummaryApi,
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
import {
  listenForPushTokenChanges,
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "../services/pushNotificationService";

const AppContext = createContext(null);

const PROFILE_IMAGE_PATH_KEY = "profileImageLocalPath";
const PROFILE_IMAGE_DIR = (FileSystem.documentDirectory ?? "") + "profiles/";

const profileImagePathKey = (regNo) => `profileImageLocalPath_${regNo}`;

function normalizeNotificationType(value) {
  const type = String(value ?? "info").toLowerCase();
  if (type === "approved" || type === "approve" || type === "success") return "success";
  if (type === "rejected" || type === "reject" || type === "failed" || type === "error") return "error";
  if (type === "warning" || type === "warn") return "warning";
  return "info";
}

function getPushNotificationType(data = {}) {
  const eventType = String(data.eventType ?? data.EventType ?? "").toLowerCase();
  const type = String(data.notificationType ?? data.NotificationType ?? data.type ?? data.Type ?? "").toLowerCase();
  const status = String(data.status ?? data.Status ?? "").toLowerCase();

  if (status) return normalizeNotificationType(status);
  if (eventType) return normalizeNotificationType(eventType);
  if (type === "notification" || type === "news" || type.includes("_changed")) return "info";
  return normalizeNotificationType(type);
}

function formatRequestType(value) {
  const requestType = String(value ?? "request").trim().toLowerCase();
  if (requestType === "advance" || requestType === "cash") return "Advance";
  if (requestType === "fertilizer") return "Fertilizer";
  if (requestType === "items" || requestType === "item") return "Item";
  return requestType ? requestType.charAt(0).toUpperCase() + requestType.slice(1) : "Request";
}

function formatStatus(value) {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Updated";
}

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

export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeReg, setActiveReg] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [authState, setAuthState] = useState("loading");
  const [savedRegNo, setSavedRegNo] = useState(null);
  const [savedName, setSavedName] = useState(null);

  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("english");
  const [fontSize, setFontSize] = useState(50);

  const [leafCache, setLeafCache] = useState({});
  const [sixMonthHistory, setSixMonthHistory] = useState([]);
  const [twelveMonthHistory, setTwelveMonthHistory] = useState([]);   // NEW
  const [monthlyRequestsSummary, setMonthlyRequestsSummary] = useState([]); // NEW
  const [todayLeafTotal, setTodayLeafTotal] = useState(0);
  const [todayLeafData, setTodayLeafData] = useState({ normalNet: 0, superNet: 0, hasSuper: false });
  const [featureFlags, setFeatureFlags] = useState({ cash: true, fertilizer: true, item: true });
  const [notifications, setNotifications] = useState([]);
  const [cashRequests, setCashRequests] = useState([]);
  const [fertilizerRequests, setFertilizerRequests] = useState([]);
  const [itemRequests, setItemRequests] = useState([]);
  const [fertilizerTypes, setFertilizerTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [supplyTypesLoading, setSupplyTypesLoading] = useState(false);
  const [specialNews, setSpecialNews] = useState([]);
  const [newsShown, setNewsShown] = useState(false);

  const tokenRef = useRef(null);
  tokenRef.current = token;
  const activeRegRef = useRef(null);
  activeRegRef.current = activeReg;
  const specialNewsIdsRef = useRef("");
  const sessionLockPausedUntilRef = useRef(0);
  const communicationsLoadingRef = useRef(false);
  const requestsLoadingRef = useRef(false);
  const supplyTypesLoadingRef = useRef(false);

  const refreshCommunications = useCallback(async (tok = tokenRef.current) => {
    if (!tok) return Promise.resolve();
    if (communicationsLoadingRef.current) return Promise.resolve();

    communicationsLoadingRef.current = true;
    try {
      return await Promise.allSettled([
        loadNotifications(tok),
        loadSpecialNews(tok),
      ]);
    } finally {
      communicationsLoadingRef.current = false;
    }
  // These loaders read no render-time values; this callback just gives screens a stable refresh command.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshRequests = useCallback(async (tok = tokenRef.current) => {
    if (!tok) return Promise.resolve();
    if (requestsLoadingRef.current) return Promise.resolve();

    requestsLoadingRef.current = true;
    try {
      return await Promise.allSettled([
        loadCashRequests(tok),
        loadFertilizerRequests(tok),
        loadItemRequests(tok),
        loadMonthlyRequestsSummary(tok),
      ]);
    } finally {
      requestsLoadingRef.current = false;
    }
  // These loaders read no render-time values; this callback just gives screens/listeners a stable refresh command.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSupplyTypes = useCallback(async (tok = tokenRef.current) => {
    if (!tok) return;
    if (supplyTypesLoadingRef.current) return;

    supplyTypesLoadingRef.current = true;
    setSupplyTypesLoading(true);
    try {
      const [fertilizerResult, itemResult] = await Promise.allSettled([
        fertilizerApi.types(tok),
        itemApi.types(tok),
      ]);

      if (fertilizerResult.status === "fulfilled" && Array.isArray(fertilizerResult.value)) {
        setFertilizerTypes(fertilizerResult.value);
      } else if (fertilizerResult.status === "rejected") {
        console.log("[configuration] Failed to load fertilizer types:", fertilizerResult.reason?.message || fertilizerResult.reason);
      }

      if (itemResult.status === "fulfilled" && Array.isArray(itemResult.value)) {
        setItemTypes(itemResult.value);
      } else if (itemResult.status === "rejected") {
        console.log("[configuration] Failed to load item types:", itemResult.reason?.message || itemResult.reason);
      }
    } finally {
      supplyTypesLoadingRef.current = false;
      setSupplyTypesLoading(false);
    }
  }, []);

  const applyRequestStatusChange = useCallback((payload = {}) => {
    const requestType = String(payload.requestType ?? payload.RequestType ?? "").toLowerCase();
    const requestId = Number(payload.requestId ?? payload.RequestId);
    const status = String(payload.status ?? payload.Status ?? "").toLowerCase();

    if (!requestId || !status) return;

    const updateMatchingRequest = (request) => (
      Number(request?.id) === requestId
        ? { ...request, status, updatedAt: new Date().toISOString() }
        : request
    );

    if (requestType === "advance" || requestType === "cash") {
      setCashRequests((prev) => prev.map(updateMatchingRequest));
      return;
    }

    if (requestType === "fertilizer") {
      setFertilizerRequests((prev) => prev.map(updateMatchingRequest));
      return;
    }

    if (requestType === "items" || requestType === "item") {
      setItemRequests((prev) => prev.map(updateMatchingRequest));
    }
  }, []);

  const addPushNotification = useCallback(({ content = {}, data = {} } = {}) => {
    const status = String(data.status ?? data.Status ?? "").toLowerCase();
    const requestType = String(data.requestType ?? data.RequestType ?? "request").toLowerCase();
    const requestId = data.requestId ?? data.RequestId ?? "";
    const displayRequestType = formatRequestType(requestType);
    const displayStatus = formatStatus(status);
    const requestSummary = data.requestSummary ?? data.RequestSummary ?? data.summary ?? data.Summary ?? "";
    const remarks = data.remarks ?? data.Remarks ?? "";
    const fallbackTitle = status === "approved" || status === "rejected"
      ? `${displayRequestType} request ${displayStatus}`
      : "Notification";
    const title = content.title ?? data.title ?? data.Title ?? fallbackTitle;
    const message =
      content.body ??
      data.message ??
      data.Message ??
      data.body ??
      data.Body ??
      (requestSummary
        ? `Your ${displayRequestType.toLowerCase()} request (${requestSummary}) has been ${displayStatus.toLowerCase()}.`
        : remarks || `Your ${displayRequestType.toLowerCase()} request has been ${displayStatus.toLowerCase()}.`);
    const id = String(data.notificationId ?? data.NotificationId ?? `push-${requestType}-${requestId}-${status}-${Date.now()}`);

    setNotifications((prev) => {
      if (prev.some((n) => n.id === id)) return prev;
      return [{
        id,
        title,
        message,
        type: getPushNotificationType(data),
        createdAt: new Date().toISOString(),
        read: false,
      }, ...prev];
    });
  }, []);

  useEffect(() => {
    if (!token || authState !== "authenticated") return;

    let pushTokenSubscription = null;

    registerForPushNotificationsAsync(token)
      .then(() => {
        pushTokenSubscription = listenForPushTokenChanges(token);
      })
      .catch((error) => {
        console.log("[push] Registration failed:", error?.message || error);
      });

    const cleanupNotificationListeners = setupNotificationListeners({
      refreshNotifications: () => loadNotifications(tokenRef.current),
      refreshNews: () => loadSpecialNews(tokenRef.current),
      refreshRequests: () => refreshRequests(tokenRef.current),
      refreshConfiguration: () => refreshSupplyTypes(tokenRef.current),
      onRequestStatusChanged: applyRequestStatusChange,
      onPushNotificationReceived: addPushNotification,
    });

    return () => {
      pushTokenSubscription?.remove?.();
      cleanupNotificationListeners?.();
    };
  // Push callbacks read the current token from refs so they stay valid after refreshes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authState, addPushNotification, applyRequestStatusChange, refreshRequests, refreshSupplyTypes]);

  useEffect(() => {
    if (!token || authState !== "authenticated") return;

    refreshSupplyTypes();
    const intervalId = setInterval(refreshSupplyTypes, 60000);
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshSupplyTypes();
      }
    });

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  // Polling keeps fertilizer/item configuration current in Expo Go, where native FCM is unavailable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authState]);

  useEffect(() => {
    if (!token || authState !== "authenticated") return;

    refreshRequests();
    const intervalId = setInterval(refreshRequests, 30000);
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshRequests();
      }
    });

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  // Polling keeps request approval/rejection state current in Expo Go, where native FCM is unavailable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authState]);

  useEffect(() => {
    if (!token || authState !== "authenticated") return;

    refreshCommunications();
    const intervalId = setInterval(refreshCommunications, 45000);
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshCommunications();
      }
    });

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  // Polling keeps in-app notifications current in Expo Go, where native FCM is unavailable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authState]);

  useEffect(() => {
    (async () => {
      try {
        const storedRegNo = await AsyncStorage.getItem("savedRegNo");
        const storedName  = await AsyncStorage.getItem("savedName");
        if (storedRegNo) {
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

  const loadSettings = async (tok, regNo) => {
    try {
      const s = await settingsApi.get(tok);
      if (!s) return;

      const themeVal    = s.theme    || s.Theme;
      const lang        = s.language || s.Language;
      const fSize       = s.fontSize ?? s.FontSize;
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
        imageToUse = downloaded || remoteImage.split("?")[0];
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

  const loadAppData = useCallback(async (tok) => {
    if (!tok) return;
    await Promise.allSettled([
      loadNotifications(tok),
      loadCashRequests(tok),
      loadFertilizerRequests(tok),
      loadItemRequests(tok),
      refreshSupplyTypes(tok),
      loadTodayLeaf(tok),
      loadHistory(tok),
      loadAnnualHistory(tok),          // NEW
      loadMonthlyRequestsSummary(tok), // NEW
      loadFeatureFlags(tok),
    ]);
  }, []);

  const NOTIFICATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

  const loadNotifications = async (tok) => {
    try {
      const data = await notificationApi.list(tok);
      const cutoff = Date.now() - NOTIFICATION_MAX_AGE_MS;
      setNotifications(
        Array.isArray(data)
          ? data
              .filter((n) => {
                const createdAt = n.createdAt ?? n.CreatedAt ?? n.createdDate ?? n.CreatedDate ?? n.sentAt ?? n.SentAt;
                return !createdAt || new Date(createdAt).getTime() >= cutoff;
              })
              .map((n) => ({
                id:        n.id ?? n.Id ?? n.notificationId ?? n.NotificationId,
                title:     n.title ?? n.Title ?? "",
                message:   n.message ?? n.Message ?? n.body ?? n.Body ?? n.content ?? n.Content ?? "",
                type:      normalizeNotificationType(n.type ?? n.Type ?? n.status ?? n.Status),
                createdAt: n.createdAt ?? n.CreatedAt ?? n.createdDate ?? n.CreatedDate ?? n.sentAt ?? n.SentAt ?? null,
                read:      n.isRead ?? n.IsRead ?? n.read ?? n.Read ?? false,
              }))
          : []
      );
    } catch (error) {
      console.log("[communications] Failed to load notifications:", error?.message || error);
    }
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

  const mapNews = (n) => {
    const content = n.content ?? n.Content ?? "";
    const message = n.message ?? n.Message ?? "";
    const description = n.description ?? n.Description ?? "";

    return {
      id:          String(n.id ?? n.Id ?? n.newsId ?? n.NewsId ?? ""),
      title:       n.title ?? n.Title ?? "",
      content,
      message:     content || message || description,
      description,
      showPopup:   n.showPopup ?? n.ShowPopup ?? true,
      createdAt:   n.createdAt ?? n.CreatedAt ?? null,
    };
  };

  const loadSpecialNews = async (tok) => {
    try {
      const data = await newsApi.activePopup(tok);
      let mappedNews = [];
      if (!data) {
        mappedNews = [];
      } else if (Array.isArray(data)) {
        mappedNews = data.map(mapNews);
      } else {
        mappedNews = [mapNews(data)];
      }

      mappedNews = mappedNews.filter((n) => n.id && n.showPopup !== false && (n.title || n.message));

      const ids = mappedNews.map((n) => n.id).join(",");
      if (ids && ids !== specialNewsIdsRef.current) {
        setNewsShown(false);
      }
      specialNewsIdsRef.current = ids;
      setSpecialNews(mappedNews);
    } catch (error) {
      console.log("[communications] Failed to load news:", error?.message || error);
    }
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

  // NEW — load 12-month leaf history
  const loadAnnualHistory = async (tok) => {
    try {
      const data = await leafApi.historyAnnual(tok);
      setTwelveMonthHistory(
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

  // NEW — load monthly requests summary (6 months by default; we load 12 so
  //        the history screen can filter without re-fetching)
  const loadMonthlyRequestsSummary = async (tok) => {
    try {
      const data = await accountSummaryApi.monthlyRequests(tok, 12);
      setMonthlyRequestsSummary(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

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

    const regNoStr = result.regNo ?? username;
    const nameStr  = result.name  ?? mappedUser.name ?? "";
    await AsyncStorage.setItem("savedRegNo", regNoStr);
    await AsyncStorage.setItem("savedName",  nameStr);
    setSavedRegNo(regNoStr);
    setSavedName(nameStr);

    return {
      user:          mappedUser,
      registrations: Array.isArray(regs) ? regs : [],
      token:         result.token,
      isCreatePin:   result.isCreatePin ?? false,
    };
  };

  const setupPin = async (pin) => {
    await authApi.setupPin(tokenRef.current, pin);
  };

  const changePin = async (currentPin, newPin) => {
    return await authApi.changePin(tokenRef.current, currentPin, newPin);
  };

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

  const login = async (reg, tok) => {
    const activeTok = tok || tokenRef.current;
    setActiveReg(reg);
    setNewsShown(false);
    setCurrentUser((prev) => prev ? { ...prev, image: null } : prev);
    await AsyncStorage.setItem("activeReg", JSON.stringify(reg));
    await loadSettings(activeTok, reg?.regNo);
    setAuthState("authenticated");
    loadAppData(activeTok).catch((error) => {
      console.log("[startup] Failed to load initial app data:", error?.message || error);
    });
  };

  const pauseSessionLock = (durationMs = 60000) => {
    sessionLockPausedUntilRef.current = Date.now() + durationMs;
  };

  const lockSession = () => {
    if (Date.now() < sessionLockPausedUntilRef.current) return;
    setAuthState((prev) => (prev === "authenticated" ? "pin-required" : prev));
  };

  const resetPin = async () => {
    await AsyncStorage.removeItem("savedRegNo");
    await AsyncStorage.removeItem("savedName");
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
    setTwelveMonthHistory([]);        // NEW
    setMonthlyRequestsSummary([]);    // NEW
    setTodayLeafTotal(0);
    setNotifications([]);
    setCashRequests([]);
    setFertilizerRequests([]);
    setItemRequests([]);
    setFertilizerTypes([]);
    setItemTypes([]);
    setSpecialNews([]);
    setNewsShown(false);

    const storedRegNo = await AsyncStorage.getItem("savedRegNo");
    if (storedRegNo) {
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

    if (data.address !== undefined || data.phone !== undefined || data.name !== undefined ||
        data.phone2 !== undefined || data.phone3 !== undefined) {
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

  const getTodayLeaf              = () => todayLeafTotal;
  const getTodayLeafData          = () => todayLeafData;
  const getSixMonthHistory        = () => sixMonthHistory;
  const getTwelveMonthHistory     = () => twelveMonthHistory;         // NEW
  const getMonthlyRequestsSummary = () => monthlyRequestsSummary;     // NEW
  const getFeatureFlags           = () => featureFlags;

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

  const dismissNews = async (id) => {
    setSpecialNews((prev) => prev.filter((n) => n.id !== String(id)));
    try { await newsApi.dismiss(tokenRef.current, id); } catch (_) {}
  };

  const addCashRequest = async (requestData) => {
    const result = await cashApi.create(tokenRef.current, {
      requestType: requestData.type,
      month:       requestData.month,
      amount:      Number(requestData.amount),
    });
    const mapped = mapCashRequest(result);
    setCashRequests((prev) => [mapped, ...prev]);
    // Refresh summary so the new request appears immediately
    loadMonthlyRequestsSummary(tokenRef.current).catch(() => {});
    return mapped;
  };

  const deleteCashRequest = async (id) => {
    await cashApi.delete(tokenRef.current, id);
    setCashRequests((prev) => prev.filter((r) => r.id !== id));
    loadMonthlyRequestsSummary(tokenRef.current).catch(() => {});
  };

  const addFertilizerRequest = async (requestData) => {
    const result = await fertilizerApi.create(tokenRef.current, {
      fertilizerType: requestData.fertilizerType ?? requestData.fertType,
      month:          requestData.month,
      unit:           requestData.unit,
      quantity:       Number(requestData.quantity),
    });
    const mapped = mapFertilizerRequest(result);
    setFertilizerRequests((prev) => [mapped, ...prev]);
    loadMonthlyRequestsSummary(tokenRef.current).catch(() => {});
    return mapped;
  };

  const deleteFertilizerRequest = async (id) => {
    await fertilizerApi.delete(tokenRef.current, id);
    setFertilizerRequests((prev) => prev.filter((r) => r.id !== id));
    loadMonthlyRequestsSummary(tokenRef.current).catch(() => {});
  };

  const addItemRequest = async (requestData) => {
    const result = await itemApi.create(tokenRef.current, {
      itemType: requestData.itemType,
      month:    requestData.month,
      quantity: Number(requestData.quantity),
      unit:     requestData.unit ?? "units",
    });
    const mapped = mapItemRequest(result);
    setItemRequests((prev) => [mapped, ...prev]);
    loadMonthlyRequestsSummary(tokenRef.current).catch(() => {});
    return mapped;
  };

  const deleteItemRequest = async (id) => {
    await itemApi.delete(tokenRef.current, id);
    setItemRequests((prev) => prev.filter((r) => r.id !== id));
    loadMonthlyRequestsSummary(tokenRef.current).catch(() => {});
  };

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

  const isDark = theme === "dark";

  return (
    <AppContext.Provider value={{
      theme, isDark, updateTheme,
      language, updateLanguage,
      fontSize, updateFontSize,
      authState, savedRegNo, savedName,
      currentUser, activeReg, registrations,
      signIn, login, logout, setupPin, changePin, pinLogin, resetPin, updateProfile,
      lockSession, pauseSessionLock,
      getLeafData, fetchLeafData,
      getTodayLeaf, getTodayLeafData,
      getSixMonthHistory,
      getTwelveMonthHistory,         // NEW
      getMonthlyRequestsSummary,     // NEW
      getFeatureFlags,
      refreshCommunications, refreshRequests, refreshSupplyTypes,
      notifications, unreadCount, markNotificationRead, markAllRead, removeNotification,
      cashRequests, addCashRequest, deleteCashRequest,
      fertilizerRequests, addFertilizerRequest, deleteFertilizerRequest,
      itemRequests, addItemRequest, deleteItemRequest,
      fertilizerTypes, itemTypes, supplyTypesLoading,
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

function mapUser(u) {
  if (!u) return null;
  const img = u.profileImage || u.ProfileImage || u.image || null;
  return {
    id:            String(u.regNo ?? u.id ?? ""),
    name:          u.name          ?? u.regName ?? "",
    username:      u.username      ?? "",
    image:         img ? img.split("?")[0] : null,
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
    id:            r.id ?? r.Id,
    requestNo:     r.requestNo ?? r.RequestNo ?? "",
    type:          r.requestType ?? r.RequestType ?? r.type ?? r.Type ?? "advance",
    month:         r.month ?? r.Month ?? "",
    amount:        Number(r.amount ?? r.Amount ?? 0),
    date:          (r.requestDate ?? r.RequestDate) ? String(r.requestDate ?? r.RequestDate).split("T")[0] : (r.date ?? r.Date ?? ""),
    status:        String(r.status ?? r.Status ?? "pending").toLowerCase(),
    createdAt:     r.createdAt ?? r.CreatedAt ?? r.requestDate ?? r.RequestDate ?? new Date().toISOString(),
    updatedAt:     r.updatedAt ?? r.UpdatedAt ?? null,
    requestedDate: r.requestDate ?? r.RequestDate ?? r.requestedDate ?? r.RequestedDate ?? "",
    regNo:         r.regNo ?? r.RegNo,
    remarks:       r.remarks ?? r.Remarks ?? "",
  };
}

function mapFertilizerRequest(r) {
  if (!r) return r;
  return {
    id:             r.id ?? r.Id,
    requestNo:      r.requestNo ?? r.RequestNo ?? "",
    month:          r.month ?? r.Month ?? "",
    fertType:       r.fertilizerType ?? r.FertilizerType ?? r.fertType ?? r.Type ?? "",
    fertilizerType: r.fertilizerType ?? r.FertilizerType ?? r.fertType ?? r.Type ?? "",
    quantity:       Number(r.quantity ?? r.Quantity ?? r.qty ?? r.Qty ?? 0),
    unit:           r.unit ?? r.Unit ?? "kg",
    date:           (r.requestDate ?? r.RequestDate) ? String(r.requestDate ?? r.RequestDate).split("T")[0] : (r.date ?? r.Date ?? ""),
    status:         String(r.status ?? r.Status ?? "pending").toLowerCase(),
    createdAt:      r.createdAt ?? r.CreatedAt ?? r.requestDate ?? r.RequestDate ?? new Date().toISOString(),
    updatedAt:      r.updatedAt ?? r.UpdatedAt ?? null,
    requestedDate:  r.requestDate ?? r.RequestDate ?? r.requestedDate ?? r.RequestedDate ?? "",
    regNo:          r.regNo ?? r.RegNo,
    remarks:        r.remarks ?? r.Remarks ?? "",
  };
}

function mapItemRequest(r) {
  if (!r) return r;
  return {
    id:            r.id ?? r.Id,
    requestNo:     r.requestNo ?? r.RequestNo ?? "",
    month:         r.month ?? r.Month ?? "",
    itemType:      r.itemType ?? r.ItemType ?? r.type ?? r.Type ?? "",
    quantity:      Number(r.quantity ?? r.Quantity ?? r.qty ?? r.Qty ?? 0),
    unit:          r.unit ?? r.Unit ?? "units",
    date:          (r.requestDate ?? r.RequestDate) ? String(r.requestDate ?? r.RequestDate).split("T")[0] : (r.date ?? r.Date ?? ""),
    status:        String(r.status ?? r.Status ?? "pending").toLowerCase(),
    createdAt:     r.createdAt ?? r.CreatedAt ?? r.requestDate ?? r.RequestDate ?? new Date().toISOString(),
    updatedAt:     r.updatedAt ?? r.UpdatedAt ?? null,
    requestedDate: r.requestDate ?? r.RequestDate ?? r.requestedDate ?? r.RequestedDate ?? "",
    regNo:         r.regNo ?? r.RegNo,
    remarks:       r.remarks ?? r.Remarks ?? "",
  };
}
