import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { create } from "zustand";
import { authApi, settingsApi, tokenStorage } from "../utils/api";
import {
  PROFILE_IMAGE_PATH_KEY,
  copyPickedImageLocally,
  downloadProfileImageViaBackend,
  getStoredLocalImagePath,
  profileImagePathKey,
} from "./utils/profileImage";
import { mapUser } from "./utils/userMapper";

let sessionLockPausedUntil = 0;

async function loadSettings(tok, regNo, { setCurrentUser }) {
  try {
    const s = await settingsApi.get(tok);
    if (!s) return;

    const themeVal    = s.theme    || s.Theme;
    const lang        = s.language || s.Language;
    const fSize       = s.fontSize ?? s.FontSize;
    const remoteImage = s.profileImage || s.ProfileImage || s.imageUrl;

    // Cross-store write kept lazy (required inline) to avoid a circular
    // top-level import between authStore and settingsStore.
    const { useSettingsStore } = require("./settingsStore");
    if (themeVal) useSettingsStore.getState().setTheme(themeVal);
    if (lang) useSettingsStore.getState().setLanguage(lang);
    if (fSize !== undefined) useSettingsStore.getState().setFontSize(Number(fSize));

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
}

async function loadAppDataAfterLogin(tok) {
  if (!tok) return;
  const { useLeafStore } = require("./leafStore");
  const { useRequestsStore } = require("./requestsStore");
  const { useCommunicationsStore } = require("./communicationsStore");
  const { useSupplyTypesStore } = require("./supplyTypesStore");

  const leaf = useLeafStore.getState();
  const requests = useRequestsStore.getState();
  const communications = useCommunicationsStore.getState();
  const supplyTypes = useSupplyTypesStore.getState();

  await Promise.allSettled([
    communications.loadNotifications(tok),
    requests.loadCashRequests(tok),
    requests.loadFertilizerRequests(tok),
    requests.loadItemRequests(tok),
    supplyTypes.refreshSupplyTypes(tok),
    leaf.loadTodayLeaf(tok),
    leaf.loadHistory(tok),
    leaf.loadAnnualHistory(tok),
    requests.loadMonthlyRequestsSummary(tok),
    supplyTypes.loadFeatureFlags(tok),
  ]);
}

export const useAuthStore = create((set, get) => ({
  token: null,
  currentUser: null,
  activeReg: null,
  registrations: [],
  authState: "loading",
  savedRegNo: null,
  savedName: null,

  setCurrentUser: (updater) => set((state) => ({
    currentUser: typeof updater === "function" ? updater(state.currentUser) : updater,
  })),

  initFromStorage: async () => {
    try {
      const storedRegNo = await AsyncStorage.getItem("savedRegNo");
      const storedName  = await AsyncStorage.getItem("savedName");
      if (storedRegNo) {
        set({ savedRegNo: storedRegNo, savedName: storedName || "", authState: "pin-required" });
      } else {
        set({ authState: "unauthenticated" });
      }
    } catch (_) {
      set({ authState: "unauthenticated" });
    }
  },

  signIn: async (username, password) => {
    const result = await authApi.login(username, password);
    if (!result?.token) return null;

    await tokenStorage.set(result.token);
    set({ token: result.token });

    const [user, regs] = await Promise.all([
      authApi.me(result.token),
      authApi.registrations(result.token),
    ]);

    const mappedUser = mapUser(user);
    set({ currentUser: mappedUser, registrations: Array.isArray(regs) ? regs : [] });
    await loadSettings(result.token, result.regNo ?? username, get());

    const regNoStr = result.regNo ?? username;
    const nameStr  = result.name  ?? mappedUser.name ?? "";
    await AsyncStorage.setItem("savedRegNo", regNoStr);
    await AsyncStorage.setItem("savedName",  nameStr);
    set({ savedRegNo: regNoStr, savedName: nameStr });

    return {
      user:          mappedUser,
      registrations: Array.isArray(regs) ? regs : [],
      token:         result.token,
      isCreatePin:   result.isCreatePin ?? false,
    };
  },

  setupPin: async (pin) => {
    await authApi.setupPin(get().token, pin);
  },

  changePin: async (currentPin, newPin) => {
    return await authApi.changePin(get().token, currentPin, newPin);
  },

  pinLogin: async (regNo, pin) => {
    const result = await authApi.pinLogin(regNo, pin);
    if (!result?.token) return null;

    await tokenStorage.set(result.token);
    set({ token: result.token });

    const [user, regs] = await Promise.all([
      authApi.me(result.token),
      authApi.registrations(result.token),
    ]);

    const mappedUser = mapUser(user);
    set({ currentUser: mappedUser, registrations: Array.isArray(regs) ? regs : [] });

    return {
      user:          mappedUser,
      registrations: Array.isArray(regs) ? regs : [],
      token:         result.token,
    };
  },

  login: async (reg, tok) => {
    const activeTok = tok || get().token;
    set((state) => ({
      activeReg: reg,
      currentUser: state.currentUser ? { ...state.currentUser, image: null } : state.currentUser,
    }));
    const { useCommunicationsStore } = require("./communicationsStore");
    useCommunicationsStore.getState().setNewsShown(false);

    await AsyncStorage.setItem("activeReg", JSON.stringify(reg));
    await loadSettings(activeTok, reg?.regNo, get());
    set({ authState: "authenticated" });
    loadAppDataAfterLogin(activeTok).catch((error) => {
      console.log("[startup] Failed to load initial app data:", error?.message || error);
    });
  },

  pauseSessionLock: (durationMs = 60000) => {
    sessionLockPausedUntil = Date.now() + durationMs;
  },

  lockSession: () => {
    if (Date.now() < sessionLockPausedUntil) return;
    set((state) => (state.authState === "authenticated" ? { authState: "pin-required" } : {}));
  },

  resetPin: async () => {
    await AsyncStorage.removeItem("savedRegNo");
    await AsyncStorage.removeItem("savedName");
    await tokenStorage.remove();
    set({ token: null, currentUser: null, activeReg: null, registrations: [], authState: "unauthenticated" });
  },

  logout: async () => {
    const { registrations, activeReg } = get();

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

    set({ token: null, currentUser: null, activeReg: null, registrations: [] });

    const { useLeafStore } = require("./leafStore");
    const { useRequestsStore } = require("./requestsStore");
    const { useCommunicationsStore } = require("./communicationsStore");
    const { useSupplyTypesStore } = require("./supplyTypesStore");
    useLeafStore.getState().resetLeaf();
    useRequestsStore.getState().resetRequests();
    useSupplyTypesStore.getState().resetSupplyTypes();
    useCommunicationsStore.getState().resetCommunications();

    const storedRegNo = await AsyncStorage.getItem("savedRegNo");
    set({ authState: storedRegNo ? "pin-required" : "unauthenticated" });
  },

  updateProfile: async (data) => {
    const { setCurrentUser } = get();
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
    const token = get().token;

    if (data.imageAsset) {
      try {
        const result = await settingsApi.updateProfileImage(token, data.imageAsset);
        const remoteUrl = result?.imageUrl || result?.profileImage || result?.url || result?.imagePath;
        if (remoteUrl) {
          setCurrentUser((prev) => prev ? { ...prev, image: data.imageAsset.uri } : prev);

          const regNo = get().activeReg?.regNo;
          let localPath = await copyPickedImageLocally(data.imageAsset.uri, regNo);
          if (!localPath) {
            localPath = await downloadProfileImageViaBackend(token, regNo);
          }

          const displayUrl = localPath || remoteUrl;
          uploadedImageUrl = displayUrl;
          setCurrentUser((prev) => prev ? { ...prev, image: displayUrl } : prev);
        }
        await loadSettings(token, get().activeReg?.regNo, get());
      } catch (err) {
        console.log("[updateProfile] image upload error:", err?.message || err);
        await loadSettings(token, get().activeReg?.regNo, get());
        throw err;
      }
    }

    if (data.address !== undefined || data.phone !== undefined || data.name !== undefined ||
        data.phone2 !== undefined || data.phone3 !== undefined) {
      await settingsApi.updateSettings(token, {
        name:    data.name,
        address: data.address,
        phone:   data.phone,
        phone2:  data.phone2,
        phone3:  data.phone3,
      });
    }

    if (data.bankName !== undefined || data.accountNumber !== undefined ||
        data.accountHolder !== undefined || data.branch !== undefined) {
      await settingsApi.updateAccountDetails(token, {
        bankName:      data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        branch:        data.branch,
      });
    }

    return uploadedImageUrl;
  },

  updateLandInfo: async (landAcre, landRood, landPerch) => {
    const { token, setCurrentUser } = get();
    await authApi.updateLandInfo(token, landAcre, landRood, landPerch);
    setCurrentUser((prev) => (prev ? { ...prev, landAcre, landRood, landPerch } : prev));
  },
}));
