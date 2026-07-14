import { Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function StatusBadge({ status }) {
  const { colors, fs, t } = useTheme();
  const config = {
    pending: { bg: "#fef3c7", text: "#b45309", label: t.pending },
    approved: { bg: "#dcfce7", text: "#15803d", label: t.approved },
    rejected: { bg: "#fee2e2", text: "#b91c1c", label: t.rejected },
    paid: { bg: "#dbeafe", text: "#1d4ed8", label: t.paid },
    dispatched: { bg: "#dbeafe", text: "#1d4ed8", label: t.dispatched },
    issued: { bg: "#dbeafe", text: "#1d4ed8", label: t.issued },
  };
  const c = config[status] || config.pending;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: c.text, fontSize: fs.xs, fontWeight: "700" }}>{c.label}</Text>
    </View>
  );
}
