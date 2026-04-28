import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/config";

// ── Token storage ──────────────────────────────────────────────────────────────
const TOKEN_KEY = "authToken";

export const tokenStorage = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  remove: () => AsyncStorage.removeItem(TOKEN_KEY),
};                                                                                                                    

// ── Base request ───────────────────────────────────────────────────────────────
async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

// ── Multipart upload ────────────────────────────────────────────────────────────
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

// ── Auth API ───────────────────────────────────────────────────────────────────
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
};

// ── Leaf API ───────────────────────────────────────────────────────────────────
export const leafApi = {
  monthly: (token, year, month) =>
    request("GET", `/api/leaf/monthly?year=${year}&month=${month}`, undefined, token),

  history: (token) =>
    request("GET", "/api/leaf/history", undefined, token),

  today: (token) =>
    request("GET", "/api/leaf/today", undefined, token),

  summary: (token) =>
    request("GET", "/api/leaf/summary", undefined, token),
};

// ── Cash Request API ───────────────────────────────────────────────────────────
export const cashApi = {
  list: (token) =>
    request("GET", "/api/cashrequest", undefined, token),

  create: (token, data) =>
    request("POST", "/api/cashrequest", data, token),

  delete: (token, id) =>
    request("DELETE", `/api/cashrequest/${id}`, undefined, token),

  featureEnabled: (token) =>
    request("GET", "/api/cashrequest/feature-enabled", undefined, token), 
};

// ── Fertilizer Request API ─────────────────────────────────────────────────────
export const fertilizerApi = {
  list: (token) =>
    request("GET", "/api/fertilizerrequest", undefined, token),

  create: (token, data) =>
    request("POST", "/api/fertilizerrequest", data, token),

  delete: (token, id) =>
    request("DELETE", `/api/fertilizerrequest/${id}`, undefined, token),

  types: (token) =>
    request("GET", "/api/fertilizerrequest/types", undefined, token),

  featureEnabled: (token) =>
    request("GET", "/api/fertilizerrequest/feature-enabled", undefined, token),
};

// ── Item Request API ───────────────────────────────────────────────────────────
export const itemApi = {
  list: (token) =>
    request("GET", "/api/itemrequest", undefined, token),

  create: (token, data) =>
    request("POST", "/api/itemrequest", data, token),

  delete: (token, id) =>
    request("DELETE", `/api/itemrequest/${id}`, undefined, token),

  types: (token) =>
    request("GET", "/api/itemrequest/types", undefined, token),

  featureEnabled: (token) =>
    request("GET", "/api/itemrequest/feature-enabled", undefined, token),
};

// ── Notification API ───────────────────────────────────────────────────────────
export const notificationApi = {
  list: (token) =>
    request("GET", "/api/notification", undefined, token),

  markRead: (token, id) =>
    request("POST", `/api/notification/${id}/mark-read`, undefined, token),

  markAllRead: (token) =>
    request("POST", "/api/notification/mark-all-read", undefined, token),
};

// ── News API ───────────────────────────────────────────────────────────────────
export const newsApi = {
  activePopup: (token) =>
    request("GET", "/api/news/active-popup", undefined, token),

  dismiss: (token, id) =>
    request("POST", `/api/news/${id}/dismiss`, undefined, token),
};

// ── Settings API ───────────────────────────────────────────────────────────────
export const settingsApi = {
  get: (token) =>
    request("GET", "/api/settings", undefined, token),

  updateTheme: (token, theme) =>
    request("PUT", "/api/settings/theme", { theme }, token),

  updateLanguage: (token, language) =>
    request("PUT", "/api/settings/language", { language }, token),

  updateFontSize: (token, fontSize) =>
    request("PUT", "/api/settings/font-size", { fontSize }, token),

  updateProfileImage: (token, asset) => {
    let mimeType = asset.mimeType;
    if (!mimeType || mimeType === "image") {
      const uriExt = asset.uri?.split(".").pop()?.toLowerCase().split("?")[0];
      if (uriExt === "png") mimeType = "image/png";
      else if (uriExt === "webp") mimeType = "image/webp";
      else mimeType = "image/jpeg";
    }
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const formData = new FormData();
    formData.append("image", {
      uri: asset.uri,
      name: asset.fileName || `profile.${ext}`,
      type: mimeType,
    });
    console.log("[upload] SENDING uri:", asset.uri, "type:", mimeType, "size:", asset.fileSize);
    return uploadFile("PUT", "/api/settings/profile-image", formData, token)
      .then((result) => {
        console.log("[upload] SUCCESS:", JSON.stringify(result));
        return result;
      })
      .catch((err) => {
        console.log("[upload] FAILED:", err?.status, err?.message);
        throw err;
      });
  },

  updateSettings: (token, data) =>
    request("PUT", "/api/settings", data, token),

  updateAccountDetails: (token, data) =>
    request("PUT", "/api/settings/account-details", data, token),
};
