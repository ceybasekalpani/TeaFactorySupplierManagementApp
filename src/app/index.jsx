import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useApp } from "../context/AppContext";

export default function Index() {
  const { authState } = useApp();

  if (authState === "authenticated") {
    return <Redirect href="/(app)/home" />;
  }
  if (authState === "pin-required") {
    return <Redirect href="/(auth)/pin-login" />;
  }
  if (authState !== "loading") {
    return <Redirect href="/(auth)/landing" />;
  }

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
