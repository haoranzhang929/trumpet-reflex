import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1D1D1F",
        paper: "#F5F5F7",
        brass: "#007AFF",
        reed: "#34C759"
      }
    }
  },
  plugins: []
} satisfies Config;
