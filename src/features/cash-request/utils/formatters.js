export function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return dateString || "-"; }
}

export function formatCurrency(amount) {
  if (!amount && amount !== 0) return "0";
  try { return parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  catch { return "0"; }
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const [y, m, d] = dateStr.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d))
      .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
}
