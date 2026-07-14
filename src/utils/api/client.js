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

export async function request(method, path, body, token) {
  await acquireRequestSlot();
  try {
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
