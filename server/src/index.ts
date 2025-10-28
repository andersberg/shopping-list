import type { CloudflareEnvironmentBindings } from "lib/cloudflare-environment-bindings";
import { Hono } from "hono";
import { api_router } from "lib/api";

const app = new Hono<{ Bindings: CloudflareEnvironmentBindings }>();

app.route("/api", api_router);

app.get("*", (c) => {
  return c.notFound();
});

export default app;
