import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // Listen on all interfaces for LAN access
    port: 3001, // Changed from 3000 to avoid conflict with backend
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_BASE_URL ||
          `http://${process.env.HOST || "localhost"}:3000`,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target:
          process.env.VITE_SOCKET_URL ||
          `http://${process.env.HOST || "localhost"}:3000`,
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },
  },
});
