import { ScrollView, View } from "react-native";
import { Text } from "../../../components/Text";

export function BarChart({ historyArray, maxNet, colors, fs, t }) {
  if (!historyArray.length)
    return (
      <View style={{ alignItems: "center", padding: 24 }}>
        <Text style={{ color: colors.textSecondary }}>{t("noDataAvailable")}</Text>
      </View>
    );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: "100%" }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 205, gap: 10, minWidth: historyArray.length * 70 }}>
      {historyArray.map((month, index) => {
        const totalNet   = month?.totalNet ?? 0;
        const barHeight  = maxNet > 0 ? (totalNet / maxNet) * 135 : 0;
        const monthLabel = month?.label || `Month ${index + 1}`;
        return (
          <View key={month?.key || index} style={{ width: 60, alignItems: "center" }}>
            <Text
              style={{
                color:        colors.primary,
                fontSize:     fs.xs,
                fontWeight:   "700",
                marginBottom: 5,
              }}
            >
              {totalNet > 0 ? Math.round(totalNet) : ""}
            </Text>
            <View
              style={{
                width:           "100%",
                height:          Math.max(barHeight, 4),
                backgroundColor: colors.primary,
                borderRadius:    8,
                opacity:         totalNet > 0 ? 1 : 0.25,
              }}
            />
            <Text
              style={{
                color:      colors.textMuted,
                fontSize:   9,
                marginTop:  6,
                textAlign:  "center",
                fontWeight: "500",
              }}
            >
              {monthLabel.replace(/\s+/, "\n")}
            </Text>
          </View>
        );
      })}
      </View>
    </ScrollView>
  );
}
