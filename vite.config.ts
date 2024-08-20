import build from "@hono/vite-cloudflare-pages";
import devServer from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/cloudflare";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

// const BACKEND_PORT = import.meta.env.BACKEND_PORT ?? 5000;
// const FRONTEND_PORT = import.meta.env.FRONTEND_PORT ?? 3000;

export default defineConfig({
  // server: {
  //   port: Number(FRONTEND_PORT),
  //   // proxy: {
  //   //   "/api": {
  //   //     target: `http://localhost:${BACKEND_PORT}`,
  //   //     changeOrigin: true,
  //   //   },
  //   // },
  // },
  // define: {
  //   "Bun.env.BACKEND_PORT": BACKEND_PORT,
  // },
  plugins: [
    // TanStackRouterVite(),
    build(),
    devServer({
      adapter,
      entry: "src/server.tsx",
    }),
  ],
});
