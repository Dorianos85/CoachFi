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
        background: "#F8FAFF",
        primary: "#7668E8",
        secondary: "#7DD3DC",
        accent: "#F7DFA6",
        success: "#A8E6CF",
        warning: "#F6A66D",
        text: "#26324A",
        muted: "#66758F",
        card: "#FFFFFF"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(38, 50, 74, 0.10)",
        glow: "0 18px 45px rgba(118, 104, 232, 0.18)"
      },
      fontFamily: {
        sans: ["var(--font-ui)", "var(--font-noto-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
