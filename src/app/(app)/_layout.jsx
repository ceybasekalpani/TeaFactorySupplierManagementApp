import { Stack } from "expo-router";
import { LogBox } from "react-native";

// This hides the warning from showing up in your app
LogBox.ignoreLogs(["Unable to activate keep awake"]);

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}