const REQUEST_HISTORY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function getRequestTime(request) {
  const value = request?.requestedDate || request?.createdAt || request?.date || request?.updatedAt;
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? Date.now() : time;
}

export function keepRecentRequests(requests) {
  const cutoff = Date.now() - REQUEST_HISTORY_MAX_AGE_MS;
  return requests.filter((request) => getRequestTime(request) >= cutoff);
}

export function mapCashRequest(r) {
  if (!r) return r;
  return {
    id:            r.id ?? r.Id,
    requestNo:     r.requestNo ?? r.RequestNo ?? "",
    type:          r.requestType ?? r.RequestType ?? r.type ?? r.Type ?? "advance",
    month:         r.month ?? r.Month ?? "",
    amount:        Number(r.amount ?? r.Amount ?? 0),
    date:          (r.requestDate ?? r.RequestDate) ? String(r.requestDate ?? r.RequestDate).split("T")[0] : (r.date ?? r.Date ?? ""),
    status:        String(r.status ?? r.Status ?? "pending").toLowerCase(),
    createdAt:     r.createdAt ?? r.CreatedAt ?? r.requestDate ?? r.RequestDate ?? new Date().toISOString(),
    updatedAt:     r.updatedAt ?? r.UpdatedAt ?? null,
    requestedDate: r.requestDate ?? r.RequestDate ?? r.requestedDate ?? r.RequestedDate ?? "",
    regNo:         r.regNo ?? r.RegNo,
    remarks:       r.remarks ?? r.Remarks ?? "",
  };
}

export function mapFertilizerRequest(r) {
  if (!r) return r;
  return {
    id:             r.id ?? r.Id,
    requestNo:      r.requestNo ?? r.RequestNo ?? "",
    month:          r.month ?? r.Month ?? "",
    fertType:       r.fertilizerType ?? r.FertilizerType ?? r.fertType ?? r.Type ?? "",
    fertilizerType: r.fertilizerType ?? r.FertilizerType ?? r.fertType ?? r.Type ?? "",
    quantity:       Number(r.quantity ?? r.Quantity ?? r.qty ?? r.Qty ?? 0),
    unit:           r.unit ?? r.Unit ?? "kg",
    date:           (r.requestDate ?? r.RequestDate) ? String(r.requestDate ?? r.RequestDate).split("T")[0] : (r.date ?? r.Date ?? ""),
    status:         String(r.status ?? r.Status ?? "pending").toLowerCase(),
    createdAt:      r.createdAt ?? r.CreatedAt ?? r.requestDate ?? r.RequestDate ?? new Date().toISOString(),
    updatedAt:      r.updatedAt ?? r.UpdatedAt ?? null,
    requestedDate:  r.requestDate ?? r.RequestDate ?? r.requestedDate ?? r.RequestedDate ?? "",
    regNo:          r.regNo ?? r.RegNo,
    remarks:        r.remarks ?? r.Remarks ?? "",
  };
}

export function mapItemRequest(r) {
  if (!r) return r;
  return {
    id:            r.id ?? r.Id,
    requestNo:     r.requestNo ?? r.RequestNo ?? "",
    month:         r.month ?? r.Month ?? "",
    itemType:      r.itemType ?? r.ItemType ?? r.type ?? r.Type ?? "",
    quantity:      Number(r.quantity ?? r.Quantity ?? r.qty ?? r.Qty ?? 0),
    unit:          r.unit ?? r.Unit ?? "units",
    date:          (r.requestDate ?? r.RequestDate) ? String(r.requestDate ?? r.RequestDate).split("T")[0] : (r.date ?? r.Date ?? ""),
    status:        String(r.status ?? r.Status ?? "pending").toLowerCase(),
    createdAt:     r.createdAt ?? r.CreatedAt ?? r.requestDate ?? r.RequestDate ?? new Date().toISOString(),
    updatedAt:     r.updatedAt ?? r.UpdatedAt ?? null,
    requestedDate: r.requestDate ?? r.RequestDate ?? r.requestedDate ?? r.RequestedDate ?? "",
    regNo:         r.regNo ?? r.RegNo,
    remarks:       r.remarks ?? r.Remarks ?? "",
  };
}
