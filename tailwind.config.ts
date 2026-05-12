import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1d1d1f",
        paper: "#f5f5f7",
        brass: "#0071e3",
        reed: "#248a3d"
      }
    }
  },
  plugins: []
} satisfies Config;
