const { AndroidConfig, withAndroidStyles } = require("expo/config-plugins");

const TEXT_STYLE = "TeaFactoryTextView";

function setAndroidTextMetrics(xml) {
  const appTheme = AndroidConfig.Styles.getAppThemeGroup();
  const existing = AndroidConfig.Styles.getStylesItem({
    xml,
    parent: appTheme,
    name: "android:textViewStyle",
  });
  const currentStyle = existing?._;
  const installedStyle = AndroidConfig.Styles.getStyleParent(xml, { name: TEXT_STYLE });
  const parent = currentStyle && currentStyle !== `@style/${TEXT_STYLE}`
    ? currentStyle.replace(/^@style\//, "")
    : installedStyle?.$?.parent || "Widget.AppCompat.TextView";

  // On Android 15+, TextView's bounds-based breaking can disagree with the
  // advance-based layout React Native measures, hiding the final word/line.
  // Match the measured layout without replacing fonts or changing text sizes.
  xml = AndroidConfig.Styles.assignStylesValue(xml, {
    add: true,
    parent: { name: TEXT_STYLE, parent },
    name: "android:useBoundsForWidth",
    value: "false",
  });
  return AndroidConfig.Styles.assignStylesValue(xml, {
    add: true,
    parent: appTheme,
    name: "android:textViewStyle",
    value: `@style/${TEXT_STYLE}`,
  });
}

module.exports = function withAndroidTextMetrics(config) {
  return withAndroidStyles(config, (mod) => {
    mod.modResults = setAndroidTextMetrics(mod.modResults);
    return mod;
  });
};

module.exports.setAndroidTextMetrics = setAndroidTextMetrics;
