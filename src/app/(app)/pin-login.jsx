import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";

const PIN_LENGTH = 4;

function PinDots({ value, hasError }) {
  return (
    <View className="my-7 flex-row justify-center gap-[18px]">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => {
        const filled = i < value.length;
        return (
          <View
            key={i}
            className={`h-[18px] w-[18px] rounded-full border-2 ${
              hasError
                ? "border-[#b71c1c] bg-[#b71c1c] dark:border-[#ef5350] dark:bg-[#ef5350]"
                : filled
                  ? "border-[#2e7d32] bg-[#2e7d32] dark:border-[#66bb6a] dark:bg-[#66bb6a]"
                  : "border-[#e0e0e0] bg-transparent dark:border-[#333333]"
            }`}
          />
        );
      })}
    </View>
  );
}

function NumPad({ onPress, onDelete }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <View className="w-[270px] flex-row flex-wrap justify-center gap-4">
      {keys.map((key, i) => {
        if (key === "") return <View key={i} className="w-[74px]" />;
        const isDel = key === "del";
        return (
          <TouchableOpacity
            key={i}
            onPress={() => isDel ? onDelete() : onPress(key)}
            activeOpacity={0.7}
            className={`h-[74px] w-[74px] items-center justify-center rounded-full ${
              isDel
                ? "bg-transparent"
                : "border border-[#e0e0e0] bg-white shadow-sm dark:border-[#333333] dark:bg-[#242424]"
            }`}
          >
            {isDel ? (
              <Ionicons name="backspace-outline" size={26} color="#757575" />
            ) : (
              <Text className="text-[26px] font-medium text-[#212121] dark:text-white">{key}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function PinLoginScreen() {
  const { t } = useTheme();
  const { savedRegNo, savedName, pinLogin, login } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeRegNo = params.regNo || savedRegNo;
  const displayName = params.name || savedName || "User";

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const handlePress = (key) => {
    if (pin.length >= PIN_LENGTH || loading) return;
    const next = pin + key;
    setPin(next);
    setError("");

    if (next.length === PIN_LENGTH) {
      setTimeout(() => submitPin(next), 120);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const submitPin = async (entered) => {
    if (!activeRegNo) return;
    setLoading(true);
    try {
      const result = await pinLogin(activeRegNo, entered);
      if (!result) {
        Vibration.vibrate(300);
        setError(t.wrongPinRetry);
        setPin("");
        setLoading(false);
        return;
      }
      const regs = result.registrations;
      if (regs.length > 1) {
        router.replace("/(auth)/select-account");
      } else if (regs.length === 1) {
        await login(regs[0], result.token);
        router.replace("/(app)/home");
      } else {
        router.replace("/(app)/home");
      }
    } catch (err) {
      Vibration.vibrate(300);
      setError(err.message || t.wrongPinRetry);
      setPin("");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <View className="flex-1 items-center px-6 pt-[60px]">
        <View className="mb-4 h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] border-[#2e7d32]/40 bg-[#2e7d32] dark:border-[#66bb6a]/40 dark:bg-[#66bb6a]">
          <Text className="text-[32px] font-bold text-white">
            {initials || "?"}
          </Text>
        </View>

        <Text className="mb-0.5 text-[13px] text-[#757575] dark:text-[#b0b0b0]">
          {t.welcomeBackLower}
        </Text>
        <Text className="text-center text-[26px] font-extrabold text-[#212121] dark:text-white">
          {displayName}
        </Text>
        <Text className="mt-1.5 text-[13px] text-[#9e9e9e]">
          {t.enterPinToContinue}
        </Text>

        <PinDots value={pin} hasError={!!error} />

        {!!error && (
          <View className="mb-4 flex-row items-center gap-1.5 rounded-[10px] bg-[#b71c1c]/15 px-3.5 py-2 dark:bg-[#ef5350]/15">
            <Ionicons name="alert-circle" size={15} color="#b71c1c" />
            <Text className="text-[13px] text-[#b71c1c] dark:text-[#ef5350]">{error}</Text>
          </View>
        )}

        {loading ? (
          <View className="mt-6">
            <Text className="text-[13px] text-[#757575] dark:text-[#b0b0b0]">{t.verifying}</Text>
          </View>
        ) : (
          <>
            <NumPad onPress={handlePress} onDelete={handleDelete} />

            <TouchableOpacity
              onPress={() => router.replace({ pathname: "/(auth)/landing", params: { reset: "true" } })}
              className="mt-8 px-4 py-2"
              activeOpacity={0.7}
            >
              <Text className="text-[13px] font-semibold text-[#2e7d32] dark:text-[#66bb6a]">
                {t.forgotResetPin}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
