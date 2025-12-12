import { z } from "zod";
import { PARSE_SOURCE, PARSE_STATUS, SIZE_UNITS, SizeUnit } from "./constants";
import { offer_schema } from "./types";
import {
	brand_schema,
	category_schema,
	container_unit_schema,
	create_container_unit,
	item_canonical_schema,
	Property,
	property_schema,
	Store,
	store_schema,
} from "./value-objects";

const DEFAULT_CONTAINER_UNIT = create_container_unit("st");
const DEFAULT_SIZE_UNIT = "st" as const satisfies SizeUnit;
const DEFAULT_STORES = [] as const satisfies Store[];
const DEFAULT_PROPERTIES = [] as const satisfies Property[];

// --- Main GROCERY_ITEM Schema ---

export const grocery_item_schema = z.strictObject({
	// Metadata
	original_input: z.string(),
	parse_status: z.enum(PARSE_STATUS),
	parse_error: z.string().nullable(),
	parse_source: z.enum(PARSE_SOURCE),

	// Core Product Data
	item: z.string(),
	item_canonical: item_canonical_schema.nullable(),
	category: category_schema.nullable(),
	brand: brand_schema.nullable(),

	// 1. Purchase Intent (How many containers?)
	purchase_quantity: z.number().min(1).default(1),
	purchase_unit: container_unit_schema.default(DEFAULT_CONTAINER_UNIT),

	// 2. Item Specification (Size of one container)
	item_size: z.number().min(0).default(1),
	item_unit: z.enum(SIZE_UNITS).default(DEFAULT_SIZE_UNIT),

	// Additional Details
	properties: z.array(property_schema).default(DEFAULT_PROPERTIES),
	stores: z.array(store_schema).default(DEFAULT_STORES),
	comment: z.string().nullable(),
	offer: offer_schema.nullable(),
});

export type GroceryItem = z.infer<typeof grocery_item_schema>;

// Legacy schema for backward compatibility during migration
export const grocery_item_legacy_schema = z.object({
	name: z.string().nullable(),
	comment: z.string().nullable(),
	discount_price: offer_schema.nullable(),
	quantity: z.number().min(0),
	unit: z.string().nullable(),
});

export type GroceryItemLegacy = z.infer<typeof grocery_item_legacy_schema>;
