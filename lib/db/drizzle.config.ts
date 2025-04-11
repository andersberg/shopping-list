import { defineConfig } from "drizzle-kit";
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const current_directory = dirname(fileURLToPath(import.meta.url));
const project_root = process.cwd();

export default defineConfig({
  dialect: "sqlite",
  schema: resolve(current_directory, "schema.ts"),
	out: relative(project_root, resolve(current_directory, "migrations")),
});
