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
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#2D6A4F", gap: 20 }}>
      <View style={{
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
      }}>
        <Text style={{ fontSize: 52 }}>🍃</Text>
      </View>
      <Text style={{ fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: 0.5 }}>
        Tea Factory
      </Text>
      <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: -10 }}>
        Supplier Management Portal
      </Text>
      <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" style={{ marginTop: 20 }} />
    </View>
  );
}
