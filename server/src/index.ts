import { Hono } from "hono";
import { MESSAGE } from "lib/constants";

const app = new Hono();

app.get("/api", (c) => {
	console.log(MESSAGE);
	return c.text(MESSAGE);
});

export default app;
