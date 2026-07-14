import { Text, View } from "react-native";

export function SummarySection({ icon, title, accentColor, count, colors, fs, children }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius:    16,
        borderWidth:     1,
        borderColor:     colors.cardBorder,
        marginBottom:    16,
        overflow:        "hidden",
      }}
    >
      <View
        style={{
          flexDirection:     "row",
          alignItems:        "center",
          gap:               12,
          backgroundColor:   accentColor + "12",
          paddingVertical:   14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: accentColor + "25",
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <Text
          style={{
            flex:       1,
            fontSize:   fs.sm,
            fontWeight: "700",
            color:      accentColor,
          }}
        >
          {title}
        </Text>
        <View
          style={{
            backgroundColor:   accentColor,
            borderRadius:      14,
            minWidth:          28,
            height:            28,
            alignItems:        "center",
            justifyContent:    "center",
            paddingHorizontal: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: fs.xs, fontWeight: "800" }}>
            {count}
          </Text>
        </View>
      </View>
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
}
