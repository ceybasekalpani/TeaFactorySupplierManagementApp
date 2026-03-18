import { fontSizes, getScaledFontSizes, themes } from "../constants/themes.js";
import { translations } from "../constants/translations.js";
import { useApp } from "../context/AppContext.js";

export function useTheme() {
  const { theme, language, fontSize } = useApp();
  const colors = themes[theme] || themes.light;
  const fs = typeof fontSize === "number"
    ? getScaledFontSizes(fontSize)
    : (fontSizes[fontSize] || fontSizes.medium);
  const t = translations[language] || translations.english;
  return { colors, fs, t, isDark: theme === "dark" };
}