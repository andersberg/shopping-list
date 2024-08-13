import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";

import {
  AddShoppingItemSchema,
  ShoppingItemSchema,
  type ShoppingItem,
} from "../lib/ShoppingItem";
import { MOCK_SHOPPING_ITEMS } from "../mocks/shoppingItems";

const shoppingItems = new Hono();

const ShoppingItemPathParamSchema = z.object({ id: z.string().uuid() });

const SHOPPING_ITEMS_STORE = new Map<string, ShoppingItem>(
  MOCK_SHOPPING_ITEMS.map((item) => [item.id, item])
);

export const shoppingItemsRoute = shoppingItems
  .get("/:id", zValidator("param", ShoppingItemPathParamSchema), (c) => {
    const { id } = c.req.valid("param");
    const item = SHOPPING_ITEMS_STORE.get(id);

    if (item === undefined) {
      return c.json({ error: "not found" }, 404);
    }

    return c.json(item, 200);
  })
  .get("/", (c) => {
    return c.json(Array.from(SHOPPING_ITEMS_STORE.values()));
  })
  .post("/", zValidator("json", AddShoppingItemSchema), (c) => {
    const item = c.req.valid("json");
    const itemWithId = { ...item, id: uuidv7() };

    SHOPPING_ITEMS_STORE.set(itemWithId.id, itemWithId);

    return c.json(itemWithId);
  })
  .put(
    "/:id",
    zValidator("param", ShoppingItemPathParamSchema),
    zValidator("json", ShoppingItemSchema),
    (c) => {
      const { id } = c.req.valid("param");
      const item = c.req.valid("json");

      SHOPPING_ITEMS_STORE.set(id, item);

      return c.json(item);
    }
  )
  .delete("/:id", zValidator("param", ShoppingItemPathParamSchema), (c) => {
    const { id } = c.req.valid("param");
    const item = MOCK_SHOPPING_ITEMS.find((item) => item.id === id);

    if (item === undefined) {
      return c.json({ error: "not found" }, 404); // Specify 404
    }

    SHOPPING_ITEMS_STORE.delete(id);

    return c.json(item, 200);
  });

export type ShoppingItemsRoute = typeof shoppingItemsRoute;
