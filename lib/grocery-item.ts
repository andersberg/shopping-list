import { z } from "zod";
import {
	CATEGORY_NAMES,
	CONTAINER_UNITS,
	SIZE_UNITS,
	STORE_NAMES,
	BRAND_NAMES,
	PROPERTY_NAMES,
} from "./constants";
import { grocery_list_item_insert_schema } from "./db/schema";

// --- Branded Types (DB-driven, validated at runtime) ---
export const ContainerUnit = z.string().brand<"ContainerUnit">();
export type ContainerUnit = z.infer<typeof ContainerUnit>;

export const Store = z.string().brand<"Store">();
export type Store = z.infer<typeof Store>;

export const Brand = z.string().brand<"Brand">();
export type Brand = z.infer<typeof Brand>;

export const Property = z.string().brand<"Property">();
export type Property = z.infer<typeof Property>;

export const ItemCanonical = z.string().brand<"ItemCanonical">();
export type ItemCanonical = z.infer<typeof ItemCanonical>;

export const Category = z.string().brand<"Category">();
export type Category = z.infer<typeof Category>;

// --- Schemas ---

const grocery_item_discount_price_schema = z.object({
	quantity: z.number().min(1),
	price: z.number().min(0),
	currency: z.string().nonempty().max(3),
});

export type GroceryItemDiscountPrice = z.infer<
	typeof grocery_item_discount_price_schema
>;

// NOTE: Legacy schemas are kept for now to avoid breaking other parts of the codebase.
// These should be removed or updated in a future task.
export const grocery_item_schema = z.object({
	name: z.string().nullable(),
	comment: z.string().nullable(),
	discount_price: grocery_item_discount_price_schema.nullable(),
	quantity: z.number().min(0),
	unit: z.string().nullable(),
});

export type GroceryItemLegacy = z.infer<typeof grocery_item_schema>;

// --- Main GROCERY_ITEM Schema ---
const PARSE_STATUS = ["success", "partial", "error"] as const;
const PARSE_SOURCE = ["manual", "ai"] as const;

export const grocery_item_full_schema = z.strictObject({
	// Metadata
	original_input: z.string(),
	parse_status: z.enum(PARSE_STATUS),
	parse_error: z.string().nullable(),
	parse_source: z.enum(PARSE_SOURCE),

	// Core Product Data
	item: z.string(),
	item_canonical: ItemCanonical.nullable(),
	category: Category.nullable(),
	brand: Brand.nullable(),

	// 1. Purchase Intent (How many containers?)
	purchase_quantity: z.number().min(1).default(1),
	purchase_unit: ContainerUnit.default("st" as any),

	// 2. Item Specification (Size of one container)
	item_size: z.number().min(0).default(1),
	item_unit: z.enum(SIZE_UNITS).default("st"),

	// Additional Details
	properties: z.array(Property).default([]),
	stores: z.array(Store).default([]),
	comment: z.string().nullable(),
	offer: grocery_item_discount_price_schema.nullable(),
});

export type GroceryItem = z.infer<typeof grocery_item_full_schema>;

export const grocery_list_item_schema = grocery_item_schema.extend({
	id: z.string().uuid(),
	items: z.array(grocery_list_item_schema),
});

export type GroceryList = z.infer<typeof grocery_list_item_schema>;

export function sort_grocery_list_items(items: GroceryListItem[]) {
	return items.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
}
