/**
 * Shared constants used across the grocery list application.
 */

export const MESSAGE = String("🛒");

/**
 * Known quantity/container unit names used in Swedish grocery contexts.
 * Includes both full and abbreviated forms.
 */
export const QUANTITY_UNITS = [
  "fpk",
  "förpackning",
  "pkt",
  "paket",
  "kg",
  "kilo",
  "g",
  "gram",
  "l",
  "liter",
  "dl",
  "deciliter",
  "ml",
  "milliliter",
  "st",
  "stycken",
  "burkar",
  "rulle",
  "dussin",
  "burk",
  "limpa",
  "flaska",
  "ask",
  "kartong",
  "påse",
  "bit",
  "bitar",
  "tub",
  "knippe",
  "bundt",
  "klase",
  "hg",
] as const;

export type QuantityUnit = (typeof QUANTITY_UNITS)[number];

/**
 * Standard size/weight/volume units for grocery items.
 */
export const SIZE_UNITS = [
  "g",
  "kg",
  "hg",
  "mg",
  "ml",
  "l",
  "dl",
  "cl",
  "st",
  "cm",
  "m",
] as const;

export type SizeUnit = (typeof SIZE_UNITS)[number];

/**
 * Standard grocery category names for organizing items.
 */
export const CATEGORY_NAMES = [
  "mejeri",
  "frukt & grönt",
  "kött & fisk",
  "skafferi",
  "bröd & kakor",
  "dryck",
  "fryst",
  "godis & snacks",
  "hushåll",
  "hygien",
  "övrigt",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

/**
 * Descriptive modifiers that qualify grocery items.
 * Examples: ekologisk (organic), färsk (fresh), etc.
 */
export const MODIFIERS = [
  "ekologisk",
  "ekologiska",
  "eko",
  "ej zero",
  "extra",
  "extra virgin",
  "hemgjord",
  "färska",
  "saltade",
  "grönt",
  "krossade",
  "färsk",
] as const;

export type Modifier = (typeof MODIFIERS)[number];

/**
 * Known grocery brand names for normalization.
 * Used to ensure consistent casing when brands are detected.
 */
export const BRAND_NAMES = [
  "Arla",
  "Barilla",
  "Eldorado",
  "Felix",
  "Findus",
  "Garant",
  "ICA",
  "Kelda",
  "Kellogg's",
  "Keyhole",
  "Knorr",
  "Kungsörnen",
  "Lantmännen",
  "Oatly",
  "Pågen",
  "Risifrutti",
  "Santa Maria",
  "Scan",
  "Valio",
  "Zeta",
] as const;

export type BrandName = (typeof BRAND_NAMES)[number];

/**
 * Common store/supermarket names in Sweden.
 */
export const STORE_NAMES = [
  "ICA",
  "Coop",
  "Willys",
  "Axfood",
  "Lidl",
  "Netto",
  "Hemköp",
  "PriceSmart",
  "Kvantum",
  "Bodega",
  "Mathem",
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

export const CURRENCY_SEK = "kr";

/**
 * Backward compatibility aliases for renamed constants.
 * These maintain compatibility with existing code that uses the old names.
 */
export const GROCERY_ITEM_KNOWN_UNITS = QUANTITY_UNITS;
export const GROCERY_ITEM_MODIFIERS = MODIFIERS;
