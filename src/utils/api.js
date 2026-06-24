import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/config";

const TOKEN_KEY = "authToken";
const REQUEST_TIMEOUT_MS = 30000;

export const tokenStorage = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  remove: () => AsyncStorage.removeItem(TOKEN_KEY),
};

async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`Request timed out: ${path}`);
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let message = res.statusText;
    let rawBody = "";
    try {
      rawBody = await res.text();
      const err = JSON.parse(rawBody);
      message = err.message || err.title || err.errors
        ? (err.message || err.title || JSON.stringify(err.errors))
        : message;
    } catch (_) {
      if (rawBody) message = rawBody;
    }
    console.error(`API ${method} ${path} → ${res.status}`, message || "(empty body)");
    const error = new Error(message || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }

  try {
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function requestWithFallback(method, paths, body, token) {
  let lastError = null;

  for (const path of paths) {
    try {
      return await request(method, path, body, token);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function uploadFile(method, path, formData, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  if (!res.ok) {
    let message = res.statusText;
    let rawBody = "";
    try {
      rawBody = await res.text();
      const err = JSON.parse(rawBody);
      message = err.message || err.title || err.errors
        ? (err.message || err.title || JSON.stringify(err.errors))
        : message;
    } catch (_) {
      if (rawBody) message = rawBody;
    }
    console.error(`API ${method} ${path} → ${res.status}`, message || "(empty body)");
    const error = new Error(message || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }

  try {
    return await res.json();
  } catch (_) {
    return null;
  }
}

export const authApi = {
  login: (username, password) =>
    request("POST", "/api/auth/login", { username, password }),
  me: (token) =>
    request("GET", "/api/auth/me", undefined, token),
  registrations: (token) =>
    request("GET", "/api/auth/registrations", undefined, token),
  selectRegistration: (token, regNo) =>
    request("POST", "/api/auth/select-registration", { regNo }, token),
  changePassword: (token, currentPassword, newPassword) =>
    request("POST", "/api/auth/change-password", { currentPassword, newPassword }, token),
  setupPin: (token, pin) =>
    request("POST", "/api/auth/setup-pin", { pin }, token),
  pinLogin: (regNo, pin) =>
    request("POST", "/api/auth/pin-login", { regNo, pin }),
  changePin: (token, currentPin, newPin) =>
    request("POST", "/api/auth/change-pin", { currentPin, newPin }, token),
};

export const leafApi = {
  monthly:       (token, year, month) => request("GET", `/api/leaf/monthly?year=${year}&month=${month}`, undefined, token),
  history:       (token) => request("GET", "/api/leaf/history", undefined, token),
  historyAnnual: (token) => request("GET", "/api/leaf/history-annual", undefined, token),  // NEW — 12 months
  today:         (token) => request("GET", "/api/leaf/today", undefined, token),
  summary:       (token) => request("GET", "/api/leaf/summary", undefined, token),
};

// NEW — monthly account summary (cash + fertilizer + item per month)
export const accountSummaryApi = {
  monthlyRequests: (token, months = 6) =>
    request("GET", `/api/accountsummary/monthly-requests?months=${months}`, undefined, token),
};

export const cashApi = {
  list:           (token) => request("GET", "/api/cashrequest", undefined, token),
  create:         (token, data) => request("POST", "/api/cashrequest", data, token),
  delete:         (token, id) => request("DELETE", `/api/cashrequest/${id}`, undefined, token),
  featureEnabled: (token) => request("GET", "/api/cashrequest/feature-enabled", undefined, token),
  advanceLimit:   (token) => request("GET", "/api/cashrequest/advance-limit", undefined, token),
};

export const fertilizerApi = {
  list:           (token) => request("GET", "/api/fertilizerrequest", undefined, token),
  create:         (token, data) => request("POST", "/api/fertilizerrequest", data, token),
  delete:         (token, id) => request("DELETE", `/api/fertilizerrequest/${id}`, undefined, token),
  types:          (token) => request("GET", "/api/fertilizerrequest/types", undefined, token),
  featureEnabled: (token) => request("GET", "/api/fertilizerrequest/feature-enabled", undefined, token),
};

export const itemApi = {
  list:           (token) => request("GET", "/api/itemrequest", undefined, token),
  create:         (token, data) => request("POST", "/api/itemrequest", data, token),
  delete:         (token, id) => request("DELETE", `/api/itemrequest/${id}`, undefined, token),
  types:          (token) => request("GET", "/api/itemrequest/types", undefined, token),
  featureEnabled: (token) => request("GET", "/api/itemrequest/feature-enabled", undefined, token),
};

export const notificationApi = {
  list:        (token) => request("GET", "/api/notification", undefined, token),
  markRead:    (token, id) => request("POST", `/api/notification/${id}/mark-read`, undefined, token),
  markAllRead: (token) => request("POST", "/api/notification/mark-all-read", undefined, token),
  dismiss:     (token, id) => request("DELETE", `/api/notification/${id}`, undefined, token),
};

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

export const settingsApi = {
  get:            (token) => request("GET", "/api/settings", undefined, token),
  updateTheme:    (token, theme) => request("PUT", "/api/settings/theme", { theme }, token),
  updateLanguage: (token, language) => request("PUT", "/api/settings/language", { language }, token),
  updateFontSize: (token, fontSize) => request("PUT", "/api/settings/font-size", { fontSize }, token),

  updateProfileImage: (token, asset) => {
    let mimeType = asset.mimeType;
    if (!mimeType || mimeType === "image") {
      const uriExt = asset.uri?.split(".").pop()?.toLowerCase().split("?")[0];
      if (uriExt === "png") mimeType = "image/png";
      else if (uriExt === "webp") mimeType = "image/webp";
      else mimeType = "image/jpeg";
    }
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const fileName = asset.fileName || `profile.${ext}`;

    if (!asset.base64) {
      return Promise.reject(new Error("Image base64 data is missing. Ensure ImagePicker has base64: true"));
    }

    return request("PUT", "/api/settings/profile-image-base64", {
      imageBase64: asset.base64,
      fileName,
      mimeType,
    }, token);
  },

  updateSettings:       (token, data) => request("PUT", "/api/settings", data, token),
  updateAccountDetails: (token, data) => request("PUT", "/api/settings/account-details", data, token),
};
