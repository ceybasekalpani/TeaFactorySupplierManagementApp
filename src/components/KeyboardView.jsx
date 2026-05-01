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
export default function KeyboardView({ children, style }) {
  if (Platform.OS === "android") {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
