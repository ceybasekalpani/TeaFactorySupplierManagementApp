export function normalizeNotificationType(value) {
  const type = String(value ?? "info").toLowerCase();
  if (type === "approved" || type === "approve" || type === "success") return "success";
  if (type === "rejected" || type === "reject" || type === "failed" || type === "error") return "error";
  if (type === "warning" || type === "warn") return "warning";
  return "info";
}

export function getPushNotificationType(data = {}) {
  const eventType = String(data.eventType ?? data.EventType ?? "").toLowerCase();
  const type = String(data.notificationType ?? data.NotificationType ?? data.type ?? data.Type ?? "").toLowerCase();
  const status = String(data.status ?? data.Status ?? "").toLowerCase();

  if (status) return normalizeNotificationType(status);
  if (eventType) return normalizeNotificationType(eventType);
  if (type === "notification" || type === "news" || type.includes("_changed")) return "info";
  return normalizeNotificationType(type);
}

export function formatRequestType(value) {
  const requestType = String(value ?? "request").trim().toLowerCase();
  if (requestType === "advance" || requestType === "cash") return "Advance";
  if (requestType === "fertilizer") return "Fertilizer";
  if (requestType === "items" || requestType === "item") return "Item";
  return requestType ? requestType.charAt(0).toUpperCase() + requestType.slice(1) : "Request";
}

export function formatStatus(value) {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Updated";
}
