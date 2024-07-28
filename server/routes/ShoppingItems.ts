import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { hc } from "hono/client";
import { nanoid } from "nanoid";
import { z } from "zod";

import { AddShoppingItemSchema } from "../lib/ShoppingItem";
import { SHOPPING_ITEMS } from "../mocks/shoppingItems";

const shoppingItems = new Hono();

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
  })
  .post("/", zValidator("json", AddShoppingItemSchema), (c) => {
    const item = c.req.valid("json");
    const itemWithId = { ...item, id: nanoid() };

    SHOPPING_ITEMS.set(itemWithId.id, itemWithId);

    return c.json(itemWithId);
  });

export type ShoppingItemsRoute = typeof shoppingItemsRoute;
