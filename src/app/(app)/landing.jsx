import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { buildLoginSchema } from "../../schemas/loginSchema";

function Field({ icon, placeholder, value, onChangeText, secureTextEntry, right, hasError, keyboardType }) {
  const { colors } = useTheme();
  return (
    <View className={`h-[52px] flex-row items-center gap-2.5 rounded-[14px] border-[1.5px] bg-[#f5f5f5] px-3.5 dark:bg-[#252525] ${hasError ? "border-[#b71c1c] dark:border-[#ef5350]" : "border-[#e0e0e0] dark:border-[#333333]"}`}>
      <Ionicons name={icon} size={19} color={hasError ? colors.error : colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        className="flex-1 py-0 text-[15px] text-[#212121] dark:text-white"
      />
      {right}
    </View>
  );
}

export default function LandingScreen() {
  const { colors, fs, t } = useTheme();
  const { signIn, login } = useApp();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    const validation = buildLoginSchema(t).safeParse({ username, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const result = await signIn(validation.data.username, validation.data.password);
      if (!result) {
        setError(t.invalidCredentialsRetry);
        return;
      }
      if (!result.registrations || result.registrations.length === 0) {
        setError(t.noActiveRegistrationContact);
        return;
      }

      if (result.isCreatePin) {
        if (result.registrations.length > 1) {
          router.replace("/(auth)/select-account");
        } else if (result.registrations.length === 1) {
          await login(result.registrations[0], result.token);
          router.replace("/(app)/home");
        } else {
          router.replace("/(app)/home");
        }
      } else {
        router.replace("/(auth)/pin-setup");
      }

    } catch (err) {
      setError(err.message || t.loginFailedRetry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <KeyboardView>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="min-h-full">
            <View className="items-center overflow-hidden rounded-b-[44px] bg-[#2e7d32] px-6 pb-[90px] pt-14 dark:bg-[#66bb6a]">
              <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <View className="absolute right-5 top-[30px] h-[70px] w-[70px] rounded-full bg-white/10" />
              <View className="absolute -left-[30px] bottom-2.5 h-[120px] w-[120px] rounded-full bg-white/10" />
              <View className="absolute -right-2.5 bottom-10 h-[60px] w-[60px] rounded-full bg-white/5" />

              <View className="mb-[18px] h-24 w-24 items-center justify-center rounded-full border-2 border-white/25 bg-white/20">
                <Text className="text-[50px]">{"\uD83C\uDF43"}</Text>
              </View>

              <Text className="text-center text-[32px] font-black tracking-[0.5px] text-white">
                {t.appName}
              </Text>
              <Text className="mt-1.5 text-center text-[13px] tracking-[0.3px] text-white/75">
                {t.supplierPortalSubtitle}
              </Text>
            </View>

            <View className="-mt-11 flex-1 px-5 pb-7">
              <View className="rounded-[28px] border border-[#e0e0e0] bg-white p-[26px] shadow-lg dark:border-[#333333] dark:bg-[#242424]">
                <Text className="text-[22px] font-extrabold text-[#212121] dark:text-white">
                  {t.welcomeBackWave}
                </Text>
                <Text className="mb-[26px] mt-1 text-[13px] text-[#757575] dark:text-[#b0b0b0]">
                  {t.signInSubtitle}
                </Text>

                <Text className="mb-2 text-[13px] font-semibold text-[#757575] dark:text-[#b0b0b0]">
                  {t.username}
                </Text>
                <Field
                  icon="person-outline"
                  placeholder={t.usernamePlaceholder}
                  value={username}
                  onChangeText={(v) => { setUsername(v); setError(""); }}
                  hasError={!!error}
                />

                <Text className="mb-2 mt-4 text-[13px] font-semibold text-[#757575] dark:text-[#b0b0b0]">
                  {t.password}
                </Text>
                <Field
                  icon="lock-closed-outline"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  secureTextEntry={!showPassword}
                  hasError={!!error}
                  right={
                    <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={fs.lg}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  }
                />

                {!!error && (
                  <View className="mt-3 flex-row items-center gap-1.5 rounded-[10px] bg-[#b71c1c]/10 px-3 py-2 dark:bg-[#ef5350]/10">
                    <Ionicons name="alert-circle" size={15} color={colors.error} />
                    <Text className="flex-1 text-[13px] text-[#b71c1c] dark:text-[#ef5350]">{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={loading}
                  activeOpacity={0.85}
                  className={`mt-[22px] flex-row items-center justify-center gap-2 rounded-[14px] py-[15px] shadow-md ${loading ? "bg-[#bdbdbd]" : "bg-[#2e7d32] dark:bg-[#66bb6a]"}`}
                >
                  {loading ? (
                    <>
                      <Ionicons name="sync-outline" size={fs.md} color="#fff" />
                      <Text className="text-[17px] font-bold text-white">{t.signingIn}</Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-[17px] font-extrabold text-white">{t.signIn}</Text>
                      <Ionicons name="arrow-forward" size={fs.md} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}
