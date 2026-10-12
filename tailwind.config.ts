import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D14",
        primary: "#7668E8",
        secondary: "#7DD3DC",
        accent: "#F7DFA6",
        success: "#10B981",
        warning: "#F59E0B",
        text: "#F0F2FF",
        muted: "#9AA3C7",
        card: "#151522"
      },
      boxShadow: {
        soft: "0 24px 70px rgba(0, 0, 0, 0.32)",
        glow: "0 18px 45px rgba(118, 104, 232, 0.30)"
      },
      fontFamily: {
        sans: ["var(--font-ui)", "var(--font-noto-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
