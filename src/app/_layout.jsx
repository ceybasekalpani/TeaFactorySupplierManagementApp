import { Stack } from "expo-router";
import { cssInterop } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import "../../global.css";
import { AppProvider } from "../context/AppContext";

cssInterop(SafeAreaView, { className: "style" });
cssInterop(Image, { className: "style" });

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </AppProvider>
  );
}
