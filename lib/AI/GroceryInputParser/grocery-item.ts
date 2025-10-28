import z from "zod/v4";

export const QUANTITY_UNITS = [
  "st",
  "pkt",
  "burk",
  "flaska",
  "påse",
  "förp",
  "kartong",
  "rulle",
] as const;

export const QUANTITY_UNIT_ALIASES_BY_CANONICAL = {
  st: ["st", "st.", "styck", "stycken", "x"],
  pkt: ["pkt", "pack"],
  burk: ["burk", "burkar"],
  flaska: ["flaska", "flaskor"],
  påse: ["påse", "påsar"],
  förp: ["förp", "förpackning", "förpackningar"],
  kartong: ["kartong", "kartonger"],
  rulle: ["rulle", "rullar"],
} as const satisfies Record<(typeof QUANTITY_UNITS)[number], readonly string[]>;

const quantityUnitAliasEntries = Object.entries(
  QUANTITY_UNIT_ALIASES_BY_CANONICAL,
).flatMap(([canonical, aliases]) =>
  aliases.map(
    (alias) => [alias, canonical] as [string, (typeof QUANTITY_UNITS)[number]],
  ),
);

export const QUANTITY_UNIT_ALIAS_MAP = Object.fromEntries(
  quantityUnitAliasEntries,
) as Record<string, (typeof QUANTITY_UNITS)[number]>;

export const QUANTITY_UNIT_ALIASES = Object.keys(
  QUANTITY_UNIT_ALIAS_MAP,
) as (keyof typeof QUANTITY_UNIT_ALIAS_MAP)[];

export const SIZE_UNITS = ["g", "kg", "ml", "cl", "dl", "l"] as const;

export const SIZE_UNIT_ALIASES_BY_CANONICAL = {
  g: ["g", "gram", "grams"],
  kg: ["kg", "kilo", "kilogram", "kilograms"],
  ml: ["ml", "milliliter", "milliliters"],
  cl: ["cl", "centiliter", "centiliters"],
  dl: ["dl", "deciliter", "deciliters"],
  l: ["l", "liter", "liters", "lit", "ltr"],
} as const satisfies Record<(typeof SIZE_UNITS)[number], readonly string[]>;

const sizeUnitAliasEntries = Object.entries(
  SIZE_UNIT_ALIASES_BY_CANONICAL,
).flatMap(([canonical, aliases]) =>
  aliases.map(
    (alias) => [alias, canonical] as [string, (typeof SIZE_UNITS)[number]],
  ),
);

export const SIZE_UNIT_ALIAS_MAP = Object.fromEntries(
  sizeUnitAliasEntries,
) as Record<string, (typeof SIZE_UNITS)[number]>;

export const SIZE_UNIT_ALIASES = Object.keys(
  SIZE_UNIT_ALIAS_MAP,
) as (keyof typeof SIZE_UNIT_ALIAS_MAP)[];

export const STATUS = ["ok", "unparsed"] as const;

export const ALLOWED_CATEGORIES = [
  "mejeri",
  "bröd",
  "frukt & grönt",
  "kött & fågel",
  "fisk & skaldjur",
  "skafferi",
  "dryck",
  "fryst",
  "mejeri-alternativ",
  "sött & snacks",
  "hushåll",
  "övrigt",
] as const;

export const STORE_NORMALIZED_VALUES = ["ica", "willys", "hemköp"] as const;

export const STORE_ALIASES_BY_CANONICAL = {
  ica: ["ica", "ica maxi", "ica kvantum", "ica supermarket"],
  willys: ["willys", "willys hemma"],
  hemköp: ["hemköp"],
} as const satisfies Record<
  (typeof STORE_NORMALIZED_VALUES)[number],
  readonly string[]
>;

const storeAliasEntries = Object.entries(STORE_ALIASES_BY_CANONICAL).flatMap(
  ([canonical, aliases]) =>
    aliases.map(
      (alias) =>
        [alias, canonical] as [
          string,
          (typeof STORE_NORMALIZED_VALUES)[number],
        ],
    ),
);

export const STORE_ALIAS_MAP = Object.fromEntries(storeAliasEntries) as Record<
  string,
  (typeof STORE_NORMALIZED_VALUES)[number]
>;

export const STORE_ALIASES = Object.keys(
  STORE_ALIAS_MAP,
) as (keyof typeof STORE_ALIAS_MAP)[];

export const OFFER_CURRENCIES = ["SEK"] as const;

export const GroceryItemSchema = z.strictObject({
  item: z.string().nullable(),
  category: z.enum(ALLOWED_CATEGORIES).nullable(),
  quantity: z.number().min(0),
  quantity_unit: z.enum(QUANTITY_UNITS).nullable(),
  size_value: z.number().min(0),
  size_unit: z.enum(SIZE_UNITS).nullable(),
  brand: z.string().nullable(),
  organic: z.boolean(),
  comment: z.string().nullable(),
  unit_normalized: z.enum(SIZE_UNITS).nullable(),
  total_quantity_value: z.number().min(0),
  total_quantity_unit: z.enum(SIZE_UNITS).nullable(),
  store_normalized: z.enum(STORE_NORMALIZED_VALUES).nullable(),
  store_raw: z.string().nullable(),
  offer_quantity: z.number().min(0),
  offer_total_price_value: z.number().min(0),
  offer_currency: z.enum(OFFER_CURRENCIES).nullable(),
  offer_unit_price_value: z.number().min(0),
  status: z.enum(STATUS),
  error: z.string().nullable(),
});
