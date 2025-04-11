import { z } from "zod";
import { grocery_list_item_insert_schema } from "./db/schema";

const grocery_item_discount_price_schema = z.object({
	quantity: z.number().min(1),
	price: z.number().min(0),
	currency: z.string().nonempty().max(3),
});

export type GroceryItemDiscountPrice = z.infer<
	typeof grocery_item_discount_price_schema
>;


export const grocery_item_schema = grocery_list_item_insert_schema.pick({
	name: true,
	comment: true,
	discount_price: true,
	quantity: true,
	unit: true,
})

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
