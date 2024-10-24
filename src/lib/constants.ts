export const UNITS = [
	'bunt',
	'cl',
	'centiliter',
	'cm',
	'centimeter',
	'dl',
	'deciliter',
	'fpk',
	'förpackning',
	'g',
	'gram',
	'hg',
	'hekto',
	'kg',
	'kilo',
	'l',
	'liter',
	'm',
	'meter',
	'ml',
	'milliliter',
	'par',
	'st',
	'stycken'
] as const;

export type Units = typeof UNITS;

export const DEFAULT_UNIT = 'st' as const;
export const DEFAULT_QUANTITY = 1 as const;

// /(\d+)?\s?+([a-zA-Z]+)\s?+([a-zA-Z]+)?/i;
// /(\d+)\s+(\p{L}+)\s+(\p{L}+)/iu;

export const SHOPPING_ITEM_REGEX = /(\d+)?\s?([a-zA-Z\s]+)/i;
export const COLON_SPLIT_REGEX = /\s*:\s*/;
export const SPLIT_FIRST_WORD_REGEX = /^(\p{L}+)(?:\s+(.*))?$/u;
export const STARTS_WITH_NUMBER_REGEX = /^(\d+)\s+(.*)$/u;
