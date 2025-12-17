/**
 * Domain Services for Grocery Item Processing
 *
 * This file contains pure business logic functions for processing grocery items.
 * All functions are side-effect free and return DomainResult objects for
 * consistent error handling and status reporting.
 */

import { BRAND_NAMES, STORE_NAMES } from "./constants";
import { match_brand, DEFAULT_FUZZY_OPTIONS } from "./fuzzy-matching-service";

// === Domain Result Types ===

/**
 * Standard result type for domain service operations
 * @template T - The type of data being returned
 */
export interface DomainResult<T> {
	/** The operation result data */
	data: T | null;
	/** The status of the operation */
	status: "success" | "warning" | "error";
	/** Optional error or warning message */
	message?: string;
}

// === Helper Functions for Creating Results ===

/**
 * Creates a successful domain result
 * @template T - The type of data being returned
 * @param data - The successful result data
 * @returns A successful DomainResult
 */
function createSuccess<T>(data: T): DomainResult<T> {
	return { data, status: "success" };
}

/**
 * Creates a warning domain result
 * @template T - The type of data being returned
 * @param data - The result data (may be partial or estimated)
 * @param message - Warning message explaining the issue
 * @returns A warning DomainResult
 */
function createWarning<T>(data: T | null, message: string): DomainResult<T> {
	return { data, status: "warning", message };
}

/**
 * Creates an error domain result
 * @template T - The type of data being returned
 * @param message - Error message explaining the failure
 * @returns An error DomainResult
 */
function createError<T>(message: string): DomainResult<T> {
	return { data: null, status: "error", message };
}

// === Data Structures ===

/**
 * Item dictionary for canonical mapping
 * Maps item names to their canonical forms and categories
 */
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
		ärtpor: { canonical: "ärtpor", category: "fryst" },
		glass: { canonical: "glass", category: "fryst" },
		blöjor: { canonical: "blöjor", category: "hygien" },
	};

/**
 * Unit normalization mapping
 * Maps various unit spellings to standardized forms
 */
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

/**
 * Organic detection tags
 * Keywords that indicate an item is organic
 */
const ORGANIC_TAGS = ["eko", "ekologisk", "ekologiska", "organic", "krav"];

// === Text Normalization Services ===

/**
 * Normalizes text by converting to lowercase, trimming, and normalizing whitespace
 * @param input - The string to normalize
 * @returns DomainResult with normalized string or null
 */
export function normalize_string(
	input: string | null,
): DomainResult<string | null> {
	if (input === null) {
		return createSuccess(null);
	}

	const normalized = input.toLowerCase().trim().replace(/\s+/g, " ");
	return createSuccess(normalized);
}

/**
 * Normalizes decimal numbers, handling comma as decimal separator
 * @param input - The decimal string to normalize
 * @returns DomainResult with parsed number or 0 for invalid input
 */
export function normalize_decimal(input: string | null): DomainResult<number> {
	if (!input) {
		return createSuccess(0);
	}

	const normalized = input.replace(",", ".");
	const parsed = parseFloat(normalized);
	const result = Number.isNaN(parsed) ? 0 : parsed;

	return createSuccess(result);
}

// === Item Classification Services ===

/**
 * Applies Swedish singularization rules to item names
 * @param item - The item name to singularize
 * @returns The singularized item name
 */
function apply_singularization_rules(item: string): string {
	if (item.endsWith("er") && item.length > 2) {
		return item.slice(0, -2);
	} else if (item.endsWith("ar") && item.length > 2) {
		return item.slice(0, -2);
	} else if (item.endsWith("or") && item.length > 2) {
		return item.slice(0, -2);
	}
	return item;
}

/**
 * Canonicalizes item names and determines category
 * @param item - The raw item name to canonicalize
 * @returns DomainResult with canonical item and category
 */
export function canonicalize_item(item: string | null): DomainResult<{
	canonical: string | null;
	category: string | null;
}> {
	if (!item) {
		return createSuccess({ canonical: null, category: null });
	}

	const normalizedResult = normalize_string(item);
	if (normalizedResult.status !== "success" || !normalizedResult.data) {
		return createSuccess({ canonical: null, category: null });
	}

	const normalized = normalizedResult.data;

	// Direct match
	if (ITEM_DICTIONARY[normalized]) {
		return createSuccess({
			canonical: ITEM_DICTIONARY[normalized].canonical,
			category: ITEM_DICTIONARY[normalized].category,
		});
	}

	// Try singularization
	const singular = apply_singularization_rules(normalized);
	if (ITEM_DICTIONARY[singular]) {
		return createSuccess({
			canonical: ITEM_DICTIONARY[singular].canonical,
			category: ITEM_DICTIONARY[singular].category,
		});
	}

	// Unknown item - return as-is with warning
	return createWarning(
		{ canonical: normalized, category: null },
		`Unknown item: ${item}`,
	);
}

/**
 * Maps item name to its category
 * @param item - The item name to categorize
 * @returns DomainResult with category or null
 */
export function map_item_to_category(
	item: string | null,
): DomainResult<string | null> {
	if (!item) {
		return createSuccess(null);
	}

	const normalizedResult = normalize_string(item);
	if (normalizedResult.status !== "success" || !normalizedResult.data) {
		return createSuccess(null);
	}

	const normalized = normalizedResult.data;

	// Direct match
	if (ITEM_DICTIONARY[normalized]) {
		return createSuccess(ITEM_DICTIONARY[normalized].category);
	}

	// Try singularization
	const singular = apply_singularization_rules(normalized);
	if (ITEM_DICTIONARY[singular]) {
		return createSuccess(ITEM_DICTIONARY[singular].category);
	}

	// Unknown item category
	return createWarning(null, `Unknown category for: ${item}`);
}

// === Unit Management Services ===

/**
 * Normalizes unit names to standardized forms
 * @param unit - The unit name to normalize
 * @returns DomainResult with normalized unit or warning for unknown units
 */
export function normalize_unit(
	unit: string | null,
): DomainResult<string | null> {
	if (!unit) {
		return createSuccess(null);
	}

	const normalizedResult = normalize_string(unit);
	if (normalizedResult.status !== "success" || !normalizedResult.data) {
		return createSuccess(null);
	}

	const normalized = normalizedResult.data;
	const standardUnit = UNIT_NORMALIZATION[normalized];

	if (standardUnit) {
		return createSuccess(standardUnit);
	}

	// Return original unit with warning for unknown units
	return createWarning(normalized, `Unknown unit: ${unit}`);
}

// === Brand Processing Services ===

/**
 * Normalizes brand names against known brands using fuzzy matching
 * @param brand - The brand name to normalize
 * @returns DomainResult with normalized brand or null for unknown brands
 */
export function normalize_brand(
	brand: string | null,
): DomainResult<string | null> {
	if (!brand) {
		return createSuccess(null);
	}

	const result = match_brand(brand);

	if (
		result.match &&
		result.confidence >= DEFAULT_FUZZY_OPTIONS.brands.threshold
	) {
		return createSuccess(result.match);
	}

	// Unknown brand - return null (will be moved to comment)
	return createWarning(null, `Unknown brand: ${brand}`);
}

// === Offer Analysis Services ===

/**
 * Parses offer strings in various formats
 * @param offer - The offer string to parse
 * @returns DomainResult with structured offer data
 */
export function parse_offer(offer: string | null): DomainResult<{
	quantity: number;
	price: number;
	currency: string;
}> {
	if (!offer) {
		return createSuccess({
			quantity: 0,
			price: 0,
			currency: "kr",
		});
	}

	const normalized = normalize_string(offer);
	if (!normalized.data) {
		return createSuccess({
			quantity: 0,
			price: 0,
			currency: "kr",
		});
	}

	const offerText = normalized.data;

	// Patterns like "4/50kr", "3 för 20kr", "4/299 kr"
	const slashMatch = offerText.match(/(\d+)\s*\/\s*(\d+(?:[.,]\d+)?)\s*kr?/i);
	if (slashMatch) {
		const quantity = parseInt(slashMatch[1], 10);
		const price = parseFloat(slashMatch[2].replace(",", "."));
		return createSuccess({
			quantity,
			price,
			currency: "kr",
		});
	}

	const forMatch = offerText.match(/(\d+)\s*för\s*(\d+(?:[.,]\d+)?)\s*kr?/i);
	if (forMatch) {
		const quantity = parseInt(forMatch[1], 10);
		const price = parseFloat(forMatch[2].replace(",", "."));
		return createSuccess({
			quantity,
			price,
			currency: "kr",
		});
	}

	// Invalid offer format
	return createWarning(
		{
			quantity: 0,
			price: 0,
			currency: "kr",
		},
		`Invalid offer format: ${offer}`,
	);
}

// === Store Detection Services ===

/**
 * Extracts store names from text
 * @param text - The text to search for store names
 * @returns DomainResult with store information
 */
export function extract_store_from_text(text: string): DomainResult<{
	store_normalized: string | null;
	store_raw: string | null;
}> {
	if (text === null) {
		return createError("Input text cannot be null");
	}

	if (!text) {
		return createWarning(
			{ store_normalized: null, store_raw: null },
			"No store found in text",
		);
	}

	const normalizedResult = normalize_string(text);
	if (normalizedResult.status !== "success" || !normalizedResult.data) {
		return createWarning(
			{ store_normalized: null, store_raw: null },
			"No store found in text",
		);
	}

	const normalized = normalizedResult.data;

	// Check for store names in text
	for (const store of STORE_NAMES) {
		const storeLower = store.toLowerCase();
		if (normalized.includes(storeLower)) {
			return createSuccess({
				store_normalized: storeLower,
				store_raw: storeLower, // Could be enhanced to extract exact substring
			});
		}
	}

	// No store found
	return createWarning(
		{ store_normalized: null, store_raw: null },
		"No store found in text",
	);
}

// === Property Detection Services ===

/**
 * Detects if item is organic from modifiers
 * @param modifiers - Array of modifier strings to check
 * @returns True if organic tags are found
 */
export function extract_organic(modifiers: string[]): boolean {
	return modifiers.some((mod) => ORGANIC_TAGS.includes(mod.toLowerCase()));
}

// === Business Rules Services ===

/**
 * Applies default quantity logic for items
 * @param item - The item name
 * @param quantity - The current quantity
 * @param quantity_unit - The current quantity unit
 * @param size_value - The size value
 * @returns DomainResult with applied quantity rules
 */
export function apply_default_quantity(
	item: string | null,
	quantity: number,
	quantity_unit: string | null,
	size_value: number,
): DomainResult<{ quantity: number; quantity_unit: string | null }> {
	// Default logic: If item found but no quantity/size, default to 1 st
	if (item && quantity === 0 && size_value === 0) {
		return createSuccess({ quantity: 1, quantity_unit: "st" });
	}

	return createSuccess({ quantity, quantity_unit });
}

/**
 * Determines parse status based on parsing results
 * @param item - The parsed item name
 * @param category - The parsed category
 * @param has_errors - Whether parsing errors occurred
 * @returns The parse status
 */
export function determine_parse_status(
	item: string | null,
	category: string | null,
	has_errors: boolean,
): "success" | "partial" | "error" {
	if (has_errors) {
		return "error";
	}

	if (!item) {
		return "error";
	}

	if (!category) {
		return "partial";
	}

	return "success";
}
