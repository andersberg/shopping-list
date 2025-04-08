import { Hono } from "hono";
import { api_router } from "lib/api";

const app = new Hono();

app.route("/api", api_router);

app.get("*", (c) => {
	return c.notFound();
});

export default app;
