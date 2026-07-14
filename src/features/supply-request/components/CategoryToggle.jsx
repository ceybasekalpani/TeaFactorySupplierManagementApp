import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export function CategoryToggle({ colors, t, category, onSelect }) {
  const categories = [
    { key: "fertilizer", label: t.fertilizer, icon: "leaf-outline", activeClass: "border-[#16a34a] bg-[#dcfce7]", inactiveClass: "border-[#e0e0e0] bg-[#f5f5f5] dark:border-[#333333] dark:bg-[#1e1e1e]", iconColor: "#16a34a" },
    { key: "item", label: t.item, icon: "cube-outline", activeClass: "border-[#d97706] bg-[#fef3c7]", inactiveClass: "border-[#e0e0e0] bg-[#f5f5f5] dark:border-[#333333] dark:bg-[#1e1e1e]", iconColor: "#d97706" },
  ];

  return (
    <View className="flex-row gap-2.5">
      {categories.map((cat) => {
        const isActive = category === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            onPress={() => onSelect(cat.key)}
            className={`flex-1 items-center gap-1.5 rounded-xl border-2 px-2.5 py-3 ${isActive ? cat.activeClass : cat.inactiveClass}`}
          >
            <View className={`h-9 w-9 items-center justify-center rounded-full ${isActive ? "bg-white/40" : "bg-[#e0e0e0]/30 dark:bg-[#333333]/30"}`}>
              <Ionicons
                name={cat.icon}
                size={19}
                color={isActive ? cat.iconColor : colors.textMuted}
              />
            </View>
            <Text className={`text-center text-[11px] ${isActive ? "font-bold" : "font-medium"} ${cat.key === "fertilizer" && isActive ? "text-[#16a34a]" : ""}${cat.key === "item" && isActive ? "text-[#d97706]" : ""}${!isActive ? " text-[#212121] dark:text-white" : ""}`}>
              {cat.label}
            </Text>
            {isActive && (
              <Ionicons name="checkmark-circle" size={15} color={cat.iconColor} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
