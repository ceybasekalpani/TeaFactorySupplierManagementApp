import { colorScheme } from "nativewind";
import { create } from "zustand";
import { settingsApi } from "../utils/api";
import { useAuthStore } from "./authStore";

export const useSettingsStore = create((set, get) => ({
  theme: "light",
  language: "english",
  fontSize: 50,

  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setFontSize: (fontSize) => set({ fontSize }),

  updateTheme: async (theme) => {
    set({ theme });
    try { await settingsApi.updateTheme(useAuthStore.getState().token, theme); } catch (_) {}
  },

  updateLanguage: async (language) => {
    set({ language });
    try { await settingsApi.updateLanguage(useAuthStore.getState().token, language); } catch (_) {}
  },

  updateFontSize: async (fontSize) => {
    set({ fontSize });
    try { await settingsApi.updateFontSize(useAuthStore.getState().token, fontSize); } catch (_) {}
  },
}));

// NativeWind's `dark:` classNames follow their own colorScheme, which defaults to
// the OS appearance. Without this, screens using `dark:` classNames ignore the
// user's manual theme choice whenever it differs from the system setting.
// Wrapped in try/catch because on web this can run during static/server
// rendering (no real browser environment yet), where NativeWind throws.
function syncNativeWindColorScheme(theme) {
  try {
    colorScheme.set(theme === "dark" ? "dark" : "light");
  } catch (_) {}
}

syncNativeWindColorScheme(useSettingsStore.getState().theme);
useSettingsStore.subscribe((state) => {
  syncNativeWindColorScheme(state.theme);
});
