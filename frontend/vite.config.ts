import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { defineConfig } from "vite";

const BACKEND_PORT = import.meta.env.BACKEND_PORT ?? 5000;
const FRONTEND_PORT = import.meta.env.FRONTEND_PORT ?? 3000;

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: Number(FRONTEND_PORT),
    // proxy: {
    //   "/api": {
    //     target: `http://localhost:${BACKEND_PORT}`,
    //     changeOrigin: true,
    //   },
    // },
  },
  define: {
    "Bun.env.BACKEND_PORT": BACKEND_PORT,
  },
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dir, "./src"),
      "@server": resolve(import.meta.dir, "../server"),
    },
  },
});
