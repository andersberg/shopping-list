import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { GroceryInputParser } from "../GroceryInputParser/Parser";
import { GROCERY_ITEM_KNOWN_UNITS, GROCERY_ITEM_MODIFIERS } from "../constants";
import {
	grocery_list,
	grocery_list_item,
	grocery_list_item_relations,
	grocery_list_relations,
} from "../db/schema";
const grocery_item_input_schema = z.string().nonempty();
export type GroceryItemInput = z.infer<typeof grocery_item_input_schema>;

const grocery_list_item_add_body_schema = z.object({
	input: grocery_item_input_schema,
});

const parser = new GroceryInputParser(
	GROCERY_ITEM_KNOWN_UNITS,
	GROCERY_ITEM_MODIFIERS,
);

interface Bindings {
	Database: D1Database;
}

export const grocery_list_router = new Hono<{ Bindings: Bindings }>()
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
				items: true,
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
	// .get("/", async (c) => {
	// 	const db = drizzle(c.env.Database, {
	// 		schema: {
	// 			grocery_list,
	// 			grocery_list_item,
	// 			grocery_list_item_relations,
	// 			grocery_list_relations,
	// 		},
	// 	});

	// 	const list = await db.query.grocery_list.findFirst({
	// 		where: (table, { eq }) => eq(table.id, "test-id-1"),
	// 		with: {
	// 			items: true,
	// 		},
	// 	});

	// 	return c.json(list);
	// })
	.post("/add", zValidator("json", grocery_list_item_add_body_schema), (c) => {
		const data = c.req.valid("json");

		const parsed_item = parser.parse(data.input);

		const item = parsed_item;

		console.log("/add", item);

		return c.json(item);
	});

export type GroceryListRouter = typeof grocery_list_router;
