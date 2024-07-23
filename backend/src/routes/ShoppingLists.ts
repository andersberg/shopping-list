import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { hc } from "hono/client";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  ShoppingListSchema,
  ShoppingListWithoutIdSchema,
} from "../lib/ShoppingList";
import { SHOPPING_LISTS } from "../mocks/shoppinglists";

const shoppingLists = new Hono();

export const shoppingListsClient = hc<ShoppingListsRoute>(
  `http://localhost:${Bun.env.BACKEND_PORT}/lists`
);

export const shoppingListsRoute = shoppingLists
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string().nanoid() })),
    (c) => {
      const { id } = c.req.valid("param");
      const item = SHOPPING_LISTS.get(id);

      if (!item) {
        return c.notFound();
      }

      return c.json(item);
    }
  )
  .get("/", (c) => {
    return c.json(Array.from(SHOPPING_LISTS.values()));
  })
  .post("/", zValidator("json", ShoppingListWithoutIdSchema), (c) => {
    const item = c.req.valid("json");
    const itemWithId = { ...item, id: nanoid() };

    SHOPPING_LISTS.set(itemWithId.id, itemWithId);

    return c.json(itemWithId);
  })
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.string().nanoid() })),
    zValidator("json", ShoppingListSchema),
    (c) => {
      const { id } = c.req.valid("param");

      if (!SHOPPING_LISTS.has(id)) {
        return c.notFound();
      }

      const item = c.req.valid("json");

      if (id !== item.id) {
        return c.json({ error: "id must match" }, 400);
      }

      SHOPPING_LISTS.set(id, item);

      return c.json(item);
    }
  )
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string().nanoid() })),
    (c) => {
      const { id } = c.req.valid("param");

      if (!SHOPPING_LISTS.has(id)) {
        return c.notFound();
      }

      SHOPPING_LISTS.delete(id);

      return c.text("success", 204);
    }
  );

export type ShoppingListsRoute = typeof shoppingListsRoute;
