import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { shoppingItemsRoute } from "./routes/ShoppingItemsRoute";
import { shoppingListsRoute } from "./routes/ShoppingListsRoute";

const FRONTEND_PORT = Bun.env.FRONTEND_PORT;

const app = new Hono();

app.use(logger());

app.use(
  cors({
    origin: [`http://localhost:${FRONTEND_PORT}`],
  })
);

const apiRoutes = app
  .route("/lists", shoppingListsRoute)
  .route("/items", shoppingItemsRoute);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export type ApiRoutes = typeof apiRoutes;
export { app };
