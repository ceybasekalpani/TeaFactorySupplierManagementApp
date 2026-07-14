import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function Picker({ label, value, options, onSelect, placeholder }) {
  const { colors, fs } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options?.find((o) => (typeof o === "string" ? o : o.value) === value);
  const displayLabel = selected
    ? typeof selected === "string" ? selected : selected.label
    : placeholder || "Select...";

  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
        <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={{
          backgroundColor: colors.inputBg,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: value ? colors.text : colors.textMuted, fontSize: fs.base, flex: 1 }}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={fs.md} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "#00000055", justifyContent: "center", padding: 24 }}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: "hidden", maxHeight: 400 }}>
            <ScrollView>
              {options?.map((opt, i) => {
                const val = typeof opt === "string" ? opt : opt.value;
                const lbl = typeof opt === "string" ? opt : opt.label;
                const isSelected = val === value;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => { onSelect(val); setOpen(false); }}
                    style={{
                      padding: 16,
                      backgroundColor: isSelected ? colors.surface : "transparent",
                      borderBottomWidth: i < options.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: isSelected ? colors.primary : colors.text, fontSize: fs.base, fontWeight: isSelected ? "700" : "400" }}>
                      {lbl}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={fs.lg} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
