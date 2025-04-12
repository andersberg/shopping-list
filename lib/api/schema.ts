import { z } from "zod";
import { GROCERY_ITEM_KNOWN_UNITS } from "../constants";

const grocery_item_input_schema = z.string().nonempty();
export type GroceryItemInput = z.infer<typeof grocery_item_input_schema>;

export const grocery_list_item_add_body_schema = z.object({
	input: grocery_item_input_schema,
});

// Schema for the update endpoint
export const grocery_list_item_update_schema = z.object({
	quantity: z.number().min(1).optional(),
	unit: z.enum(GROCERY_ITEM_KNOWN_UNITS).optional(),
	comment: z.string().optional(),
	checked: z.boolean().optional(),
	discount_price: z
		.object({
			quantity: z.number(),
			price: z.number(),
			currency: z.string(),
		})
		.optional()
		.nullable(),
});

export type GroceryListItemUpdate = z.infer<
	typeof grocery_list_item_update_schema
>;
