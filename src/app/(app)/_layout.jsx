import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, LogBox } from "react-native";
import { useApp } from "../../context/AppContext";

LogBox.ignoreLogs(["Unable to activate keep awake"]);

export default function AppLayout() {
  const { authState, lockSession } = useApp();
  const router = useRouter();
  const backgroundedAt = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      // Track when app goes to background or inactive (minimized)
      if (nextState === "background" || nextState === "inactive") {
        backgroundedAt.current = Date.now();
      }

      // App came back to foreground from ANY background/minimized state
      if (
        nextState === "active" &&
        (prevState === "background" || prevState === "inactive")
      ) {
        lockSession();
      }
    });

    return () => sub.remove();
  }, []);

  // Small delay gives the navigator time to be ready before redirecting
  useEffect(() => {
    if (authState === "pin-required") {
      const timer = setTimeout(() => {
        router.replace("/(auth)/pin-login");
      }, 100);
      return () => clearTimeout(timer);
    } else if (authState === "unauthenticated") {
      const timer = setTimeout(() => {
        router.replace("/(auth)/landing");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authState]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}