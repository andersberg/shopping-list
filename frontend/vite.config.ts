import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { defineConfig } from "vite";

const FRONTEND_PORT = import.meta.env.FRONTEND_PORT ?? 5173;
const BACKEND_PORT = import.meta.env.BACKEND_PORT ?? 5173;

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: Number(FRONTEND_PORT),
  },
  define: {
    "Bun.env.BACKEND_PORT": BACKEND_PORT,
  },
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@backend": resolve(__dirname, "../backend/src"),
    },
  },
});
