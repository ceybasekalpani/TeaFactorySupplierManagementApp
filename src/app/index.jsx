import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useApp } from "../context/AppContext";

export default function Index() {
  const { authState } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (authState === "loading") return;
    if (authState === "authenticated") {
      router.replace("/(app)/home");
    } else if (authState === "pin-required") {
      router.replace("/(auth)/pin-login");
    } else {
      router.replace("/(auth)/landing");
    }
  }, [authState]);

  return (
    <View className="flex-1 items-center justify-center gap-5 bg-[#2D6A4F]">
      <View className="h-[100px] w-[100px] items-center justify-center rounded-full border-2 border-white/25 bg-white/15">
        <Text className="text-[52px]">{"\uD83C\uDF43"}</Text>
      </View>
      <Text className="text-[26px] font-black tracking-[0.5px] text-white">
        Tea Factory
      </Text>
      <Text className="-mt-2.5 text-[13px] text-white/65">
        Supplier Management Portal
      </Text>
      <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" className="mt-5" />
    </View>
  );
}
