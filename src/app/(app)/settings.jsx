import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Modal, PanResponder, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
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

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      if (trackWidth === 0) return;
      const ratio = (e.nativeEvent.locationX - THUMB_SIZE / 2) / (trackWidth - THUMB_SIZE);
      onChange(clamp(SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN)));
    },
    onPanResponderMove: (e) => {
      if (trackWidth === 0) return;
      const ratio = (e.nativeEvent.locationX - THUMB_SIZE / 2) / (trackWidth - THUMB_SIZE);
      onChange(clamp(SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN)));
    },
  }), [trackWidth]);

  const thumbLeft = trackWidth > 0
    ? ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * (trackWidth - THUMB_SIZE)
    : 0;
  const fillPercent = ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
      style={{ height: 44, justifyContent: "center" }}
    >
      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
        <View style={{ width: `${fillPercent}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 2 }} />
      </View>
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
  const { theme, updateTheme, language, updateLanguage, fontSize, updateFontSize, currentUser, changePin } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Change PIN modal state
  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);

  const resetPinState = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setPinSuccess("");
  };

  const handleChangePinSubmit = async () => {
    setPinError("");
    setPinSuccess("");

    if (!currentPin || !newPin || !confirmPin) {
      setPinError("Please fill in all fields.");
      return;
    }
    if (newPin.length < 4) {
      setPinError("New PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("New PIN and Confirm PIN do not match.");
      return;
    }

    setIsChangingPin(true);
    try {
      await changePin(currentPin, newPin);
      setPinSuccess("PIN successfully changed!");
      setTimeout(() => {
        setPinModalVisible(false);
        resetPinState();
      }, 2000);
    } catch (err) {
      setPinError(err.message || "Failed to change PIN. Ensure your current PIN is correct.");
    } finally {
      setIsChangingPin(false);
    }
  };

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
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <SettingRow
            icon="keypad"
            iconBg="#fef08a"
            iconColor="#ca8a04"
            title="Change PIN"
            subtitle="Update your 4-digit security PIN"
            onPress={() => {
              resetPinState();
              setPinModalVisible(true);
            }}
          />
        </Card>

        {/* APPEARANCE */}
        <SectionHeader title="Appearance" />
        <Card>
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
      </ScrollView>

      {/* CHANGE PIN MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{
            backgroundColor: colors.card,
            padding: 24,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text }}>Change Security PIN</Text>
              <TouchableOpacity onPress={() => setPinModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {!!pinError && (
              <View style={{ backgroundColor: "#fee2e2", padding: 10, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: "#ef4444", fontSize: fs.sm, fontWeight: "600" }}>{pinError}</Text>
              </View>
            )}

            {/* Success Message */}
            {!!pinSuccess && (
              <View style={{ backgroundColor: "#dcfce7", padding: 10, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: "#16a34a", fontSize: fs.sm, fontWeight: "600" }}>{pinSuccess}</Text>
              </View>
            )}

            <View style={{ gap: 16, marginBottom: 24 }}>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>Current PIN</Text>
                <TextInput
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="Enter current PIN"
                  placeholderTextColor={colors.placeholder}
                  style={{
                    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
                    borderRadius: 12, paddingHorizontal: 14, height: 48, color: colors.text, fontSize: fs.base
                  }}
                />
              </View>

              <View>
                <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>New PIN</Text>
                <TextInput
                  value={newPin}
                  onChangeText={setNewPin}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="Enter new 4-digit PIN"
                  placeholderTextColor={colors.placeholder}
                  style={{
                    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
                    borderRadius: 12, paddingHorizontal: 14, height: 48, color: colors.text, fontSize: fs.base
                  }}
                />
              </View>

              <View>
                <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 6 }}>Confirm New PIN</Text>
                <TextInput
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="Confirm new 4-digit PIN"
                  placeholderTextColor={colors.placeholder}
                  style={{
                    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
                    borderRadius: 12, paddingHorizontal: 14, height: 48, color: colors.text, fontSize: fs.base
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleChangePinSubmit}
              disabled={isChangingPin}
              style={{
                backgroundColor: isChangingPin ? colors.disabled : colors.primary,
                paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center",
                flexDirection: "row", gap: 8
              }}
            >
              {isChangingPin ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ color: "#fff", fontSize: fs.base, fontWeight: "700" }}>Updating...</Text>
                </>
              ) : (
                <Text style={{ color: "#fff", fontSize: fs.base, fontWeight: "700" }}>Change PIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="settings" />
    </SafeAreaView>
  );
}