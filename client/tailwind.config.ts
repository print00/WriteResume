import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        panel: "#121a2b",
        line: "#27324a",
        accent: "#62c4ff",
        success: "#31c48d",
        warn: "#f4c95d",
        danger: "#f97066",
        navy: "#1a1a2e",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(98, 196, 255, 0.15), 0 22px 60px rgba(5, 10, 20, 0.35)",
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
