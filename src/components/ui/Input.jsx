import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function Input({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, style, editable = true, right }) {
  const { colors, fs } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
        <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: editable ? colors.inputBg : colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 10,
      }}>
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
              flex: 1,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: colors.text,
              fontSize: fs.base,
            },
            style,
          ]}
        />
        {right && (
          <View style={{ paddingRight: 12 }}>{right}</View>
        )}
      </View>
    </View>
  );
}
