import { Hono } from "hono";
import { cors } from "hono/cors";
import { shoppingItemsRoute } from "./routes/ShoppingItems";

const app = new Hono();

const FRONTEND_PORT = Bun.env.FRONTEND_PORT;

app.use(
  cors({
    origin: [`http://localhost:${FRONTEND_PORT}`],
  })
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/items", shoppingItemsRoute);

export default {
  port: Number(process.env.BACKEND_PORT),
  fetch: app.fetch,
};