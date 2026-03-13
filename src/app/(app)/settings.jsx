import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Card, ScreenHeader } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

function SettingRow({ icon, title, subtitle, onPress, rightElement, iconBg, iconColor }) {
  const { colors, fs } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: iconBg || colors.surface,
        alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name={icon} size={fs.lg} color={iconColor || colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: fs.base, fontWeight: "600" }}>{title}</Text>
        {subtitle && <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={fs.md} color={colors.textMuted} />)}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }) {
  const { colors, fs } = useTheme();
  return (
    <Text style={{ color: colors.textMuted, fontSize: fs.xs, fontWeight: "700", letterSpacing: 1.2, marginTop: 20, marginBottom: 4, paddingHorizontal: 4 }}>
      {title.toUpperCase()}
    </Text>
  );
}

export default function SettingsScreen() {
  const { colors, fs, t, isDark } = useTheme();
  const { theme, updateTheme, language, updateLanguage, fontSize, updateFontSize } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t.settings}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* ACCOUNT */}
        <SectionHeader title="Account" />
        <Card>
          <SettingRow
            icon="person"
            iconBg="#dbeafe"
            iconColor="#2563eb"
            title={t.profile}
            subtitle="Update photo, address & phone"
            onPress={() => router.push("/(app)/profile")}
          />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <SettingRow
            icon="card"
            iconBg="#dcfce7"
            iconColor="#16a34a"
            title={t.accountDetails}
            subtitle="Bank name, account number"
            onPress={() => router.push("/(app)/account-details")}
          />
        </Card>

        {/* APPEARANCE */}
        <SectionHeader title="Appearance" />
        <Card>
          {/* Theme */}
          <SettingRow
            icon={isDark ? "moon" : "sunny"}
            iconBg={isDark ? "#1e1b4b" : "#fef3c7"}
            iconColor={isDark ? "#818cf8" : "#d97706"}
            title={t.theme}
            subtitle={isDark ? t.dark : t.light}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={(v) => updateTheme(v ? "dark" : "light")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Font Size */}
          <View style={{ paddingVertical: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#f3e8ff", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="text" size={fs.lg} color="#7c3aed" />
              </View>
              <Text style={{ color: colors.text, fontSize: fs.base, fontWeight: "600" }}>{t.fontSize}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["small", "medium", "large"].map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => updateFontSize(size)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: fontSize === size ? colors.primary : colors.surface,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: fontSize === size ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{
                    color: fontSize === size ? "#fff" : colors.textSecondary,
                    fontWeight: fontSize === size ? "700" : "500",
                    fontSize: size === "small" ? 11 : size === "medium" ? 13 : 16,
                  }}>
                    {t[size]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* LANGUAGE */}
        <SectionHeader title="Language" />
        <Card>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { key: "english", label: t.english, flag: "🇬🇧" },
              { key: "sinhala", label: t.sinhala, flag: "🇱🇰" },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.key}
                onPress={() => updateLanguage(lang.key)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: language === lang.key ? colors.primary : colors.surface,
                  borderWidth: 1.5,
                  borderColor: language === lang.key ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontSize: fs.lg }}>{lang.flag}</Text>
                <Text style={{
                  color: language === lang.key ? "#fff" : colors.text,
                  fontWeight: language === lang.key ? "700" : "500",
                  fontSize: fs.sm,
                  flex: 1,
                }}>
                  {lang.label}
                </Text>
                {language === lang.key && (
                  <Ionicons name="checkmark-circle" size={fs.lg} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="settings" />
    </SafeAreaView>
  );
}
