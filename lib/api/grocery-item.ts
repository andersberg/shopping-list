import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { GroceryInputParser } from "../GroceryInputParser/Parser";
import {
	GROCERY_ITEM_KNOWN_UNITS,
	GROCERY_ITEM_MODIFIERS,
} from "../GroceryInputParser/constants";

const grocery_item_input_schema = z.string().nonempty();
export type GroceryItemInput = z.infer<typeof grocery_item_input_schema>;

const grocery_item_parse_body_schema = z.object({
	input: grocery_item_input_schema,
});

const parser = new GroceryInputParser(
	GROCERY_ITEM_KNOWN_UNITS,
	GROCERY_ITEM_MODIFIERS,
);

export const grocery_item_router = new Hono().post(
	"/parse",
	zValidator("json", grocery_item_parse_body_schema),
	(c) => {
		const item = c.req.valid("json");

		const parsed_item = parser.parse(item.input);

		return c.json(parsed_item);
	},
);
