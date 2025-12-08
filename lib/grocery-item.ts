import { z } from "zod";
import { grocery_list_item_insert_schema } from "./db/schema";
import { CATEGORY_NAMES } from "./ai/grocery-input-parser/category-names";
import { QUANTITY_UNITS } from "./ai/grocery-input-parser/quantity-units";
import { SIZE_UNITS } from "./ai/grocery-input-parser/size-units";
import { STORE_NAMES } from "./ai/grocery-input-parser/store-names";

const grocery_item_discount_price_schema = z.object({
	quantity: z.number().min(1),
	price: z.number().min(0),
	currency: z.string().nonempty().max(3),
});

export type GroceryItemDiscountPrice = z.infer<
	typeof grocery_item_discount_price_schema
>;

// Database schema (for legacy compatibility)
export const grocery_item_schema = grocery_list_item_insert_schema.pick({
	name: true,
	comment: true,
	discount_price: true,
	quantity: true,
	unit: true,
});

export type GroceryItemLegacy = z.infer<typeof grocery_item_schema>;

// Full API schema with all fields
const STATUS = ["ok", "needs_review", "parse_error"] as const;
const CURRENCY = ["SEK"] as const;

export const grocery_item_full_schema = z.strictObject({
  // Database fields (mapped from API fields)
  name: z.string().nullable(),
  comment: z.string().nullable(),
  discount_price: grocery_item_discount_price_schema.nullable(),
  quantity: z.number().min(0),
  unit: z.string().nullable(),
  
  // Additional API fields
  item: z.string().nullable(),
  category: z.enum(CATEGORY_NAMES).nullable(),
  quantity_unit: z.enum(QUANTITY_UNITS).nullable(),
  size_value: z.number().min(0),
  size_unit: z.enum(SIZE_UNITS).nullable(),
  brand: z.string().nullable(),
  organic: z.boolean(),
  unit_normalized: z.enum(SIZE_UNITS).nullable(),
  total_quantity_value: z.number().min(0),
  total_quantity_unit: z.enum(SIZE_UNITS).nullable(),
  store_normalized: z.enum(STORE_NAMES).nullable(),
  store_raw: z.string().nullable(),
  offer_quantity: z.number().min(0),
  offer_total_price_value: z.number().min(0),
  offer_currency: z.enum(CURRENCY).nullable(),
  offer_unit_price_value: z.number().min(0),
  status: z.enum(STATUS),
  error: z.string().nullable(),
});

export type GroceryItem = z.infer<typeof grocery_item_full_schema>;

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
