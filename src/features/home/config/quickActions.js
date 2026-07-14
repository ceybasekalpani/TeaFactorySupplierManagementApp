export const notificationIconMap = {
  success: { name: "checkmark-circle", color: "#16a34a", bg: "#dcfce7" },
  warning: { name: "warning",          color: "#d97706", bg: "#fef3c7" },
  error:   { name: "close-circle",     color: "#dc2626", bg: "#fee2e2" },
  info:    { name: "information-circle", color: "#2563eb", bg: "#dbeafe" },
};

// Quick actions — "Leaf History & Summary" navigates to history tab by default
export function buildQuickActions(t, featureFlags) {
  return [
    {
      label:   t.cashRequest || "Cash Request",
      icon:    "cash-outline",
      route:   "/(app)/cash-request",
      color:   "#22c55e",
      enabled: featureFlags.cash,
    },
    {
      label:   t.fertilizerItemRequest || "Fertilizer & Items",
      icon:    "leaf-outline",
      route:   "/(app)/fertilizerItem-request",
      color:   "#0891b2",
      enabled: featureFlags.fertilizer || featureFlags.item,
    },
    {
      label:   t.leafCard || "Leaf Card",
      icon:    "card-outline",
      route:   "/(app)/leaf-details?tab=card",
      color:   "#7c3aed",
      enabled: true,
    },
    {
      // ── renamed for clarity; leads to the combined history screen ──
      label:   t.leafAndAccountHistory || "Leaf & Account History",
      icon:    "bar-chart-outline",
      route:   "/(app)/history",
      color:   "#e11d48",
      enabled: true,
    },
    {
      label:   t.landInfo || "Land Info",
      icon:    "map-outline",
      route:   "/(app)/land-info",
      color:   "#059669",
      enabled: true,
    },
    {
      label:   t.settings || "Settings",
      icon:    "settings-outline",
      route:   "/(app)/settings",
      color:   "#64748b",
      enabled: true,
    },
  ];
}
