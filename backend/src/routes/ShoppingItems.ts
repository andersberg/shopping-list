import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { hc } from "hono/client";
import { z } from "zod";
import { SHOPPING_ITEMS } from "../mocks/shoppingItems";

const shoppingItems = new Hono();

export const shoppingItemsClient = hc<ShoppingItemsRoute>(
  `http://localhost:${Bun.env.BACKEND_PORT}/items`
);

export const shoppingItemsRoute = shoppingItems
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string().nanoid() })),
    (c) => {
      const { id } = c.req.valid("param");
      const item = SHOPPING_ITEMS.get(id);

      if (!item) {
        return c.notFound();
      }

      return c.json(item);
    }
  )
  .get("/", (c) => {
    return c.json(Array.from(SHOPPING_ITEMS.values()));
  });

export type ShoppingItemsRoute = typeof shoppingItemsRoute;
