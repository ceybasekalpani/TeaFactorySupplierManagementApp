import { KeyboardAvoidingView, Platform, View } from "react-native";

/**
 * Keyboard-aware wrapper used by every screen that has text inputs.
 *
 * Android  – app.json sets softwareKeyboardLayoutMode="resize" so the OS
 *            shrinks the window when the keyboard opens.  A plain View is
 *            all that is needed; KeyboardAvoidingView actually fights the
 *            system resize and makes things worse, so we skip it.
 *
 * iOS      – The OS does not resize the window, so we use KeyboardAvoidingView
 *            with behavior="padding" to push content above the keyboard.
 */
export default function KeyboardView({ children, className = "" }) {
  if (Platform.OS === "android") {
    return <View className={`flex-1 ${className}`}>{children}</View>;
  }

  return (
    <KeyboardAvoidingView
      className={`flex-1 ${className}`}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
