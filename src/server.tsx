import { Hono } from "hono";
import { App } from "./client/App";
import { renderer } from "./renderer";

const app = new Hono();

app.use(renderer);

app.get("/public/*", async (ctx) => {
  return await ctx.env.ASSETS.fetch(ctx.req.raw);
});

app.get("/", (c) => {
  return c.render();
});

export default app;
