import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Прототип живёт в подпапке GitHub Pages рядом с сайтом
  base: "/intreatment-podbor/",
  plugins: [react()],
  server: { port: 5180, host: true },
});
