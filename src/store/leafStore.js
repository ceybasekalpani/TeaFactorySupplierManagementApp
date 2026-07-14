import { create } from "zustand";
import { leafApi } from "../utils/api";
import { useAuthStore } from "./authStore";

function mapHistoryRow(h) {
  return {
    key:        h.monthKey   ?? h.key   ?? "",
    label:      h.monthLabel ?? h.label ?? "",
    totalGross: h.totalGross ?? 0,
    totalNet:   h.totalNet   ?? 0,
    days:       h.days       ?? 0,
  };
}

export const useLeafStore = create((set, get) => ({
  leafCache: {},
  sixMonthHistory: [],
  twelveMonthHistory: [],
  todayLeafTotal: 0,
  todayLeafData: { normalNet: 0, superNet: 0, hasSuper: false },

  getLeafData: (monthKey) => get().leafCache[monthKey],

  fetchLeafData: async (monthKey) => {
    const tok = useAuthStore.getState().token;
    if (!tok) return;
    try {
      const [year, month] = monthKey.split("-").map(Number);
      const data = await leafApi.monthly(tok, year, month);
      set((state) => ({ leafCache: { ...state.leafCache, [monthKey]: data ?? null } }));
    } catch (_) {}
  },

  loadTodayLeaf: async (tok = useAuthStore.getState().token) => {
    try {
      const data = await leafApi.today(tok);
      const normalNet = data?.normalNet ?? 0;
      const superNet  = data?.superNet  ?? 0;
      const hasSuper  = data?.hasSuper  ?? false;
      set({ todayLeafData: { normalNet, superNet, hasSuper }, todayLeafTotal: normalNet + superNet });
    } catch (_) {}
  },

  loadHistory: async (tok = useAuthStore.getState().token) => {
    try {
      const data = await leafApi.history(tok);
      set({ sixMonthHistory: Array.isArray(data) ? data.map(mapHistoryRow) : [] });
    } catch (_) {}
  },

  // 12-month leaf history
  loadAnnualHistory: async (tok = useAuthStore.getState().token) => {
    try {
      const data = await leafApi.historyAnnual(tok);
      set({ twelveMonthHistory: Array.isArray(data) ? data.map(mapHistoryRow) : [] });
    } catch (_) {}
  },

  // Matches original logout() behavior: only todayLeafTotal is reset, not
  // todayLeafData (a pre-existing quirk kept as-is to preserve behavior).
  resetLeaf: () => set({
    leafCache: {},
    sixMonthHistory: [],
    twelveMonthHistory: [],
    todayLeafTotal: 0,
  }),
}));
