import { Text, View } from "react-native";

export function StatRow({ label, value, colors, fs }) {
  return (
    <View
      style={{
        flexDirection:  "row",
        justifyContent: "space-between",
        marginBottom:   6,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: fs.xs }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fs.xs, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}
