import { Text, View } from "react-native";

// Distinct from the shared components/ui StatusBadge — this one supports
// paid/dispatched/issued in addition to pending/approved/rejected, and takes
// colors/fs/t as props rather than pulling them from useTheme() itself.
const STATUS_COLOR = {
  pending:    { bg: "#fef3c7", text: "#d97706" },
  approved:   { bg: "#dcfce7", text: "#16a34a" },
  paid:       { bg: "#dbeafe", text: "#2563eb" },
  dispatched: { bg: "#e0e7ff", text: "#4f46e5" },
  issued:     { bg: "#e0e7ff", text: "#4f46e5" },
  rejected:   { bg: "#fee2e2", text: "#dc2626" },
};

export function LocalStatusBadge({ status, fs, colors, t }) {
  const s =
    STATUS_COLOR[status?.toLowerCase()] ?? {
      bg: colors.surface,
      text: colors.textSecondary,
    };
  const statusKey = status?.toLowerCase();
  const label = (statusKey && t(statusKey)) ? t(statusKey) : (status ?? "—");
  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
    >
      <Text
        style={{
          color:         s.text,
          fontSize:      fs.xs,
          fontWeight:    "700",
          textTransform: "capitalize",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
