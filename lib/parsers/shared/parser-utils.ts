import { BRAND_NAMES } from "../../constants";
import type { GroceryItem } from "../../domain/grocery-item";

// Item dictionary for canonical mapping (copied from token-mapper)
export const ITEM_DICTIONARY: Record<
	string,
	{ canonical: string; category: string }
> = {
	mjölk: { canonical: "mjölk", category: "mejeri" },
	grädde: { canonical: "grädde", category: "mejeri" },
	smör: { canonical: "smör", category: "mejeri" },
	ägg: { canonical: "ägg", category: "mejeri" },
	yoghurt: { canonical: "yoghurt", category: "mejeri" },
	fil: { canonical: "fil", category: "mejeri" },
	tomat: { canonical: "tomat", category: "frukt & grönt" },
	tomater: { canonical: "tomat", category: "frukt & grönt" },
	gurka: { canonical: "gurka", category: "frukt & grönt" },
	banan: { canonical: "banan", category: "frukt & grönt" },
	äpple: { canonical: "äpple", category: "frukt & grönt" },
	äpplen: { canonical: "äpple", category: "frukt & grönt" },
	potatis: { canonical: "potatis", category: "frukt & grönt" },
	lök: { canonical: "lök", category: "frukt & grönt" },
	morot: { canonical: "morot", category: "frukt & grönt" },
	morötter: { canonical: "morot", category: "frukt & grönt" },
	pasta: { canonical: "pasta", category: "skafferi" },
	spaghetti: { canonical: "spaghetti", category: "skafferi" },
	spagetti: { canonical: "spaghetti", category: "skafferi" },
	ris: { canonical: "ris", category: "skafferi" },
	olja: { canonical: "olja", category: "skafferi" },
	olivolja: { canonical: "olivolja", category: "skafferi" },
	"krossade tomater": { canonical: "krossade tomater", category: "skafferi" },
	kikärtor: { canonical: "kikärtor", category: "skafferi" },
	bönor: { canonical: "bönor", category: "skafferi" },
	jäst: { canonical: "jäst", category: "skafferi" },
	tonfisk: { canonical: "tonfisk", category: "fisk & skaldjur" },
	lax: { canonical: "lax", category: "fisk & skaldjur" },
	sill: { canonical: "sill", category: "fisk & skaldjur" },
	ärtor: { canonical: "ärtor", category: "fryst" },
	glass: { canonical: "glass", category: "fryst" },
	blöjor: { canonical: "blöjor", category: "hygien" },
};

// Unit normalization (copied from token-mapper)
export const UNIT_NORMALIZATION: Record<string, string> = {
	paket: "pkt",
	förp: "fp",
	förpackning: "fp",
	burk: "burk",
	flaska: "flaska",
	st: "st",
	stycken: "st",
	kg: "kg",
	g: "g",
	l: "l",
	dl: "dl",
	cl: "cl",
	ml: "ml",
};

// Store names for extraction (copied from constants)
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
];

// Organic tags for detection
export const ORGANIC_TAGS = [
	"eko",
	"ekologisk",
	"ekologiska",
	"organic",
	"krav",
];

// === Normalization Functions ===

export function normalize_string(s: string | null): string | null {
	if (!s) return null;
	return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export function normalize_decimal(s: string | null): number {
	if (!s) return 0;
	const normalized = s.replace(",", ".");
	const parsed = parseFloat(normalized);
	return Number.isNaN(parsed) ? 0 : parsed;
}

export function normalize_unit(s: string | null): string | null {
	if (!s) return null;
	const normalized = normalize_string(s);
	if (!normalized) return null;
	return UNIT_NORMALIZATION[normalized] || normalized;
}

// === Item Processing Functions ===

export function canonicalize_item(item: string | null): {
	canonical: string | null;
	category: string | null;
} {
	if (!item) return { canonical: null, category: null };

	const normalized = normalize_string(item);
	if (!normalized) return { canonical: null, category: null };

	// Direct match
	if (ITEM_DICTIONARY[normalized]) {
		return {
			canonical: ITEM_DICTIONARY[normalized].canonical,
			category: ITEM_DICTIONARY[normalized].category,
		};
	}

	// Try singularization for common patterns
	let singular = normalized;
	if (normalized.endsWith("er") && normalized.length > 2) {
		singular = normalized.slice(0, -2);
	} else if (normalized.endsWith("ar") && normalized.length > 2) {
		singular = normalized.slice(0, -2);
	} else if (normalized.endsWith("or") && normalized.length > 2) {
		singular = normalized.slice(0, -2);
	}

	if (ITEM_DICTIONARY[singular]) {
		return {
			canonical: ITEM_DICTIONARY[singular].canonical,
			category: ITEM_DICTIONARY[singular].category,
		};
	}

	return { canonical: normalized, category: null };
}

export function map_item_to_category(item: string | null): string | null {
	if (!item) return null;

	const normalized = normalize_string(item);
	if (!normalized) return null;

	// Direct match
	if (ITEM_DICTIONARY[normalized]) {
		return ITEM_DICTIONARY[normalized].category;
	}

	// Try singularization
	let singular = normalized;
	if (normalized.endsWith("er") && normalized.length > 2) {
		singular = normalized.slice(0, -2);
	} else if (normalized.endsWith("ar") && normalized.length > 2) {
		singular = normalized.slice(0, -2);
	} else if (normalized.endsWith("or") && normalized.length > 2) {
		singular = normalized.slice(0, -2);
	}

	if (ITEM_DICTIONARY[singular]) {
		return ITEM_DICTIONARY[singular].category;
	}

	return null;
}

// === Store Extraction ===

export function extract_store_from_text(text: string): {
	store_normalized: string | null;
	store_raw: string | null;
} {
	const normalized = normalize_string(text);
	if (!normalized) return { store_normalized: null, store_raw: null };

	// Check for store names in text
	for (const store of STORE_NAMES) {
		const store_lower = store.toLowerCase();
		if (normalized.includes(store_lower)) {
			return {
				store_normalized: store_lower,
				store_raw: store_lower, // Could be enhanced to extract exact substring
			};
		}
	}

	return { store_normalized: null, store_raw: null };
}

// === Brand Processing ===

export function normalize_brand(brand: string | null): string | null {
	if (!brand) return null;

	const normalized = normalize_string(brand);
	if (!normalized) return null;

	// Check against known brands
	if (
		BRAND_NAMES.some(
			(knownBrand) => normalize_string(knownBrand) === normalized,
		)
	) {
		// Use the original casing from BRAND_NAMES
		return (
			BRAND_NAMES.find(
				(knownBrand) => normalize_string(knownBrand) === normalized,
			) || null
		);
	}

	// Unknown brand - return null (will be moved to comment)
	return null;
}

// === Offer Processing ===

export function parse_offer(offer: string | null): {
	offer_quantity: number;
	offer_total_price_value: number;
	offer_currency: string | null;
	offer_unit_price_value: number;
} {
	if (!offer) {
		return {
			offer_quantity: 0,
			offer_total_price_value: 0,
			offer_currency: null,
			offer_unit_price_value: 0,
		};
	}

	// Patterns like "4/50kr", "3 för 20kr", "4/299 kr"
	const slash_match = offer.match(/(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*kr?/i);
	if (slash_match) {
		const quantity = parseInt(slash_match[1], 10);
		const price = parseFloat(slash_match[2].replace(",", "."));
		return {
			offer_quantity: quantity,
			offer_total_price_value: price,
			offer_currency: "SEK",
			offer_unit_price_value: price / quantity,
		};
	}

	const for_match = offer.match(/(\d+)\s*för\s*(\d+(?:\.\d+)?)\s*kr?/i);
	if (for_match) {
		const quantity = parseInt(for_match[1], 10);
		const price = parseFloat(for_match[2].replace(",", "."));
		return {
			offer_quantity: quantity,
			offer_total_price_value: price,
			offer_currency: "SEK",
			offer_unit_price_value: price / quantity,
		};
	}

	return {
		offer_quantity: 0,
		offer_total_price_value: 0,
		offer_currency: null,
		offer_unit_price_value: 0,
	};
}

// === Organic Detection ===

export function extract_organic(modifiers: string[]): boolean {
	return modifiers.some((mod) => ORGANIC_TAGS.includes(mod.toLowerCase()));
}

// === Default Quantity Logic ===

export function apply_default_quantity(
	item: string | null,
	quantity: number,
	quantity_unit: string | null,
	size_value: number,
): { quantity: number; quantity_unit: string | null } {
	// Default logic: If item found but no quantity/size, default to 1 st
	if (item && quantity === 0 && size_value === 0) {
		return { quantity: 1, quantity_unit: "st" };
	}

	return { quantity, quantity_unit };
}

// === Status Determination ===

export function determine_status(
	item: string | null,
	category: string | null,
	has_errors: boolean,
): "ok" | "needs_review" | "parse_error" {
	if (has_errors) {
		return "parse_error";
	}

	if (!item) {
		return "parse_error";
	}

	if (!category) {
		return "needs_review";
	}

	return "ok";
}

// === Error Creation ===

export function create_error_grocery_item(
	error: string,
	input: string,
): GroceryItem {
	return {
		// Database fields
		name: null,
		comment: input,
		discount_price: null,
		quantity: 0,
		unit: null,

		// API fields
		item: null,
		category: null,
		quantity_unit: null,
		size_value: 0,
		size_unit: null,
		brand: null,
		organic: false,
		unit_normalized: null,
		total_quantity_value: 0,
		total_quantity_unit: null,
		store_normalized: null,
		store_raw: null,
		offer_quantity: 0,
		offer_total_price_value: 0,
		offer_currency: null,
		offer_unit_price_value: 0,
		status: "parse_error",
		error,
		source: "ai",
	};
}
