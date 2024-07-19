import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import { ShoppingItem } from "./lib/ShoppingItem";

const app = new Hono();

const SHOPPING_LIST_ITEM_INITIAL_ID = nanoid();
const SHOPPING_LIST_ITEMS = new Map<ShoppingItem["id"], ShoppingItem>([
  [
    SHOPPING_LIST_ITEM_INITIAL_ID,
    {
      id: SHOPPING_LIST_ITEM_INITIAL_ID,
      value: "ost",
      displayName: "Ost",
      unit: "kg",
      quantity: 1,
      comment: "ej prästost",
    },
  ],
]);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get(
  "/shopping-list/items/:id",
  zValidator("param", z.object({ id: z.string().nanoid() })),
  (c) => {
    const { id } = c.req.valid("param");
    const item = SHOPPING_LIST_ITEMS.get(id);

    if (!item) {
      return c.notFound();
    }

    return c.json(item);
  }
);

app.get("/shopping-list/items", (c) => {
  return c.json(Array.from(SHOPPING_LIST_ITEMS.keys()));
});

export default {
  port: Number(process.env.BACKEND_PORT),
  fetch: app.fetch,
};
