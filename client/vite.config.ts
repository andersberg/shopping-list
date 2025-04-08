import { readFile } from "node:fs/promises";
import { resolve } from "node:path/posix";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const server_workspace = resolve("../server");
const wrangler_config_path = resolve(server_workspace, "wrangler.json");

const wrangler_config = await readFile(wrangler_config_path, "utf-8").then(
	(data) => JSON.parse(data),
);

const server_port = wrangler_config.dev.port ?? 8787;
const server_host = wrangler_config.dev.host ?? "localhost";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		emptyOutDir: true,
		outDir: "../server/public",
	},
	server: {
		port: 5181,
		proxy: {
			"/api": {
				target: `http://${server_host}:${server_port}`,
				changeOrigin: true,
			},
		},
	},
});
