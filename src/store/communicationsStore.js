import { create } from "zustand";
import { newsApi, notificationApi } from "../utils/api";
import {
  formatRequestType,
  formatStatus,
  getPushNotificationType,
  normalizeNotificationType,
} from "./utils/notificationFormat";
import { useAuthStore } from "./authStore";

const NOTIFICATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

let communicationsLoadingFlag = false;
let specialNewsIdsSeen = "";

function mapNews(n) {
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
}

export const useCommunicationsStore = create((set, get) => ({
  notifications: [],
  specialNews: [],
  newsShown: false,

  setNewsShown: (newsShown) => set({ newsShown }),

  loadNotifications: async (tok = useAuthStore.getState().token) => {
    try {
      const data = await notificationApi.list(tok);
      const cutoff = Date.now() - NOTIFICATION_MAX_AGE_MS;
      set({
        notifications: Array.isArray(data)
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
          : [],
      });
    } catch (error) {
      console.log("[communications] Failed to load notifications:", error?.message || error);
    }
  },

  loadSpecialNews: async (tok = useAuthStore.getState().token) => {
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
      if (ids && ids !== specialNewsIdsSeen) {
        set({ newsShown: false });
      }
      specialNewsIdsSeen = ids;
      set({ specialNews: mappedNews });
    } catch (error) {
      console.log("[communications] Failed to load news:", error?.message || error);
    }
  },

  refreshCommunications: async (tok = useAuthStore.getState().token) => {
    if (!tok) return Promise.resolve();
    if (communicationsLoadingFlag) return Promise.resolve();

    communicationsLoadingFlag = true;
    try {
      const { loadNotifications, loadSpecialNews } = get();
      return await Promise.allSettled([
        loadNotifications(tok),
        loadSpecialNews(tok),
      ]);
    } finally {
      communicationsLoadingFlag = false;
    }
  },

  markNotificationRead: async (id) => {
    set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    try { await notificationApi.markRead(useAuthStore.getState().token, id); } catch (_) {}
  },

  markAllRead: async () => {
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
    try { await notificationApi.markAllRead(useAuthStore.getState().token); } catch (_) {}
  },

  removeNotification: async (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
    try { await notificationApi.dismiss(useAuthStore.getState().token, id); } catch (_) {}
  },

  dismissNews: async (id) => {
    set((state) => ({ specialNews: state.specialNews.filter((n) => n.id !== String(id)) }));
    try { await newsApi.dismiss(useAuthStore.getState().token, id); } catch (_) {}
  },

  addPushNotification: ({ content = {}, data = {} } = {}) => {
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

    set((state) => {
      if (state.notifications.some((n) => n.id === id)) return state;
      return {
        notifications: [{
          id,
          title,
          message,
          type: getPushNotificationType(data),
          createdAt: new Date().toISOString(),
          read: false,
        }, ...state.notifications],
      };
    });
  },

  resetCommunications: () => {
    specialNewsIdsSeen = "";
    set({ notifications: [], specialNews: [], newsShown: false });
  },
}));
