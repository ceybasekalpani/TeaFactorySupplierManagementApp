import { useEffect } from "react";
import { AppState } from "react-native";
import {
  listenForPushTokenChanges,
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "../services/pushNotificationService";
import { useAuthStore } from "../store/authStore";
import { useCommunicationsStore } from "../store/communicationsStore";
import { useLeafStore } from "../store/leafStore";
import { useRequestsStore } from "../store/requestsStore";
import { useSettingsStore } from "../store/settingsStore";
import { useSupplyTypesStore } from "../store/supplyTypesStore";


export function AppProvider({ children }) {
  const token = useAuthStore((s) => s.token);
  const authState = useAuthStore((s) => s.authState);
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  const refreshRequests = useRequestsStore((s) => s.refreshRequests);
  const applyRequestStatusChange = useRequestsStore((s) => s.applyRequestStatusChange);
  const refreshCommunications = useCommunicationsStore((s) => s.refreshCommunications);
  const loadNotifications = useCommunicationsStore((s) => s.loadNotifications);
  const loadSpecialNews = useCommunicationsStore((s) => s.loadSpecialNews);
  const addPushNotification = useCommunicationsStore((s) => s.addPushNotification);
  const refreshSupplyTypes = useSupplyTypesStore((s) => s.refreshSupplyTypes);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

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
      refreshNotifications: () => loadNotifications(token),
      refreshNews: () => loadSpecialNews(token),
      refreshRequests: () => refreshRequests(token),
      refreshConfiguration: () => refreshSupplyTypes(token),
      onRequestStatusChanged: applyRequestStatusChange,
      onPushNotificationReceived: addPushNotification,
    });

    return () => {
      pushTokenSubscription?.remove?.();
      cleanupNotificationListeners?.();
    };
  }, [token, authState, addPushNotification, applyRequestStatusChange, refreshRequests, refreshSupplyTypes, loadNotifications, loadSpecialNews]);

  useEffect(() => {
    if (!token || authState !== "authenticated") return;

    refreshSupplyTypes();
    const intervalId = setInterval(refreshSupplyTypes, 60000);
    let foregroundTimeoutId = null;
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
       
        foregroundTimeoutId = setTimeout(refreshSupplyTypes, 3000);
      }
    });

    return () => {
      clearInterval(intervalId);
      clearTimeout(foregroundTimeoutId);
      appStateSubscription.remove();
    };
  
  }, [token, authState, refreshSupplyTypes]);

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
  
  }, [token, authState, refreshRequests]);

  useEffect(() => {
    if (!token || authState !== "authenticated") return;

    refreshCommunications();
    const intervalId = setInterval(refreshCommunications, 45000);
    let foregroundTimeoutId = null;
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
       
        foregroundTimeoutId = setTimeout(refreshCommunications, 1500);
      }
    });

    return () => {
      clearInterval(intervalId);
      clearTimeout(foregroundTimeoutId);
      appStateSubscription.remove();
    };
 
  }, [token, authState, refreshCommunications]);

  return children;
}

export function useApp() {
  const auth = useAuthStore();
  const settings = useSettingsStore();
  const requests = useRequestsStore();
  const communications = useCommunicationsStore();
  const leaf = useLeafStore();
  const supply = useSupplyTypesStore();

  const unreadCount = communications.notifications.filter((n) => !n.read).length;

  return {
    theme: settings.theme,
    isDark: settings.theme === "dark",
    updateTheme: settings.updateTheme,
    language: settings.language,
    updateLanguage: settings.updateLanguage,
    fontSize: settings.fontSize,
    updateFontSize: settings.updateFontSize,

    authState: auth.authState,
    savedRegNo: auth.savedRegNo,
    savedName: auth.savedName,
    currentUser: auth.currentUser,
    activeReg: auth.activeReg,
    registrations: auth.registrations,
    signIn: auth.signIn,
    login: auth.login,
    logout: auth.logout,
    setupPin: auth.setupPin,
    changePin: auth.changePin,
    pinLogin: auth.pinLogin,
    resetPin: auth.resetPin,
    updateProfile: auth.updateProfile,
    updateLandInfo: auth.updateLandInfo,
    lockSession: auth.lockSession,
    pauseSessionLock: auth.pauseSessionLock,

    getLeafData: leaf.getLeafData,
    fetchLeafData: leaf.fetchLeafData,
    getTodayLeaf: () => leaf.todayLeafTotal,
    getTodayLeafData: () => leaf.todayLeafData,
    getSixMonthHistory: () => leaf.sixMonthHistory,
    getTwelveMonthHistory: () => leaf.twelveMonthHistory,
    getMonthlyRequestsSummary: () => requests.monthlyRequestsSummary,
    getFeatureFlags: () => supply.featureFlags,

    refreshCommunications: communications.refreshCommunications,
    refreshRequests: requests.refreshRequests,
    refreshSupplyTypes: supply.refreshSupplyTypes,

    notifications: communications.notifications,
    unreadCount,
    markNotificationRead: communications.markNotificationRead,
    markAllRead: communications.markAllRead,
    removeNotification: communications.removeNotification,

    cashRequests: requests.cashRequests,
    addCashRequest: requests.addCashRequest,
    deleteCashRequest: requests.deleteCashRequest,
    fertilizerRequests: requests.fertilizerRequests,
    addFertilizerRequest: requests.addFertilizerRequest,
    deleteFertilizerRequest: requests.deleteFertilizerRequest,
    itemRequests: requests.itemRequests,
    addItemRequest: requests.addItemRequest,
    deleteItemRequest: requests.deleteItemRequest,

    fertilizerTypes: supply.fertilizerTypes,
    itemTypes: supply.itemTypes,
    supplyTypesLoading: supply.supplyTypesLoading,

    specialNews: communications.specialNews,
    newsShown: communications.newsShown,
    setNewsShown: communications.setNewsShown,
    dismissNews: communications.dismissNews,
  };
}
