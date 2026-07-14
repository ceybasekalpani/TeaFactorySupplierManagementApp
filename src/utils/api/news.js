import { requestWithFallback } from "./client";

export const newsApi = {
  list: (token) =>
    requestWithFallback("GET", ["/api/mobile/news", "/api/news"], undefined, token),
  byId: (token, id) =>
    requestWithFallback("GET", [`/api/mobile/news/${id}`, `/api/news/${id}`], undefined, token),
  activePopup: (token) =>
    requestWithFallback("GET", ["/api/mobile/news/active-popup", "/api/news/active-popup"], undefined, token),
  dismiss: (token, id) =>
    requestWithFallback("POST", [`/api/mobile/news/${id}/dismiss`, `/api/news/${id}/dismiss`], undefined, token),
};
