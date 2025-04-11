import { z } from "zod";
import { quantity_schema } from "./schema";

const grocery_item_discount_price_schema = z.object({
	quantity: quantity_schema,
	price: z.number().min(0),
	currency: z.string().nonempty().max(3),
});

export const grocery_item_schema = z.object({
	comment: z.string().optional(),
	discount_price: grocery_item_discount_price_schema.optional(),
	item: z.string().nonempty(),
	quantity: quantity_schema,
	unit: z.string().optional(),
});

export type GroceryItem = z.infer<typeof grocery_item_schema>;

export const grocery_list_item_schema = grocery_item_schema.extend({
	id: z.string().uuid(),
	added_at: z.date(),
	updated_at: z.date(),
	checked: z.boolean().default(false),
});

export type GroceryListItem = z.infer<typeof grocery_list_item_schema>;

export const grocery_list_schema = z.object({
	id: z.string().uuid(),
	items: z.array(grocery_list_item_schema),
});

export type GroceryList = z.infer<typeof grocery_list_schema>;

export function sort_grocery_list_items(items: GroceryListItem[]) {
	return items.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
}
