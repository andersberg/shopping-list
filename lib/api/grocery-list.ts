import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { GroceryInputParser } from "../GroceryInputParser/Parser";
import {
	GROCERY_ITEM_KNOWN_UNITS,
	GROCERY_ITEM_MODIFIERS,
} from "../GroceryInputParser/constants";
import { grocery_list_db } from "./db";

const grocery_item_input_schema = z.string().nonempty();
export type GroceryItemInput = z.infer<typeof grocery_item_input_schema>;

const grocery_list_item_add_body_schema = z.object({
	input: grocery_item_input_schema,
});

const parser = new GroceryInputParser(
	GROCERY_ITEM_KNOWN_UNITS,
	GROCERY_ITEM_MODIFIERS,
);

export const grocery_list_router = new Hono()
	.get("/", (c) => {
		return c.json(grocery_list_db.get_items());
	})
	.post("/add", zValidator("json", grocery_list_item_add_body_schema), (c) => {
		const data = c.req.valid("json");

		const parsed_item = parser.parse(data.input);

		const item = grocery_list_db.add_item(parsed_item);

		console.log("/add", item);

		return c.json(item);
	});
