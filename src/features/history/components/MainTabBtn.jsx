import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { Text } from "../../../components/Text";

export function MainTabBtn({ id, icon, label, mainTab, setMainTab, colors, fs }) {
  const active = mainTab === id;
  return (
    <TouchableOpacity
      onPress={() => setMainTab(id)}
      activeOpacity={0.8}
      style={{
        flex:            1,
        flexDirection:   "row",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             8,
        minHeight:       60,
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderRadius:    10,
        backgroundColor: active ? colors.primary : "transparent",
      }}
    >
      <View style={{ width: 24, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={18} color={active ? "#fff" : colors.textSecondary} />
      </View>
      <Text
        adjustsFontSizeToFit
        numberOfLines={2}
        minimumFontScale={0.72}
        style={{
          fontSize:   fs.sm,
          fontWeight: "700",
          color:      active ? "#fff" : colors.textSecondary,
          textAlign:  "center",
          flex:       1,
          flexShrink: 1,
          minWidth:   0,
          maxWidth:   "100%",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
