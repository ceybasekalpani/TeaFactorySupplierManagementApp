// Remove globalColors completely and use themes instead

export const themes = {
  light: {
    bg: "#f5f1ea",        // Warm cream background (like tea color)
    card: "#FFFFFF",
    cardBorder: "#E0E0E0",
    surface: "#F5F5F5",
    primary: "#2E7D32",    // Dark green - tea leaf color
    primaryLight: "#4CAF50",
    primaryDark: "#1B5E20",
    accent: "#795548",     // Brown - tea color
    text: "#212121",
    textSecondary: "#757575",
    textMuted: "#9E9E9E",
    border: "#E0E0E0",
    success: "#388E3C",
    warning: "#FFA000",
    error: "#B71C1C",
    info: "#0288D1",
    white: "#FFFFFF",
    inputBg: "#F5F5F5",
    statusBar: "dark-content",
    tabBar: "#FFFFFF",
    shadow: "#3a2a1a15",
    disabled: "#BDBDBD",
    placeholder: "#9E9E9E",
    backdrop: "rgba(0,0,0,0.5)",
    notification: "#F57C00",
    secondary: "#FF8F00", // Amber - for accents
  },
  dark: {
    bg: "#121212",        // True dark background
    card: "#242424",
    cardBorder: "#333333",
    surface: "#1E1E1E",
    primary: "#66BB6A",    // Lighter green for dark mode
    primaryLight: "#81C784",
    primaryDark: "#388E3C",
    accent: "#8D6E63",     // Light brown
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    textMuted: "#9E9E9E",
    border: "#333333",
    success: "#4CAF50",
    warning: "#FFB74D",
    error: "#EF5350",
    info: "#4FC3F7",
    white: "#f5f5f5",
    inputBg: "#252525",
    statusBar: "light-content",
    tabBar: "#242424",
    shadow: "#00000080",
    disabled: "#757575",
    placeholder: "#9E9E9E",
    backdrop: "rgba(0,0,0,0.8)",
    notification: "#FFA726",
    secondary: "#FFB74D", // Amber for dark mode
  },
};

export const fontSizes = {
  small: {
    xs: 10,
    sm: 12,
    base: 13,
    md: 15,
    lg: 17,
    xl: 20,
    "2xl": 23,
    "3xl": 27,
  },
  medium: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    "2xl": 26,
    "3xl": 32,
  },
  large: {
    xs: 13,
    sm: 15,
    base: 17,
    md: 20,
    lg: 23,
    xl: 27,
    "2xl": 31,
    "3xl": 38,
  },
};

export const getThemeColors = (isDarkMode) => {
  return isDarkMode ? themes.dark : themes.light;
};