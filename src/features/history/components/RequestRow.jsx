import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { formatFullDate } from "../utils/dateHelpers";
import { LocalStatusBadge } from "./LocalStatusBadge";

export function RequestRow({ left, requestDate, status, colors, fs, t }) {
  const dateLabel = formatFullDate(requestDate);

  return (
    <View
      style={{
        marginTop:      8,
        paddingTop:     8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      {/* Row 1: description + status badge */}
      <View
        style={{
          flexDirection:  "row",
          justifyContent: "space-between",
          alignItems:     "center",
        }}
      >
        <Text
          style={{
            color:       colors.text,
            fontSize:    fs.xs,
            fontWeight:  "600",
            flex:        1,
            marginRight: 10,
          }}
          numberOfLines={1}
        >
          {left}
        </Text>
        <LocalStatusBadge status={status} fs={fs} colors={colors} t={t} />
      </View>

      {/* Row 2: full requested date */}
      {dateLabel != null && (
        <View
          style={{
            flexDirection: "row",
            alignItems:    "center",
            marginTop:     4,
            gap:           4,
          }}
        >
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "500" }}>
            {t("requested")}: {dateLabel}
          </Text>
        </View>
      )}
    </View>
  );
}
