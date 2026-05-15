import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "icons/favicon.ico", "icons/apple-touch-icon-180x180.png"],
      manifest: {
        name: "Trumpet Reflex Trainer",
        short_name: "TrumpetTrainer",
        description: "B flat trumpet written-pitch notation, solfege, and fingering reflex trainer.",
        start_url: "/",
        display: "standalone",
        theme_color: "#11100E",
        background_color: "#11100E",
        icons: [
          { src: "/icons/pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "/icons/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" }
        ],
        shortcuts: [
          { name: "Start Mixed Drill", url: "/?mode=mixed" },
          { name: "Weak Notes", url: "/?view=weak-notes" },
          { name: "Common Accidentals", url: "/?preset=common-trumpet-accidentals" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
      }
    })
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts"
  }
});
