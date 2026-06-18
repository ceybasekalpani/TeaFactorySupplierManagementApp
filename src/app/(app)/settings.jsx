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

function FontSizeSlider({ value, onChange }) {
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
  }), [onChange, trackWidth]);

  const thumbLeft = trackWidth > 0
    ? ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * (trackWidth - THUMB_SIZE)
    : 0;
  const fillPercent = ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <View
      className="h-11 justify-center"
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View className="h-1 overflow-hidden rounded-sm bg-[#e0e0e0] dark:bg-[#333333]">
        <View className="h-full rounded-sm bg-[#2e7d32] dark:bg-[#66bb6a]" style={{ width: `${fillPercent}%` }} />
      </View>
      {trackWidth > 0 && (
        <View className="absolute h-[26px] w-[26px] items-center justify-center rounded-full bg-[#2e7d32] shadow-md dark:bg-[#66bb6a]" style={{ left: thumbLeft }}>
          <View className="h-2 w-2 rounded-full bg-white" />
        </View>
      )}
    </View>
  );
}

function SettingRow({ icon, title, subtitle, onPress, rightElement, iconBgClass, iconColor }) {
  const { colors, fs } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center gap-3 py-3.5"
    >
      <View className={`h-10 w-10 items-center justify-center rounded-[10px] ${iconBgClass || "bg-[#f5f5f5] dark:bg-[#1e1e1e]"}`}>
        <Ionicons name={icon} size={fs.lg} color={iconColor || colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-[#212121] dark:text-white">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[11px] text-[#757575] dark:text-[#b0b0b0]">{subtitle}</Text> : null}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={fs.md} color={colors.textMuted} />)}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }) {
  return (
    <Text className="mb-1 mt-5 px-1 text-[11px] font-bold uppercase tracking-[1.2px] text-[#9e9e9e]">
      {title}
    </Text>
  );
}

function PinInput({ label, value, onChangeText, placeholder, colors }) {
  return (
    <View>
      <Text className="mb-1.5 text-[13px] font-semibold text-[#757575] dark:text-[#b0b0b0]">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        keyboardType="numeric"
        maxLength={4}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        className="h-12 rounded-xl border border-[#e0e0e0] bg-[#f5f5f5] px-3.5 text-[15px] text-[#212121] dark:border-[#333333] dark:bg-[#252525] dark:text-white"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, fs, t, isDark } = useTheme();
  const { updateTheme, language, updateLanguage, fontSize, updateFontSize, currentUser, changePin } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <ScreenHeader
        title={t.settings}
        onBack={() => router.back()}
        rightIcon="menu"
        onRightPress={() => setMenuOpen(true)}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-10">
          <SectionHeader title="Account" />
          <Card>
            <SettingRow
              icon="person"
              iconBgClass="bg-[#dbeafe]"
              iconColor="#2563eb"
              title={t.profile}
              subtitle={currentUser ? `${currentUser.name} - ${currentUser.phone}` : "Update photo, address & phone"}
              onPress={() => router.push("/(app)/profile")}
            />
            <View className="h-px bg-[#e0e0e0] dark:bg-[#333333]" />
            <SettingRow
              icon="card"
              iconBgClass="bg-[#dcfce7]"
              iconColor="#16a34a"
              title={t.accountDetails}
              subtitle={currentUser ? `${currentUser.bankName} - ${currentUser.accountNumber}` : "Bank name, account number"}
              onPress={() => router.push("/(app)/account-details")}
            />
            <View className="h-px bg-[#e0e0e0] dark:bg-[#333333]" />
            <SettingRow
              icon="keypad"
              iconBgClass="bg-[#fef08a]"
              iconColor="#ca8a04"
              title="Change PIN"
              subtitle="Update your 4-digit security PIN"
              onPress={() => {
                resetPinState();
                setPinModalVisible(true);
              }}
            />
          </Card>

          <SectionHeader title="Appearance" />
          <Card>
            <SettingRow
              icon={isDark ? "moon" : "sunny"}
              iconBgClass={isDark ? "bg-[#1e1b4b]" : "bg-[#fef3c7]"}
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
            <View className="h-px bg-[#e0e0e0] dark:bg-[#333333]" />

            <View className="py-3.5">
              <View className="mb-4 flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-[10px] bg-[#f3e8ff]">
                  <Ionicons name="text" size={fs.lg} color="#7c3aed" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-[#212121] dark:text-white">{t.fontSize}</Text>
                  <Text className="mt-0.5 text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                    {typeof fontSize === "number" ? `Size ${fontSize}` : t[fontSize]}
                  </Text>
                </View>
                <Text className="min-w-8 text-right text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
                  {typeof fontSize === "number" ? fontSize : 50}
                </Text>
              </View>

              <FontSizeSlider
                value={typeof fontSize === "number" ? fontSize : 50}
                onChange={updateFontSize}
              />
            </View>
          </Card>

          <SectionHeader title="Language" />
          <Card>
            <View className="flex-row gap-2.5">
              {[
                { key: "english", label: t.english, flag: "\uD83C\uDDEC\uD83C\uDDE7" },
                { key: "sinhala", label: t.sinhala, flag: "\uD83C\uDDF1\uD83C\uDDF0" },
              ].map((lang) => {
                const isActive = language === lang.key;
                return (
                  <TouchableOpacity
                    key={lang.key}
                    onPress={() => updateLanguage(lang.key)}
                    className={`flex-1 flex-row items-center gap-2 rounded-xl border-[1.5px] px-3.5 py-3 ${isActive ? "border-[#2e7d32] bg-[#2e7d32] dark:border-[#66bb6a] dark:bg-[#66bb6a]" : "border-[#e0e0e0] bg-[#f5f5f5] dark:border-[#333333] dark:bg-[#1e1e1e]"}`}
                  >
                    <Text className="text-[19px]">{lang.flag}</Text>
                    <Text className={`flex-1 text-[13px] ${isActive ? "font-bold text-white" : "font-medium text-[#212121] dark:text-white"}`}>
                      {lang.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark-circle" size={fs.lg} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isPinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-[28px] bg-white p-6 shadow-lg dark:bg-[#242424]">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-[19px] font-bold text-[#212121] dark:text-white">Change Security PIN</Text>
              <TouchableOpacity onPress={() => setPinModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {!!pinError && (
              <View className="mb-4 rounded-lg bg-[#fee2e2] p-2.5">
                <Text className="text-[13px] font-semibold text-[#ef4444]">{pinError}</Text>
              </View>
            )}

            {!!pinSuccess && (
              <View className="mb-4 rounded-lg bg-[#dcfce7] p-2.5">
                <Text className="text-[13px] font-semibold text-[#16a34a]">{pinSuccess}</Text>
              </View>
            )}

            <View className="mb-6 gap-4">
              <PinInput label="Current PIN" value={currentPin} onChangeText={setCurrentPin} placeholder="Enter current PIN" colors={colors} />
              <PinInput label="New PIN" value={newPin} onChangeText={setNewPin} placeholder="Enter new 4-digit PIN" colors={colors} />
              <PinInput label="Confirm New PIN" value={confirmPin} onChangeText={setConfirmPin} placeholder="Confirm new 4-digit PIN" colors={colors} />
            </View>

            <TouchableOpacity
              onPress={handleChangePinSubmit}
              disabled={isChangingPin}
              className={`flex-row items-center justify-center gap-2 rounded-[14px] py-3.5 ${isChangingPin ? "bg-[#bdbdbd]" : "bg-[#2e7d32] dark:bg-[#66bb6a]"}`}
            >
              {isChangingPin ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-[15px] font-bold text-white">Updating...</Text>
                </>
              ) : (
                <Text className="text-[15px] font-bold text-white">Change PIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SidebarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeKey="settings" />
    </SafeAreaView>
  );
}
