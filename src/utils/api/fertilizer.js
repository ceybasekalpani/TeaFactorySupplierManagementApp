import { request } from "./client";

export const fertilizerApi = {
  list:           (token) => request("GET", "/api/fertilizerrequest", undefined, token),
  create:         (token, data) => request("POST", "/api/fertilizerrequest", data, token),
  delete:         (token, id) => request("DELETE", `/api/fertilizerrequest/${id}`, undefined, token),
  types:          (token) => request("GET", "/api/fertilizerrequest/types", undefined, token),
  featureEnabled: (token) => request("GET", "/api/fertilizerrequest/feature-enabled", undefined, token),
};
