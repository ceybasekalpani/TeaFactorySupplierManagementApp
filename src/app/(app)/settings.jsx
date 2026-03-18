import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarMenu from "../../components/SidebarMenu";
import { Card, ScreenHeader } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const SLIDER_MIN = 10;
const SLIDER_MAX = 100;
const THUMB_SIZE = 26;

function FontSizeSlider({ value, onChange, colors }) {
  const [trackWidth, setTrackWidth] = React.useState(0);

  const clamp = (v) => Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.round(v)));

  const handleTouch = (locationX) => {
    if (trackWidth === 0) return;
    const usable = trackWidth - THUMB_SIZE;
    const ratio = (locationX - THUMB_SIZE / 2) / usable;
    onChange(clamp(SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN)));
  };

  const responder = React.useMemo(() => ({
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e) => handleTouch(e.nativeEvent.locationX),
    onResponderMove: (e) => handleTouch(e.nativeEvent.locationX),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [trackWidth]);

  const usable = trackWidth - THUMB_SIZE;
  const thumbLeft = trackWidth > 0
    ? ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * usable
    : 0;
  const fillPercent = ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...responder}
      style={{ height: 44, justifyContent: "center" }}
    >
      {/* Track background */}
      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
        <View style={{ width: `${fillPercent}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 2 }} />
      </View>
      {/* Thumb */}
      {trackWidth > 0 && (
        <View style={{
          position: "absolute",
          left: thumbLeft,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 4,
          elevation: 4,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
        </View>
      )}
    </View>
  );
}

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
        {subtitle ? <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={fs.md} color={colors.textMuted} />)}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }) {
  const { colors, fs } = useTheme();
  return (
    <Text style={{
      color: colors.textMuted,
      fontSize: fs.xs,
      fontWeight: "700",
      letterSpacing: 1.2,
      marginTop: 20,
      marginBottom: 4,
      paddingHorizontal: 4,
    }}>
      {title.toUpperCase()}
    </Text>
  );
}

export default function SettingsScreen() {
  const { colors, fs, t, isDark } = useTheme();
  const { theme, updateTheme, language, updateLanguage, fontSize, updateFontSize, currentUser, activeReg } = useApp();
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
            subtitle={currentUser ? `${currentUser.name} · ${currentUser.phone}` : "Update photo, address & phone"}
            onPress={() => router.push("/(app)/profile")}
          />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <SettingRow
            icon="card"
            iconBg="#dcfce7"
            iconColor="#16a34a"
            title={t.accountDetails}
            subtitle={currentUser ? `${currentUser.bankName} · ${currentUser.accountNumber}` : "Bank name, account number"}
            onPress={() => router.push("/(app)/account-details")}
          />
        </Card>

        {/* APPEARANCE */}
        <SectionHeader title="Appearance" />
        <Card>
          {/* Theme Toggle */}
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: "#f3e8ff",
                alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name="text" size={fs.lg} color="#7c3aed" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: fs.base, fontWeight: "600" }}>{t.fontSize}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>
                  {typeof fontSize === "number" ? `Size ${fontSize}` : t[fontSize]}
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "700", minWidth: 32, textAlign: "right" }}>
                {typeof fontSize === "number" ? fontSize : 50}
              </Text>
            </View>

            <FontSizeSlider
              value={typeof fontSize === "number" ? fontSize : 50}
              onChange={updateFontSize}
              colors={colors}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
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
            ].map((lang) => {
              const isActive = language === lang.key;
              return (
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
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderWidth: 1.5,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: fs.lg }}>{lang.flag}</Text>
                  <Text style={{
                    color: isActive ? "#fff" : colors.text,
                    fontWeight: isActive ? "700" : "500",
                    fontSize: fs.sm,
                    flex: 1,
                  }}>
                    {lang.label}
                  </Text>
                  {isActive && <Ionicons name="checkmark-circle" size={fs.lg} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* REGISTRATION */}
        {activeReg && (
          <>
            <SectionHeader title="Registration" />
            <Card>
              <SettingRow
                icon="document-text"
                iconBg="#fef3c7"
                iconColor="#d97706"
                title="Active Registration"
                subtitle={`${activeReg.regNo} · ${activeReg.route}`}
              />
            </Card>
          </>
        )}

      </ScrollView>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="settings" />
    </SafeAreaView>
  );
}
