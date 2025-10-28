import {
  ALLOWED_CATEGORIES,
  OFFER_CURRENCIES,
  QUANTITY_UNIT_ALIASES_BY_CANONICAL,
  QUANTITY_UNIT_ALIAS_MAP,
  QUANTITY_UNITS,
  SIZE_UNIT_ALIASES_BY_CANONICAL,
  SIZE_UNIT_ALIAS_MAP,
  SIZE_UNITS,
  STORE_ALIASES_BY_CANONICAL,
  STORE_ALIAS_MAP,
  STORE_NORMALIZED_VALUES,
} from "../grocery-item";

export const ASSISTANT_PROMPT = create_assistant_prompt({
  allowed_categories: ALLOWED_CATEGORIES,
  quantity_units: QUANTITY_UNITS,
  quantity_unit_alias_map: QUANTITY_UNIT_ALIAS_MAP,
  quantity_unit_aliases_by_canonical: QUANTITY_UNIT_ALIASES_BY_CANONICAL,
  size_units: SIZE_UNITS,
  size_unit_alias_map: SIZE_UNIT_ALIAS_MAP,
  size_unit_aliases_by_canonical: SIZE_UNIT_ALIASES_BY_CANONICAL,
  store_normalized_values: STORE_NORMALIZED_VALUES,
  store_alias_map: STORE_ALIAS_MAP,
  store_aliases_by_canonical: STORE_ALIASES_BY_CANONICAL,
  offer_currencies: OFFER_CURRENCIES,
});

export function create_assistant_prompt({
  allowed_categories,
  quantity_units,
  quantity_unit_alias_map,
  quantity_unit_aliases_by_canonical,
  size_units,
  size_unit_alias_map,
  size_unit_aliases_by_canonical,
  store_normalized_values,
  store_alias_map,
  store_aliases_by_canonical,
  offer_currencies,
}: {
  allowed_categories: ReadonlyArray<string>;
  quantity_units: ReadonlyArray<string>;
  quantity_unit_alias_map: Readonly<Record<string, string>>;
  quantity_unit_aliases_by_canonical: Readonly<
    Record<string, ReadonlyArray<string>>
  >;
  size_units: ReadonlyArray<string>;
  size_unit_alias_map: Readonly<Record<string, string>>;
  size_unit_aliases_by_canonical: Readonly<
    Record<string, ReadonlyArray<string>>
  >;
  store_normalized_values: ReadonlyArray<string>;
  store_alias_map: Readonly<Record<string, string>>;
  store_aliases_by_canonical: Readonly<Record<string, ReadonlyArray<string>>>;
  offer_currencies: ReadonlyArray<string>;
}) {
  return `ASSISTANT (roll: assistant)
{
  "allowed_categories": ${JSON.stringify(allowed_categories)},
  "quantity_units": {
    "canonical": ${JSON.stringify(quantity_units)},
    "by_canonical": ${JSON.stringify(quantity_unit_aliases_by_canonical, null, 2)},
    "aliases": ${JSON.stringify(Object.keys(quantity_unit_alias_map))},
    "alias_map": ${JSON.stringify(quantity_unit_alias_map, null, 2)}
  },
  "size_units": {
    "canonical": ${JSON.stringify(size_units)},
    "by_canonical": ${JSON.stringify(size_unit_aliases_by_canonical, null, 2)},
    "aliases": ${JSON.stringify(Object.keys(size_unit_alias_map))},
    "alias_map": ${JSON.stringify(size_unit_alias_map, null, 2)}
  },
  "store_normalized": {
    "canonical": ${JSON.stringify(store_normalized_values)},
    "by_canonical": ${JSON.stringify(store_aliases_by_canonical, null, 2)},
    "alias_map": ${JSON.stringify(store_alias_map, null, 2)}
  },
  "offer_currencies": ${JSON.stringify(offer_currencies)}
}
` as const;
}
