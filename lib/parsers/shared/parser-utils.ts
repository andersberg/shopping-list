import {
	BRAND_NAMES,
	PARSE_STATUS,
	PARSE_SOURCE,
} from "../../domain/constants";
import type { GroceryItem } from "../../domain/grocery-item";
import {
	canonicalize_item as domainCanonicalize,
	map_item_to_category as domainMapCategory,
	normalize_unit as domainNormalizeUnit,
	normalize_brand as domainNormalizeBrand,
	parse_offer as domainParseOffer,
	extract_store_from_text as domainExtractStore,
	extract_organic as domainExtractOrganic,
	apply_default_quantity as domainApplyDefaultQuantity,
	determine_parse_status as domainDetermineStatus,
} from "../../domain/grocery-item-services";
import { create_container_unit } from "../../domain/value-objects";
import { match_brand } from "../../domain/fuzzy-matching-service";

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

// === Domain Service Wrappers ===

export function canonicalize_item(item: string | null): {
	canonical: string | null;
	category: string | null;
} {
	const result = domainCanonicalize(item);
	if (result.status === "success" && result.data) {
		return {
			canonical: result.data.canonical,
			category: result.data.category,
		};
	}
	return { canonical: null, category: null };
}

export function map_item_to_category(item: string | null): string | null {
	const result = domainMapCategory(item);
	return result.status === "success" ? result.data : null;
}

export function normalize_unit(s: string | null): string | null {
	const result = domainNormalizeUnit(s);
	return result.status === "success" ? result.data : null;
}

export function normalize_brand(brand: string | null): string | null {
	if (!brand) return null;

	const result = match_brand(brand);
	// Use fuzzy matching with confidence threshold
	if (result.confidence >= 0.85) {
		return result.match;
	}
	return null;
}

export function extract_store_from_text(text: string): {
	store_normalized: string | null;
	store_raw: string | null;
} {
	const result = domainExtractStore(text);
	if (result.status === "success" && result.data) {
		return result.data;
	}
	return { store_normalized: null, store_raw: null };
}

export function parse_offer(offer: string | null): {
	offer_quantity: number;
	offer_total_price_value: number;
	offer_currency: string | null;
	offer_unit_price_value: number;
} {
	const result = domainParseOffer(offer);
	if (result.status === "success" && result.data) {
		const { quantity, price, currency } = result.data;
		return {
			offer_quantity: quantity,
			offer_total_price_value: price,
			offer_currency: currency === "kr" ? "SEK" : null,
			offer_unit_price_value: price > 0 ? price / quantity : 0,
		};
	}
	return {
		offer_quantity: 0,
		offer_total_price_value: 0,
		offer_currency: null,
		offer_unit_price_value: 0,
	};
}

export function extract_organic(modifiers: string[]): boolean {
	return domainExtractOrganic(modifiers);
}

export function apply_default_quantity(
	canonical_item: string | null,
	quantity: number,
	quantity_unit: string | null,
	size_value: number,
): {
	quantity: number;
	quantity_unit: string | null;
} {
	const result = domainApplyDefaultQuantity(
		canonical_item,
		quantity,
		quantity_unit,
		size_value,
	);
	if (result.status === "success" && result.data) {
		return result.data;
	}
	return { quantity: 1, quantity_unit: "st" as string | null };
}

export function determine_status(
	canonical_item: string | null,
	category: string | null,
	has_unparsed: boolean,
): "ok" | "needs_review" | "parse_error" {
	const result = domainDetermineStatus(canonical_item, category, has_unparsed);
	switch (result) {
		case "success":
			return "ok";
		case "partial":
			return "needs_review";
		case "error":
			return "parse_error";
		default:
			return "parse_error";
	}
}

// === Error Creation ===

export function create_error_grocery_item(
	error: string,
	input: string,
): GroceryItem {
	return {
		// Metadata
		original_input: input,
		parse_status: "error",
		parse_error: error,
		parse_source: "ai",

		// Core Product Data
		item: "",
		item_canonical: null,
		category: null,
		brand: null,

		// Purchase Intent
		purchase_quantity: 1,
		purchase_unit: create_container_unit("st") as ContainerUnit,

		// Item Specification
		item_size: 1,
		item_unit: "st",

		// Additional Details
		properties: [],
		stores: [],
		comment: input,
		offer: null,
	};
}
