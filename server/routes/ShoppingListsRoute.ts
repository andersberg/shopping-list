import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { type ShoppingItem } from "../lib/ShoppingItem";
import {
  AddShoppingListItemSchema,
  type ShoppingList,
} from "../lib/ShoppingList";
import { MOCK_SHOPPING_LISTS } from "../mocks/shoppinglists";

const ShoppingListPathParamSchema = z.object({ listId: z.string().uuid() });

const SHOPPING_LIST_STORE = new Map<
  string,
  Omit<ShoppingList, "items"> & { items: Map<string, ShoppingItem> }
>(
  MOCK_SHOPPING_LISTS.map((list) => [
    list.id,
    {
      ...list,
      items: new Map<string, ShoppingItem>(
        list.items.map((item) => [item.id, item])
      ),
    },
  ])
);

export const shoppingListsRoute = new Hono()
  .get("/:listId", zValidator("param", ShoppingListPathParamSchema), (c) => {
    const { listId } = c.req.valid("param");
    const shoppingList = SHOPPING_LIST_STORE.get(listId);

    if (shoppingList === undefined) {
      return c.json({ error: "not found" }, 404); // Specify 404
    }

    return c.json(
      {
        shoppingList: {
          ...shoppingList,
          items: Array.from(shoppingList.items.values()),
        },
      },
      200
    );
  })
  .get("/", (c) => {
    return c.json(Array.from(SHOPPING_LIST_STORE.values()));
  })
  .post(
    "/:listId/item",
    zValidator("param", ShoppingListPathParamSchema),
    zValidator("json", AddShoppingListItemSchema),
    (c) => {
      const { listId } = c.req.valid("param");
      const item = c.req.valid("json");

      const list = SHOPPING_LIST_STORE.get(listId);

      if (list === undefined) {
        return c.json({ error: "not found" }, 404);
      }

      if ("id" in item) {
        list.items.set(item.id, item);
      } else {
        const itemWithId = { ...item, id: uuidv7() };
        list.items.set(itemWithId.id, itemWithId);
      }

      return c.json(item, 201);
    }
  )
  .delete(
    "/:listId/item/:itemId",
    zValidator(
      "param",
      ShoppingListPathParamSchema.extend({ itemId: z.string().uuid() })
    ),
    (c) => {
      const { listId, itemId } = c.req.valid("param");
      const list = SHOPPING_LIST_STORE.get(listId);

      if (list === undefined) {
        return c.json({ error: "not found" }, 404);
      }

      list.items.delete(itemId);

      return c.json({ deleted: itemId }, 200);
    }
  );
