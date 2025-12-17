import {
	SIZE_UNITS,
	CONTAINER_UNITS,
	PROPERTY_NAMES,
} from "./domain/constants";

/**
 * Shared constants used across grocery list application.
 */
export const MESSAGE = String("🛒");

/**
 * All known units for grocery items (size + container units)
 */
export const GROCERY_ITEM_KNOWN_UNITS = [...SIZE_UNITS, ...CONTAINER_UNITS];

/**
 * Modifiers/properties for grocery items (organic, fresh, etc.)
 */
export const GROCERY_ITEM_MODIFIERS = [...PROPERTY_NAMES];
