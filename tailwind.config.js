/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app-example/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#f5f1ea",
          card: "#ffffff",
          surface: "#f5f5f5",
          border: "#e0e0e0",
          primary: "#2e7d32",
          text: "#212121",
          muted: "#757575",
          dark: {
            bg: "#121212",
            card: "#242424",
            surface: "#1e1e1e",
            border: "#333333",
            primary: "#66bb6a",
            text: "#ffffff",
            muted: "#b0b0b0",
          },
        },
      },
    },
  },
  plugins: [],
};
