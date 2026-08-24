import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          custom: "#CCFF00",
          hover: "#B8E600",
          tint: "#F4FEE6",
        },
        surface: {
          canvas: "#F7F7F8",
          pure: "#FFFFFF",
          dark: "#0A0A0A",
          cardDark: "#141416",
          cardBorder: "#26262B",
        },
        status: {
          rejected: "#EF4444",
          rejectedBg: "#FEF2F2",
          approved: "#10B981",
          approvedBg: "#ECFDF5",
          pending: "#F59E0B",
          pendingBg: "#FFFBEB",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        handwritten: ["var(--font-caveat)", "cursive"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        neo: "4px 4px 0px #0A0A0A",
        "neo-sm": "2px 2px 0px #0A0A0A",
        "neo-lg": "8px 8px 0px #0A0A0A",
        "neo-xl": "12px 12px 0px #0A0A0A",
        "neo-lime": "4px 4px 0px #CCFF00",
        elevate: "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
        glow: "0 0 30px rgba(204, 255, 0, 0.35)",
      },
      animation: {
        "marquee-fast": "marquee 22s linear infinite",
        "marquee-slow": "marquee 38s linear infinite",
        "float-slow": "float 5s ease-in-out infinite",
        "scan-line": "scanline 3.2s linear infinite",
        "pulse-ring": "pulsering 2s ease-out infinite",
        "grow-bar": "growbar 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-up": "fadeup 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "dash-flow": "dashflow 1.2s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        scanline: {
          "0%": { transform: "translateX(0%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        pulsering: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        growbar: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        fadeup: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        dashflow: {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
