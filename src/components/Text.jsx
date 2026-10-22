import { cssInterop } from "nativewind";
import Constants from "expo-constants";
import { Children, forwardRef } from "react";
import { Platform, Text as NativeText } from "react-native";

// SDK 54 did not apply React Native 0.86's default overflow: hidden style.
// Preserve that behavior so existing layouts do not clip text or Sinhala marks.
const legacyTextStyle = { overflow: "visible", flexShrink: 1 };

function getDisplayChildren(children) {
  // Expo Go owns its native TextView, so the app's Android theme fix cannot
  // reach it. Reserve trailing advance space for overhanging glyphs in labels.
  // Keep the stored/translated text, numeric values, and emoji icons unchanged.
  if (Platform.OS !== "android" || Number(Platform.Version) < 35 ||
      Constants.appOwnership !== "expo") {
    return children;
  }
  if (typeof children === "string" && /\p{L}/u.test(children) && !/\s$/.test(children)) {
    return `${children} `;
  }

  // JSX such as `{t.total}: {count}` is passed as an array of children.
  // Reserve the advance width on the final textual child as well; otherwise
  // Android 15 can clip the last character even though RN measured it.
  if (Array.isArray(children)) {
    const childArray = Children.toArray(children);
    for (let i = childArray.length - 1; i >= 0; i -= 1) {
      const child = childArray[i];
      if (typeof child === "string" && /\p{L}/u.test(child) && !/\s$/.test(child)) {
        childArray[i] = `${child} `;
        return childArray;
      }
    }
  }
  return children;
}

const CompatibleText = forwardRef(function CompatibleText({ children, style, ...props }, ref) {
  return <NativeText {...props} ref={ref} style={[legacyTextStyle, style]}>{getDisplayChildren(children)}</NativeText>;
});

// Resolve className before forwarding the style, keeping explicit styles and
// intentional truncation (numberOfLines/ellipsizeMode) under each screen's control.
export const Text = cssInterop(CompatibleText, { className: "style" });
