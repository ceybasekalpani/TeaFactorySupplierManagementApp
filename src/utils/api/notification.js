import { request } from "./client";

export const notificationApi = {
  list:        (token) => request("GET", "/api/notification", undefined, token),
  markRead:    (token, id) => request("POST", `/api/notification/${id}/mark-read`, undefined, token),
  markAllRead: (token) => request("POST", "/api/notification/mark-all-read", undefined, token),
  dismiss:     (token, id) => request("DELETE", `/api/notification/${id}`, undefined, token),
};
