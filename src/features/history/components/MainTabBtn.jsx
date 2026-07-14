import { Text, TouchableOpacity } from "react-native";

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
        gap:             6,
        paddingVertical: 10,
        borderRadius:    10,
        backgroundColor: active ? colors.primary : "transparent",
      }}
    >
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text
        style={{
          fontSize:   fs.sm,
          fontWeight: "700",
          color:      active ? "#fff" : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
