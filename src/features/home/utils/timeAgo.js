export function timeAgo(isoString, t) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  if (days    > 0) return `${days} ${days > 1 ? t.timeUnitDayPlural : t.timeUnitDay} ${t.timeAgoSuffix}`;
  if (hours   > 0) return `${hours} ${hours > 1 ? t.timeUnitHourPlural : t.timeUnitHour} ${t.timeAgoSuffix}`;
  if (minutes > 0) return `${minutes} ${minutes > 1 ? t.timeUnitMinutePlural : t.timeUnitMinute} ${t.timeAgoSuffix}`;
  return t.justNow;
}
