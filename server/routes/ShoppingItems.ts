import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { hc } from "hono/client";
import { nanoid } from "nanoid";
import { z } from "zod";

import { AddShoppingItemSchema, ShoppingItemSchema } from "../lib/ShoppingItem";
import { SHOPPING_ITEMS } from "../mocks/shoppingItems";

const shoppingItems = new Hono();

const ShoppingItemPathParamSchema = z.object({ id: z.string().nanoid() });
export const shoppingItemsRoute = shoppingItems
  .get("/:id", zValidator("param", ShoppingItemPathParamSchema), (c) => {
    const { id } = c.req.valid("param");
    const item = SHOPPING_ITEMS.get(id);

    if (item === undefined) {
      return c.json({ error: "not found" }, 404);
    }

    return c.json(item, 200);
  })
  .get("/", (c) => {
    return c.json(Array.from(SHOPPING_ITEMS.values()));
  })
  .post("/", zValidator("json", AddShoppingItemSchema), (c) => {
    const item = c.req.valid("json");
    const itemWithId = { ...item, id: nanoid() };

    SHOPPING_ITEMS.set(itemWithId.id, itemWithId);

    return c.json(itemWithId);
  })
  .put(
    "/:id",
    zValidator("param", ShoppingItemPathParamSchema),
    zValidator("json", ShoppingItemSchema),
    (c) => {
      const { id } = c.req.valid("param");
      const item = c.req.valid("json");

      SHOPPING_ITEMS.set(id, item);

      return c.json(item);
    }
  )
  .delete("/:id", zValidator("param", ShoppingItemPathParamSchema), (c) => {
    const { id } = c.req.valid("param");
    const item = SHOPPING_ITEMS.get(id);

    if (item === undefined) {
      return c.json({ error: "not found" }, 404); // Specify 404
    }

    SHOPPING_ITEMS.delete(id);

    return c.json(item, 200);
  });

export type ShoppingItemsRoute = typeof shoppingItemsRoute;
