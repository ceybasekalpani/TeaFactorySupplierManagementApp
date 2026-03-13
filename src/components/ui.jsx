import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useTheme } from "../hooks/useTheme";

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, className }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────────
export function Button({ title, onPress, variant = "primary", disabled, loading, icon, style }) {
  const { colors, fs } = useTheme();
  const bg = variant === "primary" ? colors.primary
    : variant === "secondary" ? colors.surface
    : variant === "danger" ? colors.error
    : "transparent";
  const textColor = variant === "primary" ? colors.white
    : variant === "secondary" ? colors.primary
    : variant === "danger" ? colors.white
    : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: disabled ? colors.textMuted : bg,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={fs.md} color={textColor} />}
          <Text style={{ color: textColor, fontWeight: "700", fontSize: fs.md }}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, style, editable = true }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
        <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
        style={[
          {
            backgroundColor: editable ? colors.inputBg : colors.surface,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: colors.text,
            fontSize: fs.base,
          },
          style,
        ]}
      />
    </View>
  );
}

// ── Picker (custom dropdown) ───────────────────────────────────────────────────
export function Picker({ label, value, options, onSelect, placeholder }) {
  const { colors, fs } = useTheme();
  const [open, setOpen] = React.useState(false);
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

// ── Toggle Tabs ────────────────────────────────────────────────────────────────
export function ToggleTabs({ tabs, activeTab, onSelect }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    }}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              borderRadius: 10,
              backgroundColor: active ? colors.primary : "transparent",
            }}
          >
            <Text style={{
              color: active ? colors.white : colors.textSecondary,
              fontWeight: active ? "700" : "500",
              fontSize: fs.sm,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const { colors, fs } = useTheme();
  const config = {
    pending: { bg: "#fef3c7", text: "#b45309", label: "Pending" },
    approved: { bg: "#dcfce7", text: "#15803d", label: "Approved" },
    rejected: { bg: "#fee2e2", text: "#b91c1c", label: "Rejected" },
  };
  const c = config[status] || config.pending;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: c.text, fontSize: fs.xs, fontWeight: "700" }}>{c.label}</Text>
    </View>
  );
}

// ── Screen Header ──────────────────────────────────────────────────────────────
export function ScreenHeader({ title, onBack, rightIcon, onRightPress }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    }}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={fs.xl} color={colors.text} />
        </TouchableOpacity>
      )}
      <Text style={{ flex: 1, fontSize: fs.lg, fontWeight: "700", color: colors.text }}>{title}</Text>
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={{ padding: 4 }}>
          <Ionicons name={rightIcon} size={fs.xl} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, message }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: 32 }}>
      <Ionicons name={icon || "leaf-outline"} size={48} color={colors.textMuted} />
      <Text style={{ color: colors.textMuted, fontSize: fs.base, marginTop: 12, textAlign: "center" }}>
        {message}
      </Text>
    </View>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, visible, type = "success" }) {
  const { colors, fs } = useTheme();
  if (!visible) return null;
  const bg = type === "success" ? colors.success : type === "error" ? colors.error : colors.info;
  return (
    <View style={{
      position: "absolute",
      bottom: 90,
      left: 20,
      right: 20,
      backgroundColor: bg,
      borderRadius: 12,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      zIndex: 9999,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    }}>
      <Ionicons
        name={type === "success" ? "checkmark-circle" : type === "error" ? "close-circle" : "information-circle"}
        size={fs.xl}
        color="#fff"
      />
      <Text style={{ color: "#fff", fontSize: fs.sm, flex: 1, fontWeight: "600" }}>{message}</Text>
    </View>
  );
}