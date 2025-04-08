import { z } from "zod";

const grocery_item_quantity = z.number().min(1);

const grocery_item_discount_price_schema = z.object({
	quantity: grocery_item_quantity,
	price: z.number().min(0),
	currency: z.string().nonempty(),
});

export const grocery_item_schema = z.object({
	quantity: grocery_item_quantity,
	unit: z.string().optional(),
	item: z.string().nonempty(),
	comment: z.string().optional(),
	discount_price: grocery_item_discount_price_schema.optional(),
});

export type GroceryItem = z.infer<typeof grocery_item_schema>;
