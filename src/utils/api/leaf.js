import { request } from "./client";

export const leafApi = {
  monthly:       (token, year, month) => request("GET", `/api/leaf/monthly?year=${year}&month=${month}`, undefined, token),
  history:       (token) => request("GET", "/api/leaf/history", undefined, token),
  historyAnnual: (token) => request("GET", "/api/leaf/history-annual", undefined, token),  // 12 months
  today:         (token) => request("GET", "/api/leaf/today", undefined, token),
  summary:       (token) => request("GET", "/api/leaf/summary", undefined, token),
};
