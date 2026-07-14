import { request } from "./client";

export const cashApi = {
  list:           (token) => request("GET", "/api/cashrequest", undefined, token),
  create:         (token, data) => request("POST", "/api/cashrequest", data, token),
  delete:         (token, id) => request("DELETE", `/api/cashrequest/${id}`, undefined, token),
  featureEnabled: (token) => request("GET", "/api/cashrequest/feature-enabled", undefined, token),
  advanceLimit:   (token) => request("GET", "/api/cashrequest/advance-limit", undefined, token),
};
