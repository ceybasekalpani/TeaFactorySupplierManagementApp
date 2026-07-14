// Parse "yyyy-MM-dd" ISO string → "14 May 2026"
export function formatFullDate(isoDate) {
  if (!isoDate) return null;
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return isoDate;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "long",
    year:  "numeric",
  });
}
