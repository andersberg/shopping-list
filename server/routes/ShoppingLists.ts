import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { SHOPPING_LISTS } from "../mocks/shoppinglists";

export const shoppingListsRoute = new Hono()
  .get("/:id", zValidator("param", z.object({ id: z.string() })), (c) => {
    const { id } = c.req.valid("param");
    const item = SHOPPING_LISTS.get(id);

    if (item === undefined) {
      return c.json({ error: "not found" }, 404); // Specify 404
    }

    return c.json({ item }, 200);
  })
  .get("/", (c) => {
    return c.json(Array.from(SHOPPING_LISTS.values()));
  });
