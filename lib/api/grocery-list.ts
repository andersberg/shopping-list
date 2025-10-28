import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { CloudflareEnvironmentBindings } from "../cloudflare-environment-bindings";
import { Hono } from "hono";
import { z } from "zod";
import {
  type GroceryListItemSelect,
  grocery_list,
  grocery_list_item,
  grocery_list_item_insert_schema,
  grocery_list_item_relations,
  grocery_list_relations,
} from "../db/schema";
import { mergeComments } from "./mergeComments";
import {
  grocery_list_item_add_body_schema,
  grocery_list_item_update_schema,
} from "./schema";
import { GroceryInputParser } from "../AI/GroceryInputParser/GroceryInputParser";

export const grocery_list_router = new Hono<{
  Bindings: CloudflareEnvironmentBindings;
}>()
  .get("/", async (c) => {
    const db = drizzle(c.env.Database, {
      schema: {
        grocery_list,
        grocery_list_item,
        grocery_list_item_relations,
        grocery_list_relations,
      },
    });
    const list = await db.query.grocery_list.findFirst({
      where: (table, { eq }) => eq(table.id, "test-id-1"),
      with: {
        items: {
          orderBy: (table, { desc }) => [desc(table.updated_at)],
        },
      },
    });
    if (!list) {
      return c.json(
        {
          message: "List not found",
        },
        404,
      );
    }
    return c.json(list, 200);
  })
  .get("/items", async (c) => {
    const db = drizzle(c.env.Database, {
      schema: {
        grocery_list,
        grocery_list_item,
        grocery_list_item_relations,
        grocery_list_relations,
      },
    });

    const items = await db.query.grocery_list_item.findMany({
      where: (table, { eq }) => eq(table.grocery_list_id, "test-id-1"),
    });

    return c.json(items);
  })
  .post(
    "/items/add",
    zValidator("json", grocery_list_item_add_body_schema),
    async (c) => {
      const db = drizzle(c.env.Database, {
        schema: {
          grocery_list,
          grocery_list_item,
          grocery_list_item_relations,
          grocery_list_relations,
        },
      });

      const { item } = c.req.valid("json");

      const {
        success,
        data: validated_item,
        error,
      } = grocery_list_item_insert_schema.safeParse({
        ...item,
        grocery_list_id: "test-id-1",
      });

      if (!success) {
        return c.json(
          {
            message: "Invalid item",
            errors: error.format(),
          },
          400,
        );
      }

      // Check for existing item
      const [existing_item] = await db
        .select()
        .from(grocery_list_item)
        .where(
          and(
            eq(grocery_list_item.name, validated_item.name),
            eq(
              grocery_list_item.grocery_list_id,
              validated_item.grocery_list_id,
            ),
          ),
        );

      let result: GroceryListItemSelect;
      let status = "created";

      if (existing_item) {
        // Update existing item
        const [updated_item] = await db
          .update(grocery_list_item)
          .set({
            quantity: existing_item.quantity + validated_item.quantity,
            unit: validated_item.unit, // Use latest unit
            comment: mergeComments(
              existing_item.comment,
              validated_item.comment ?? null,
            ),
            discount_price: validated_item.discount_price, // Use latest discount price
          })
          .where(eq(grocery_list_item.id, existing_item.id))
          .returning();

        result = updated_item;
        status = "updated";
      } else {
        // Insert new item
        const [inserted_item] = await db
          .insert(grocery_list_item)
          .values(validated_item)
          .returning();

        result = inserted_item;
      }

      return c.json({
        item: result,
        status,
        message: `Item ${status} successfully`,
      });
    },
  )
  .patch(
    "/items/:id",
    zValidator("param", z.object({ id: z.string().uuid() })),
    zValidator("json", grocery_list_item_update_schema),
    async (c) => {
      const db = drizzle(c.env.Database, {
        schema: {
          grocery_list,
          grocery_list_item,
          grocery_list_item_relations,
          grocery_list_relations,
        },
      });

      const id = c.req.param("id");
      const updates = c.req.valid("json");

      // Check if item exists
      const [existing_item] = await db
        .select()
        .from(grocery_list_item)
        .where(eq(grocery_list_item.id, id));

      if (!existing_item) {
        return c.json({ message: "Item not found" }, 404);
      }

      // Handle comment merging if provided
      const update_data: Partial<typeof grocery_list_item.$inferSelect> = {
        ...updates,
        comment:
          updates.comment !== undefined
            ? mergeComments(existing_item.comment, updates.comment)
            : undefined,
      };

      const [updated_item] = await db
        .update(grocery_list_item)
        .set(update_data)
        .where(eq(grocery_list_item.id, id))
        .returning();

      return c.json({
        item: updated_item,
        message: "Item updated successfully",
      });
    },
  )
  .delete("/items/:id", async (c) => {
    const db = drizzle(c.env.Database, {
      schema: {
        grocery_list,
        grocery_list_item,
        grocery_list_item_relations,
        grocery_list_relations,
      },
    });

    const id = c.req.param("id");

    const [existing_item] = await db
      .select()
      .from(grocery_list_item)
      .where(eq(grocery_list_item.id, id));

    if (!existing_item) {
      return c.json({ message: "Item not found" }, 404);
    }

    await db.delete(grocery_list_item).where(eq(grocery_list_item.id, id));

    return c.json({ message: "Item deleted successfully" });
  })
  .post(
    "/parse",
    zValidator(
      "json",
      z.object({
        input: z.string().nonempty(),
      }),
    ),
    async (c) => {
      const { input } = await c.req.json();
      console.log("/parse", input);
      const ai = c.env.AI;

      const parser = new GroceryInputParser(ai);

      const parsed = await parser.parse_input(input);

      return c.json({ item: parsed });
    },
  );

export type GroceryListRouter = typeof grocery_list_router;
