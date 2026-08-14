import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use 127.0.0.1 (not localhost) to avoid Windows IPv6 ::1 / EACCES proxy failures
const apiTarget = process.env.VITE_API_PROXY || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
