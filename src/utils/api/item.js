import { request } from "./client";

export const itemApi = {
  list:           (token) => request("GET", "/api/itemrequest", undefined, token),
  create:         (token, data) => request("POST", "/api/itemrequest", data, token),
  delete:         (token, id) => request("DELETE", `/api/itemrequest/${id}`, undefined, token),
  types:          (token) => request("GET", "/api/itemrequest/types", undefined, token),
  featureEnabled: (token) => request("GET", "/api/itemrequest/feature-enabled", undefined, token),
};
