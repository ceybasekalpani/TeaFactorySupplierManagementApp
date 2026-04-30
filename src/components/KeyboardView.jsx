import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Drop-in replacement for KeyboardAvoidingView that works correctly on Android
 * with edgeToEdgeEnabled: true.
 *
 * Problem: In edge-to-edge mode the Keyboard event's reported height includes
 * the bottom navigation-bar inset, causing KAV to over-subtract on Android.
 * Fix: offset by useSafeAreaInsets().bottom so only the true keyboard height
 * is subtracted from the container.
 */
export default function KeyboardView({ children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? insets.bottom : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
