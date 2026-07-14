import { create } from "zustand";
import { accountSummaryApi, cashApi, fertilizerApi, itemApi } from "../utils/api";
import { keepRecentRequests, mapCashRequest, mapFertilizerRequest, mapItemRequest } from "./utils/requestMappers";
import { useAuthStore } from "./authStore";

let requestsLoadingFlag = false;

export const useRequestsStore = create((set, get) => ({
  cashRequests: [],
  fertilizerRequests: [],
  itemRequests: [],
  monthlyRequestsSummary: [],

  loadCashRequests: async (tok = useAuthStore.getState().token) => {
    try {
      const data = await cashApi.list(tok);
      set({ cashRequests: Array.isArray(data) ? keepRecentRequests(data.map(mapCashRequest)) : [] });
    } catch (_) {}
  },

  loadFertilizerRequests: async (tok = useAuthStore.getState().token) => {
    try {
      const data = await fertilizerApi.list(tok);
      set({ fertilizerRequests: Array.isArray(data) ? keepRecentRequests(data.map(mapFertilizerRequest)) : [] });
    } catch (_) {}
  },

  loadItemRequests: async (tok = useAuthStore.getState().token) => {
    try {
      const data = await itemApi.list(tok);
      set({ itemRequests: Array.isArray(data) ? keepRecentRequests(data.map(mapItemRequest)) : [] });
    } catch (_) {}
  },

  loadMonthlyRequestsSummary: async (tok = useAuthStore.getState().token) => {
    try {
      const data = await accountSummaryApi.monthlyRequests(tok, 12);
      set({ monthlyRequestsSummary: Array.isArray(data) ? data : [] });
    } catch (_) {}
  },

  refreshRequests: async (tok = useAuthStore.getState().token) => {
    if (!tok) return Promise.resolve();
    if (requestsLoadingFlag) return Promise.resolve();

    requestsLoadingFlag = true;
    try {
      const { loadCashRequests, loadFertilizerRequests, loadItemRequests, loadMonthlyRequestsSummary } = get();
      return await Promise.allSettled([
        loadCashRequests(tok),
        loadFertilizerRequests(tok),
        loadItemRequests(tok),
        loadMonthlyRequestsSummary(tok),
      ]);
    } finally {
      requestsLoadingFlag = false;
    }
  },

  addCashRequest: async (requestData) => {
    const token = useAuthStore.getState().token;
    const result = await cashApi.create(token, {
      requestType: requestData.type,
      month:       requestData.month,
      amount:      Number(requestData.amount),
    });
    const mapped = mapCashRequest(result);
    set((state) => ({ cashRequests: keepRecentRequests([mapped, ...state.cashRequests]) }));
    get().loadMonthlyRequestsSummary(token).catch(() => {});
    return mapped;
  },

  deleteCashRequest: async (id) => {
    const token = useAuthStore.getState().token;
    await cashApi.delete(token, id);
    set((state) => ({ cashRequests: state.cashRequests.filter((r) => r.id !== id) }));
    get().loadMonthlyRequestsSummary(token).catch(() => {});
  },

  addFertilizerRequest: async (requestData) => {
    const token = useAuthStore.getState().token;
    const result = await fertilizerApi.create(token, {
      fertilizerType: requestData.fertilizerType ?? requestData.fertType,
      month:          requestData.month,
      unit:           requestData.unit,
      quantity:       Number(requestData.quantity),
    });
    const mapped = mapFertilizerRequest(result);
    set((state) => ({ fertilizerRequests: keepRecentRequests([mapped, ...state.fertilizerRequests]) }));
    get().loadMonthlyRequestsSummary(token).catch(() => {});
    return mapped;
  },

  deleteFertilizerRequest: async (id) => {
    const token = useAuthStore.getState().token;
    await fertilizerApi.delete(token, id);
    set((state) => ({ fertilizerRequests: state.fertilizerRequests.filter((r) => r.id !== id) }));
    get().loadMonthlyRequestsSummary(token).catch(() => {});
  },

  addItemRequest: async (requestData) => {
    const token = useAuthStore.getState().token;
    const result = await itemApi.create(token, {
      itemType: requestData.itemType,
      month:    requestData.month,
      quantity: Number(requestData.quantity),
      unit:     requestData.unit ?? "units",
    });
    const mapped = mapItemRequest(result);
    set((state) => ({ itemRequests: keepRecentRequests([mapped, ...state.itemRequests]) }));
    get().loadMonthlyRequestsSummary(token).catch(() => {});
    return mapped;
  },

  deleteItemRequest: async (id) => {
    const token = useAuthStore.getState().token;
    await itemApi.delete(token, id);
    set((state) => ({ itemRequests: state.itemRequests.filter((r) => r.id !== id) }));
    get().loadMonthlyRequestsSummary(token).catch(() => {});
  },

  applyRequestStatusChange: (payload = {}) => {
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
      set((state) => ({ cashRequests: state.cashRequests.map(updateMatchingRequest) }));
      return;
    }

    if (requestType === "fertilizer") {
      set((state) => ({ fertilizerRequests: state.fertilizerRequests.map(updateMatchingRequest) }));
      return;
    }

    if (requestType === "items" || requestType === "item") {
      set((state) => ({ itemRequests: state.itemRequests.map(updateMatchingRequest) }));
    }
  },

  resetRequests: () => set({
    cashRequests: [],
    fertilizerRequests: [],
    itemRequests: [],
    monthlyRequestsSummary: [],
  }),
}));
