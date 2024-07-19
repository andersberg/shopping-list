import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { defineConfig } from "vite";

const PORT = import.meta.env.FRONTEND_PORT ?? 5173;

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: Number(PORT),
  },
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
