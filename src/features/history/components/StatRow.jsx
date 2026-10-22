import { View } from "react-native";
import { Text } from "../../../components/Text";

export function StatRow({ label, value, colors, fs }) {
  return (
    <View
      style={{
        flexDirection:  "row",
        justifyContent: "space-between",
        marginBottom:   6,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: fs.xs, flex: 1, minWidth: 0, marginRight: 8 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fs.xs, fontWeight: "700", flex: 1, minWidth: 0, textAlign: "right" }}>{value}</Text>
    </View>
  );
}
