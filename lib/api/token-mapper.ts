import { z } from "zod";
import { BRAND_NAMES } from "../ai/grocery-input-parser/brand-names";
import {
	grocery_item_full_schema,
	type GroceryItem as UnifiedGroceryItem,
} from "../grocery-item";

export const grocery_ai_extraction_schema = z.object({
	raw_text: z.string(),
	raw_item: z.string().nullable(),
	raw_qty: z.string().nullable(),
	raw_unit: z.string().nullable(),
	raw_brand: z.string().nullable(),
	raw_modifiers: z.array(z.string()),
	raw_offer: z.string().nullable(),
	raw_size_value: z.string().nullable(),
	raw_size_unit: z.string().nullable(),
	raw_comment: z.string().nullable(),
});

export type GroceryAiExtraction = z.infer<typeof grocery_ai_extraction_schema>;

// Re-export the unified schema
export const grocery_item_schema = grocery_item_full_schema;
export type GroceryItem = UnifiedGroceryItem;

// Item dictionary for canonical mapping
const ITEM_DICTIONARY: Record<string, { canonical: string; category: string }> =
	{
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

// Unit normalization
const UNIT_NORMALIZATION: Record<string, string> = {
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

function normalize_string(s: string | null): string | null {
	if (!s) return null;
	return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function normalize_decimal(s: string | null): number {
	if (!s) return 0;
	const normalized = s.replace(",", ".");
	const parsed = parseFloat(normalized);
	return Number.isNaN(parsed) ? 0 : parsed;
}

function normalize_unit(s: string | null): string | null {
	if (!s) return null;
	const normalized = normalize_string(s);
	if (!normalized) return null;
	return UNIT_NORMALIZATION[normalized] || normalized;
}

function map_item_to_canonical(item: string | null): {
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

function parse_offer(offer: string | null): {
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

function extract_organic(modifiers: string[]): boolean {
	return modifiers.some((mod) =>
		["eko", "ekologisk", "ekologiska", "organic", "krav"].includes(
			mod.toLowerCase(),
		),
	);
}

export function map_tokens_to_grocery_item(
	tokens: GroceryAiExtraction,
): GroceryItem {
	try {
		// Normalize basic fields
		const raw_item = normalize_string(tokens.raw_item);
		const raw_brand = normalize_string(tokens.raw_brand);
		const raw_comment = normalize_string(tokens.raw_comment);

		// Map item to canonical form and category
		const { canonical, category } = map_item_to_canonical(raw_item);

		// Parse quantities
		const quantity = tokens.raw_qty ? parseInt(tokens.raw_qty, 10) || 0 : 0;
		const quantity_unit = normalize_unit(tokens.raw_unit);
		const size_value = normalize_decimal(tokens.raw_size_value);
		const size_unit = normalize_unit(tokens.raw_size_unit);

		// Normalize brand
		let brand = normalize_string(raw_brand);
		if (
			brand &&
			BRAND_NAMES.some((knownBrand) => normalize_string(knownBrand) === brand)
		) {
			// Use the original casing from BRAND_NAMES
			brand =
				BRAND_NAMES.find(
					(knownBrand) => normalize_string(knownBrand) === brand,
				) || null;
		} else if (brand) {
			// Unknown brand, move to comment
			brand = null;
		}

		// Extract organic flag
		const organic = extract_organic(tokens.raw_modifiers);

		// Parse offer
		const offer_data = parse_offer(tokens.raw_offer);

		// Ensure offer_currency is properly typed
		const offer_currency = offer_data.offer_currency === "SEK" ? "SEK" : null;

		// Calculate total quantity if both quantity and size exist
		let total_quantity_value = 0;
		let total_quantity_unit: string | null = null;
		if (quantity > 0 && size_value > 0) {
			total_quantity_value = quantity * size_value;
			total_quantity_unit = size_unit;
		} else if (size_value > 0) {
			total_quantity_value = size_value;
			total_quantity_unit = size_unit;
		}

		// Determine status
		let status: "ok" | "needs_review" | "parse_error" = "ok";
		if (!canonical || !category) {
			status = "needs_review";
		}

		return {
			// Database fields
			name: canonical,
			comment: raw_comment,
			discount_price: null,
			quantity,
			unit: quantity_unit,

			// API fields
			item: canonical,
			category: category as any, // Type assertion for enum
			quantity_unit: quantity_unit as any,
			size_value,
			size_unit: size_unit as any,
			brand,
			organic,
			unit_normalized: size_unit as any,
			total_quantity_value,
			total_quantity_unit: total_quantity_unit as any,
			store_normalized: null,
			store_raw: null,
			offer_quantity: offer_data.offer_quantity,
			offer_total_price_value: offer_data.offer_total_price_value,
			offer_currency: offer_currency,
			offer_unit_price_value: offer_data.offer_unit_price_value,
			status,
			error: null,
			source: "ai",
		};
	} catch (error) {
		return {
			// Database fields
			name: null,
			comment: tokens.raw_comment,
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
			error: error instanceof Error ? error.message : "Unknown error",
			source: "ai",
		};
	}
}
