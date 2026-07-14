import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function PinSetupScreen() {
  const { t } = useTheme();
  const { setupPin, login, registrations } = useApp();
  const router = useRouter();

  const [step, setStep] = useState("enter");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePress = (key) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    setError("");
    if (next.length === PIN_LENGTH) {
      setTimeout(() => advance(next), 120);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const advance = async (entered) => {
    if (step === "enter") {
      setFirstPin(entered);
      setPin("");
      setStep("confirm");
    } else {
      if (entered !== firstPin) {
        Vibration.vibrate(300);
        setError(t.pinsMismatchRetry);
        setPin("");
        setStep("enter");
        setFirstPin("");
        return;
      }
      setLoading(true);
      try {
        await setupPin(entered);

        if (registrations.length > 1) {
          router.replace("/(auth)/select-account");
        } else if (registrations.length === 1) {
          await login(registrations[0]);
          router.replace("/(app)/home");
        } else {
          router.replace("/(app)/home");
        }
      } catch (err) {
        Vibration.vibrate(300);
        setError(err.message || t.savePinFailedRetry);
        setPin("");
        setStep("enter");
        setFirstPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <View className="flex-1 items-center px-6 pt-[60px]">
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-[#2e7d32]/15 dark:bg-[#66bb6a]/15">
          <Ionicons name="keypad-outline" size={38} color="#2e7d32" />
        </View>

        <Text className="text-center text-[26px] font-extrabold text-[#212121] dark:text-white">
          {step === "enter" ? t.createYourPin : t.confirmYourPin}
        </Text>
        <Text className="mt-2 text-center text-[13px] leading-5 text-[#757575] dark:text-[#b0b0b0]">
          {step === "enter"
            ? t.setupPinSubtitle
            : t.reenterPinSubtitle}
        </Text>

        <PinDots value={pin} hasError={!!error} />

        {!!error && (
          <View className="mb-4 flex-row items-center gap-1.5 rounded-[10px] bg-[#b71c1c]/15 px-3.5 py-2 dark:bg-[#ef5350]/15">
            <Ionicons name="alert-circle" size={15} color="#b71c1c" />
            <Text className="text-[13px] text-[#b71c1c] dark:text-[#ef5350]">{error}</Text>
          </View>
        )}

        <View className="mb-7 flex-row gap-1.5">
          {["enter", "confirm"].map((s) => (
            <View
              key={s}
              className={`h-2 rounded-full ${step === s ? "w-5 bg-[#2e7d32] dark:bg-[#66bb6a]" : "w-2 bg-[#e0e0e0] dark:bg-[#333333]"}`}
            />
          ))}
        </View>

        {loading ? (
          <Text className="text-[13px] text-[#757575] dark:text-[#b0b0b0]">{t.savingPin}</Text>
        ) : (
          <NumPad onPress={handlePress} onDelete={handleDelete} />
        )}
      </View>
    </SafeAreaView>
  );
}
