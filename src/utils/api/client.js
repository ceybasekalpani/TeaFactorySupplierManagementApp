import axios from "axios";
import { API_BASE_URL } from "../../constants/config";

const REQUEST_TIMEOUT_MS = 30000;

// Caps how many requests can be in flight at once so a burst (e.g. several
// polling loops firing together on app-foreground) can't hammer the backend
// all at the same instant; excess calls simply wait their turn in order.
const MAX_CONCURRENT_REQUESTS = 4;
let activeRequestCount = 0;
const pendingRequestQueue = [];

function acquireRequestSlot() {
  if (activeRequestCount < MAX_CONCURRENT_REQUESTS) {
    activeRequestCount++;
    return Promise.resolve();
  }
  return new Promise((resolve) => pendingRequestQueue.push(resolve));
}

function releaseRequestSlot() {
  const next = pendingRequestQueue.shift();
  if (next) {
    next();
  } else {
    activeRequestCount--;
  }
}

const httpClient = axios.create({ baseURL: API_BASE_URL });

function extractErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data || fallback;
  return data.message || data.title || data.errors
    ? (data.message || data.title || JSON.stringify(data.errors))
    : fallback;
}

function normalizeResponseData(data) {
  return data === undefined || data === null || data === "" ? null : data;
}

async function throwForAxiosError(error, method, path) {
  if (error.code === "ECONNABORTED") {
    const timeoutError = new Error(`Request timed out: ${path}`);
    timeoutError.status = 408;
    throw timeoutError;
  }
  if (error.response) {
    const { status, data, statusText } = error.response;
    const message = extractErrorMessage(data, statusText);
    console.error(`API ${method} ${path} → ${status}`, message || "(empty body)");
    const err = new Error(message || `HTTP ${status}`);
    err.status = status;
    throw err;
  }
  throw error;
}

export async function request(method, path, body, token) {
  await acquireRequestSlot();
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await httpClient.request({
        url: path,
        method,
        headers,
        data: body,
        timeout: REQUEST_TIMEOUT_MS,
      });
      return normalizeResponseData(res.data);
    } catch (error) {
      await throwForAxiosError(error, method, path);
    }
  } finally {
    releaseRequestSlot();
  }
}

export async function requestWithFallback(method, paths, body, token) {
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

export async function uploadFile(method, path, formData, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await httpClient.request({
      url: path,
      method,
      headers,
      data: formData,
    });
    return normalizeResponseData(res.data);
  } catch (error) {
    await throwForAxiosError(error, method, path);
  }
}
