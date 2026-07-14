import { create } from "zustand";
import { cashApi, fertilizerApi, itemApi } from "../utils/api";
import { useAuthStore } from "./authStore";

let supplyTypesLoadingFlag = false;

export const useSupplyTypesStore = create((set, get) => ({
  fertilizerTypes: [],
  itemTypes: [],
  supplyTypesLoading: false,
  featureFlags: { cash: true, fertilizer: true, item: true },

  refreshSupplyTypes: async (tok = useAuthStore.getState().token) => {
    if (!tok) return;
    if (supplyTypesLoadingFlag) return;

    supplyTypesLoadingFlag = true;
    set({ supplyTypesLoading: true });
    try {
      const [fertilizerResult, itemResult] = await Promise.allSettled([
        fertilizerApi.types(tok),
        itemApi.types(tok),
      ]);

      if (fertilizerResult.status === "fulfilled" && Array.isArray(fertilizerResult.value)) {
        set({ fertilizerTypes: fertilizerResult.value });
      } else if (fertilizerResult.status === "rejected") {
        console.log("[configuration] Failed to load fertilizer types:", fertilizerResult.reason?.message || fertilizerResult.reason);
      }

      if (itemResult.status === "fulfilled" && Array.isArray(itemResult.value)) {
        set({ itemTypes: itemResult.value });
      } else if (itemResult.status === "rejected") {
        console.log("[configuration] Failed to load item types:", itemResult.reason?.message || itemResult.reason);
      }
    } finally {
      supplyTypesLoadingFlag = false;
      set({ supplyTypesLoading: false });
    }
  },

  loadFeatureFlags: async (tok = useAuthStore.getState().token) => {
    try {
      const [cash, fertilizer, item] = await Promise.allSettled([
        cashApi.featureEnabled(tok),
        fertilizerApi.featureEnabled(tok),
        itemApi.featureEnabled(tok),
      ]);
      set({
        featureFlags: {
          cash:       cash.status       === "fulfilled" ? !!(cash.value?.enabled       ?? cash.value?.isEnabled       ?? true) : true,
          fertilizer: fertilizer.status === "fulfilled" ? !!(fertilizer.value?.enabled ?? fertilizer.value?.isEnabled ?? true) : true,
          item:       item.status       === "fulfilled" ? !!(item.value?.enabled        ?? item.value?.isEnabled        ?? true) : true,
        },
      });
    } catch (_) {}
  },

  resetSupplyTypes: () => set({ fertilizerTypes: [], itemTypes: [] }),
}));
