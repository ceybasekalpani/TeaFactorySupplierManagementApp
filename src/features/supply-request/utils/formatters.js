export function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dateString || "-"; }
}

export function formatQty(qty, unitValue, t) {
  if (!qty && qty !== 0) return "-";
  try {
    const n = parseFloat(qty).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    const unitLabel =
      unitValue === "kg"    ? t.unitKg    :
      unitValue === "units" ? t.unitUnits :
      unitValue === "Nos"   ? t.unitNos   : unitValue;
    return `${n} ${unitLabel}`;
  } catch {
    return "-";
  }
}
