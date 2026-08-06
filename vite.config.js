import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Относительные пути: работает и локально, и в подпапке GitHub Pages
  base: "./",
  plugins: [react()],
  server: { port: 5180, host: true },
});
