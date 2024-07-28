import { z } from "zod";
import { app } from "./app";

const ServeEnv = z.object({
  BACKEND_PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("3000")
    .transform(Number),
});

const ProcessEnv = ServeEnv.parse(process.env);

const server = Bun.serve({
  port: ProcessEnv.BACKEND_PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
});

console.log("server running", server.port);
