import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070b12",
        panel: "#111827",
        line: "#2b3547",
        accent: "#14b8a6",
        accentSoft: "#8bd8cf",
        gold: "#f59e0b",
        success: "#34d399",
        warn: "#fbbf24",
        danger: "#fb7185",
        navy: "#111827",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(20, 184, 166, 0.2), 0 22px 70px rgba(0, 0, 0, 0.38)",
        lift: "0 18px 50px rgba(0, 0, 0, 0.28)",
      },
      keyframes: {
        "fade-slide": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-slide": "fade-slide 280ms ease-out",
      },
    },
  },
  plugins: [forms],
};

export default config;
