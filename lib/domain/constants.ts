/**
 * Container units for packaged goods.
 * These are dynamic vocabularies that will be validated against the DB at runtime.
 */
export const CONTAINER_UNITS = [
  "fpk",
  "förpackning",
  "pkt",
  "paket",
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
] as const;

export type ContainerUnit = (typeof CONTAINER_UNITS)[number];

/**
 * Standard size/weight/volume units for grocery items.
 * These are static enums used for business logic (conversion, aggregation).
 */
export const SIZE_UNITS = [
  "mg",
  "g",
  "hg",
  "kg",
  "ml",
  "cl",
  "dl",
  "l",
  "st",
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
 * Property names that qualify grocery items.
 * Examples: ekologisk (organic), färsk (fresh), etc.
 * These are dynamic vocabularies that will be validated against the DB at runtime.
 */
export const PROPERTY_NAMES = [
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

export type PropertyName = (typeof PROPERTY_NAMES)[number];

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
 * Supported currency codes for pricing.
 * Currently supports Swedish krona with room for future expansion.
 */
export const CURRENCIES = ["kr", "sek"] as const;

export type Currency = (typeof CURRENCIES)[number];

/**
 * Parse status for grocery items.
 */
export const PARSE_STATUS = ["success", "partial", "error"] as const;

/**
 * Parse source for grocery items.
 */
export const PARSE_SOURCE = ["manual", "ai"] as const;
