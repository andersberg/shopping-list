import { BRAND_NAMES } from "../ai/grocery-input-parser/brand-names";
import { QUANTITY_UNITS } from "../ai/grocery-input-parser/quantity-units";
import { SIZE_UNITS } from "../ai/grocery-input-parser/size-units";
import { STORE_NAMES } from "../ai/grocery-input-parser/store-names";
import type { GroceryItem } from "../grocery-item";

// --- 3. Input & Output Contract ---

/**
 * The result of the manual parser.
 * It matches the GroceryItem schema used in the application.
 *
 * Mappings from Spec Status to Application Status:
 * - "ok" -> "ok"
 * - "partial" -> "needs_review"
 * - "error" -> "parse_error"
 */
export type ParsedResult = GroceryItem;

// --- Internal Pipeline Types ---

// 5. Pre-normalization
export type NormalizedInput = {
	original_text: string;
	normalized_text: string;
};

// 6. Tokenization
export type TokenType = "number" | "word" | "price" | "separator";

export type Token = {
	text: string; // original segment as in normalized_text
	type: TokenType;
	index: number; // position in token array
	start?: number; // char offset (optional)
	end?: number; // char offset (optional)
};

// 7. Lexicons & Annotation
export type TokenLabel =
	| { kind: "quantity_candidate" }
	| { kind: "size_value_candidate" }
	| { kind: "size_unit_candidate"; canonical_unit: string }
	| { kind: "item_candidate"; canonical_item: string }
	| { kind: "brand_candidate"; canonical_brand: string }
	| { kind: "store_candidate"; canonical_store: string }
	| { kind: "organic_tag" }
	| { kind: "offer_pattern" } // for tokens that look like offers/prices
	| { kind: "price_value_candidate" };

export type AnnotatedToken = Token & {
	labels: TokenLabel[];
};

// 8. Rule-based Interpretation (Grammar)
export type ParsedDraft = {
	item: string | null;
	quantity: number | null;
	quantity_unit: string | null;
	size_value: number | null;
	size_unit: string | null;
	brand: string | null;
	organic: boolean;
	comment: string | null;
	store_normalized: string | null;
	store_raw: string | null;
	offer_quantity: number | null;
	offer_total_price_value: number | null;
	offer_currency: string | null;
};

// Implementation
export function interpret_grammar(
	tokens: AnnotatedToken[],
	_original_text: string, // Not strictly used in logic but passed as per plan/spec if needed for substrings
): ParsedDraft {
	const draft: ParsedDraft = {
		item: null,
		quantity: null,
		quantity_unit: null,
		size_value: null,
		size_unit: null,
		brand: null,
		organic: false,
		comment: null,
		store_normalized: null,
		store_raw: null,
		offer_quantity: null,
		offer_total_price_value: null,
		offer_currency: null,
	};

	const used_indices = new Set<number>();
	const mark_used = (indices: number[]) =>
		indices.forEach((i) => {
			used_indices.add(i);
		});

	// 1. Offer / Price Patterns
	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		const next = tokens[i + 1];
		const next2 = tokens[i + 2];

		// Pattern: "3 för 20" or "3 för 20kr"
		if (
			t.type === "number" &&
			next?.text === "för" &&
			(next2?.type === "number" || next2?.type === "price")
		) {
			draft.offer_quantity = Number.parseFloat(t.text);
			// Handle "20" or "20kr"
			// If "20kr" was tokenized as price, we extract number.
			// "20" -> 20. "20kr" -> 20.
			const price_text = next2.text.replace(/kr/i, "");
			draft.offer_total_price_value = Number.parseFloat(price_text);
			draft.offer_currency = "SEK";
			mark_used([i, i + 1, i + 2]);

			// If next2 was number and next3 is "kr"?
			// My tokenizer keeps "20kr" as price? Or splits?
			// Tokenizer: /^\d+(\.\d+)?kr$/ -> price.
			// So "20kr" is one token.
			// "20" is number.
			// If "3 för 20 kr" -> [3, för, 20, kr] -> "20" is number, "kr" is word.
			// In this case next2 is "20".
			if (next2.type === "number" && tokens[i + 3]?.text === "kr") {
				mark_used([i + 3]);
			}
			// We break or continue? Spec says "Avoid overwriting... unless rule has higher priority".
			// This is highest priority.
		}
		// Pattern: "4/50" or "4/50kr"
		else if (t.type === "price" && t.text.includes("/")) {
			// "4/50kr" -> split by /
			// Remove kr first for parsing numbers
			const clean = t.text.replace(/kr/i, "");
			const parts = clean.split("/");
			if (
				parts.length === 2 &&
				!Number.isNaN(Number.parseFloat(parts[0])) &&
				!Number.isNaN(Number.parseFloat(parts[1]))
			) {
				draft.offer_quantity = Number.parseFloat(parts[0]);
				draft.offer_total_price_value = Number.parseFloat(parts[1]);
				draft.offer_currency = "SEK";
				mark_used([i]);

				// Check if next token is "kr" and consume it
				// "4/50" -> next might be "kr"
				const next = tokens[i + 1];
				if (next && next.text.toLowerCase() === "kr") {
					mark_used([i + 1]);
				}
			}
		}
		// Pattern: "299kr" (unit price or offer price?)
		// Spec 8.3: "299kr with no quantity... treat as unit price if quantity is 1 or unknown."
		// "It may only fill offer_total_price_value if a quantity pattern (3 för 20) is not present."
		else if (t.type === "price" && !t.text.includes("/")) {
			// e.g. "299kr"
			const val = Number.parseFloat(t.text.replace(/kr/i, ""));
			if (draft.offer_total_price_value === null) {
				draft.offer_total_price_value = val;
				draft.offer_currency = "SEK";
				mark_used([i]);
			}
		}
		// Pattern: "299 kr" -> [299, kr]
		else if (t.type === "number" && next?.text === "kr") {
			if (draft.offer_total_price_value === null) {
				draft.offer_total_price_value = Number.parseFloat(t.text);
				draft.offer_currency = "SEK";
				mark_used([i, i + 1]);
			}
		}
	}

	// 2. Quantity + Quantity Unit
	// Spec: "Leftmost number before item and not part of an offer/size..."
	// We iterate L->R.
	let quantity_found = false;
	for (let i = 0; i < tokens.length; i++) {
		if (used_indices.has(i)) continue;
		if (quantity_found) break; // Only one quantity

		const t = tokens[i];
		if (t.type === "number") {
			const next = tokens[i + 1];
			// Check if it looks like a size (number + size_unit)
			// BUT wait, "3 pkt" (quantity=3, unit=pkt) vs "1.5 l" (size=1.5, unit=l)
			// How to disambiguate?
			// Lexicon differentiation:
			// pkt -> QUANTITY_UNITS
			// l -> SIZE_UNITS
			// If unit is ONLY in SIZE_UNITS -> it's a size.
			// If unit is in QUANTITY_UNITS (even if also in SIZE_UNITS, e.g. 'st'?) -> prefer quantity?
			// Spec 8.4: "3 pkt mjölk" -> quantity=3.
			// Spec 8.5: "1,5l mjölk" -> size_value=1.5.

			let is_size = false;
			let potential_unit: string | null = null;

			if (next && !used_indices.has(i + 1)) {
				// Check labels for unit candidate
				const unit_label = next.labels.find(
					(l) => l.kind === "size_unit_candidate",
				);
				if (unit_label && unit_label.kind === "size_unit_candidate") {
					potential_unit = unit_label.canonical_unit;
					// Check strict membership
					const is_qty_unit = LOWER_QUANTITY_UNITS.includes(potential_unit);
					const is_size_unit = LOWER_SIZE_UNITS.includes(potential_unit);

					// If it's strictly a size unit (e.g. 'g', 'ml', 'l', 'kg'), treat as size.
					// 'kg' is in both? QUANTITY_UNITS has 'kg', 'kilo'. SIZE_UNITS has 'kg'.
					// "1 kg potatis" -> quantity=1, unit=kg? Or size=1kg?
					// Spec example: "1 kg potatis" -> quantity=1 (implied?), size=1kg?
					// Fixture example: "1 kg potatis" -> parser output?
					// Let's look at 8.4: "3 pkt mjölk -> quantity=3, unit=package".
					// "3 mjölk -> quantity=3".
					// "1,5l mjölk -> size=1.5".

					// Decision: If it contains a decimal "1.5", it's likely size.
					// If it's an integer AND unit is in QUANTITY_UNITS, it's quantity.

					if (t.text.includes(".")) {
						is_size = true;
					} else if (is_qty_unit) {
						is_size = false; // It's quantity
					} else if (is_size_unit) {
						is_size = true;
					}
				}
			}

			if (!is_size) {
				// It's a quantity candidate
				draft.quantity = Number.parseFloat(t.text);
				if (potential_unit) {
					draft.quantity_unit = potential_unit; // Use canonical?
					mark_used([i, i + 1]);
				} else {
					mark_used([i]);
				}
				quantity_found = true;
			}
		}
	}

	// 3. Size Value + Size Unit
	for (let i = 0; i < tokens.length; i++) {
		if (used_indices.has(i)) continue;
		const t = tokens[i];

		if (t.type === "number") {
			const next = tokens[i + 1];
			if (next && !used_indices.has(i + 1)) {
				const unit_label = next.labels.find(
					(l) => l.kind === "size_unit_candidate",
				);
				if (unit_label && unit_label.kind === "size_unit_candidate") {
					draft.size_value = Number.parseFloat(t.text);
					draft.size_unit = unit_label.canonical_unit;
					mark_used([i, i + 1]);
				}
			}
		}
	}

	// 4. Item
	// Find unused item_candidate closest to quantity?
	// "Prefer the one closest to quantity/size tokens."
	// Simplified: Pick the first unused item_candidate.
	const item_candidates = tokens.filter(
		(t) =>
			!used_indices.has(t.index) &&
			t.labels.some((l) => l.kind === "item_candidate"),
	);

	if (item_candidates.length > 0) {
		// If we have multiple, logic to pick best?
		// For now, pick the first one found.
		const best = item_candidates[0];
		const label = best.labels.find((l) => l.kind === "item_candidate");
		if (label && label.kind === "item_candidate") {
			draft.item = label.canonical_item;
		} else {
			draft.item = best.text;
		}
		mark_used([best.index]);
	} else {
		// Fallback: Try last word not tagged as brand/store/organic/unit
		// Scan backwards
		for (let i = tokens.length - 1; i >= 0; i--) {
			if (used_indices.has(i)) continue;
			const t = tokens[i];
			if (t.type === "word") {
				const is_tagged = t.labels.some((l) =>
					[
						"brand_candidate",
						"store_candidate",
						"organic_tag",
						"size_unit_candidate",
						"offer_pattern",
					].includes(l.kind),
				);
				if (!is_tagged) {
					draft.item = t.text;
					mark_used([i]);
					break;
				}
			}
		}
	}

	// 5. Brand
	// Collect all unused brand candidates
	const brands: string[] = [];
	for (let i = 0; i < tokens.length; i++) {
		if (used_indices.has(i)) continue;
		const t = tokens[i];
		const brand_label = t.labels.find((l) => l.kind === "brand_candidate");
		const store_label = t.labels.find((l) => l.kind === "store_candidate");

		if (brand_label && brand_label.kind === "brand_candidate") {
			// Conflict resolution: If it's also a store candidate, prefer Store (skip here).
			// Spec 8.7: "Not clearly a store."
			if (store_label) {
				continue;
			}
			brands.push(brand_label.canonical_brand);
			mark_used([i]);
		}
	}
	if (brands.length > 0) {
		draft.brand = brands.join(" ");
	}

	// 6. Store
	for (let i = 0; i < tokens.length; i++) {
		if (used_indices.has(i)) continue;
		const label = tokens[i].labels.find((l) => l.kind === "store_candidate");
		if (label && label.kind === "store_candidate") {
			draft.store_normalized = label.canonical_store;
			draft.store_raw = tokens[i].text;
			mark_used([i]);
			// Only one store? Spec doesn't say. Assume first found.
			break;
		}
	}

	// 7. Organic
	for (let i = 0; i < tokens.length; i++) {
		if (used_indices.has(i)) continue;
		if (tokens[i].labels.some((l) => l.kind === "organic_tag")) {
			draft.organic = true;
			mark_used([i]);
		}
	}

	// 8. Comment
	const comment_words: string[] = [];
	for (let i = 0; i < tokens.length; i++) {
		if (used_indices.has(i)) continue;
		// Spec says: "Any remaining words... can be included in comment"
		comment_words.push(tokens[i].text);
	}
	if (comment_words.length > 0) {
		draft.comment = comment_words.join(" ");
	}

	return draft;
}

// 9. Post-processing & Validation

export function post_process(draft: ParsedDraft): ParsedResult {
	// Defaults
	let quantity = draft.quantity ?? 0;
	let quantity_unit = draft.quantity_unit;
	const size_value = draft.size_value ?? 0;
	const offer_quantity = draft.offer_quantity ?? 0;
	const offer_total_price_value = draft.offer_total_price_value ?? 0;

	// Default logic: If item found but no quantity/size, default to 1 st
	if (draft.item && quantity === 0 && size_value === 0) {
		quantity = 1;
		quantity_unit = "st";
	}

	// Total Quantity Calculation
	let total_quantity_value = 0;
	let total_quantity_unit: string | null = null;

	if (quantity > 0 && size_value > 0) {
		total_quantity_value = quantity * size_value;
		total_quantity_unit = draft.size_unit;
	} else if (quantity > 0) {
		total_quantity_value = quantity;
		total_quantity_unit = quantity_unit;
	} else if (size_value > 0) {
		// If only size is known
		total_quantity_value = size_value;
		total_quantity_unit = draft.size_unit;
	}

	// Offer Unit Price
	let offer_unit_price_value = 0;
	if (offer_quantity > 0 && offer_total_price_value > 0) {
		offer_unit_price_value = offer_total_price_value / offer_quantity;
	}

	// Status Logic
	let status: ParsedResult["status"] = "ok";
	let error: string | null = null;

	if (!draft.item) {
		status = "parse_error";
		error = "No item candidate found";
	} else if (quantity === 0 && size_value === 0) {
		// This block is now less likely to be hit for simple items due to default logic above,
		// but remains for cases where defaults might not apply or logic changes.
		status = "needs_review";
	}

	// Category (stub)
	// Spec: "If category mapping exists... otherwise use default."
	// Since we don't have the mapping loaded here easily, we leave it null.
	// Validation layer or subsequent step (AI) can fill it.
	const category = null;

	return {
		item: draft.item,
		category,
		quantity,
		quantity_unit: quantity_unit as any, // Cast to enum type if needed
		size_value,
		size_unit: draft.size_unit as any,
		brand: draft.brand,
		organic: draft.organic,
		comment: draft.comment,
		unit_normalized: null, // TODO: normalize using unit lexicon if needed
		total_quantity_value,
		total_quantity_unit: total_quantity_unit as any,
		store_normalized: draft.store_normalized as any,
		store_raw: draft.store_raw,
		offer_quantity,
		offer_total_price_value,
		offer_currency: draft.offer_currency as any,
		offer_unit_price_value,
		status,
		error,
		// Database fields (legacy compatibility)
		name: draft.item,
		discount_price: null,
		unit: quantity_unit,
		source: "manual",
	};
}

// --- Main Function ---

export function parse_grocery_line(input: string): ParsedResult {
	// 1. Pre-normalize
	const normalized = pre_normalize(input);

	// 2. Tokenize
	const tokens = tokenize(normalized);

	// 3. Annotate
	const annotated = annotate(tokens);

	// 4. Grammar
	const draft = interpret_grammar(annotated, normalized.original_text);

	// 5. Post-process
	return post_process(draft);
}

// --- Implementation ---

// 5. Pre-normalization
export function pre_normalize(input: string): NormalizedInput {
	const original_text = input;
	let normalized_text = input.trim();

	// Collapse multiple spaces
	normalized_text = normalized_text.replace(/\s+/g, " ");

	// Split stuck numbers/units (e.g., "1.5kg" -> "1.5 kg")
	// Look for a digit followed immediately by a letter or %
	normalized_text = normalized_text.replace(/(\d)([a-zA-Z%])/g, "$1 $2");

	// Normalize decimal separators (e.g. "1,5" -> "1.5")
	// We need to be careful not to break other commas if they are used as separators,
	// but usually in grocery lines "1,5" is a number.
	// Spec: "1,5l", "1,5 l" -> "1.5 l"
	// We use a lookahead/lookbehind or simple group capture to replace comma between digits.
	normalized_text = normalized_text.replace(/(\d+),(\d+)/g, "$1.$2");

	// Normalize currency
	// "KR", "kr", ":-" -> "kr"
	// Handle "100:-" -> "100kr"
	normalized_text = normalized_text.replace(/(\d+)(:-\s?|:-)/g, "$1kr ");
	// Handle loose variants
	normalized_text = normalized_text.replace(
		/(\s|^)(kr|KR|:-\s?)(?=\s|$)/g,
		" kr ",
	);
	// Ensure space before kr if attached to number (though split number/unit might handle this, 'kr' is letters)
	// e.g. "100kr" -> split rule makes it "100 kr"
	// So we might just need to normalize case.

	// Clean up extra spaces introduced
	normalized_text = normalized_text.replace(/\s+/g, " ").trim();

	// Lowercase for internal processing (though we return it as normalized_text,
	// spec says "work on a lowercase copy of normalized_text".
	// Let's lowercase it here to simplify downstream steps.)
	normalized_text = normalized_text.toLowerCase();

	return {
		original_text,
		normalized_text,
	};
}

// 6. Tokenization
export function tokenize(input: NormalizedInput): Token[] {
	const raw_tokens = input.normalized_text.split(" ");
	const tokens: Token[] = [];

	let current_index = 0;

	for (const text of raw_tokens) {
		if (!text) continue; // skip empty splits

		let type: TokenType = "word";

		// Check for number (integer or decimal)
		if (/^\d+(\.\d+)?$/.test(text)) {
			type = "number";
		}
		// Check for price-like segments
		// e.g. "4/50" (since "kr" might be split off)
		// or "4/50kr" if normalization didn't catch it for some reason
		else if (/^\d+(\.\d+)?kr$/.test(text) || /^\d+\/\d+/.test(text)) {
			type = "price";
		}
		// Separators?
		// If text is just punctuation
		else if (/^[^a-z0-9åäö]+$/.test(text)) {
			type = "separator";
		}

		tokens.push({
			text,
			type,
			index: current_index,
		});
		current_index++;
	}

	return tokens;
}

// 7. Lexicons & Annotation

// Helpers
const LOWER_QUANTITY_UNITS = QUANTITY_UNITS.map((u) => u.toLowerCase());
const LOWER_SIZE_UNITS = SIZE_UNITS.map((u) => u.toLowerCase());
const LOWER_BRAND_NAMES = BRAND_NAMES.map((b) => b.toLowerCase());
const LOWER_STORE_NAMES = STORE_NAMES.map((s) => s.toLowerCase());
const ORGANIC_TAGS = ["eko", "ekologisk", "ekologiska", "krav", "organic"];
const OFFER_KEYWORDS = ["för"];

// Basic Item Lexicon
const COMMON_ITEMS = [
	"mjölk",
	"bröd",
	"smör",
	"ost",
	"kaffe",
	"pasta",
	"ris",
	"ägg",
	"tomat",
	"tomater",
	"gurka",
	"banan",
	"äpple",
	"äpplen",
	"potatis",
	"lök",
	"morot",
	"morötter",
	"kyckling",
	"färs",
	"köttfärs",
	"bacon",
	"korv",
	"skinka",
	"fil",
	"yoghurt",
	"grädde",
	"creme fraiche",
	"krossade tomater",
	"bönor",
	"linser",
	"kikärtor",
	"majs",
	"ärtor",
	"spenat",
	"broccoli",
	"blomkål",
	"sallad",
	"paprika",
	"avokado",
	"citron",
	"lime",
	"apelsin",
	"juice",
	"läsk",
	"vatten",
	"öl",
	"vin",
	"chips",
	"godis",
	"choklad",
	"glass",
	"blöjor",
	"toalettpapper",
	"tvättmedel",
	"diskmedel",
	"tvål",
	"schampo",
	"balsam",
];

export function annotate(tokens: Token[]): AnnotatedToken[] {
	return tokens.map((token) => {
		const lower = token.text.toLowerCase(); // Text is already lowercased in pre_normalize, but safe to ensure.
		const labels: TokenLabel[] = [];

		// Numbers can be quantity, size value, or price value
		if (token.type === "number") {
			labels.push({ kind: "quantity_candidate" });
			labels.push({ kind: "size_value_candidate" });
			labels.push({ kind: "price_value_candidate" });
		}

		// Price-like tokens
		if (token.type === "price") {
			labels.push({ kind: "offer_pattern" });
			labels.push({ kind: "price_value_candidate" });
		}

		// Units
		// Spec: "Words that match unit lexicon forms -> size_unit_candidate"
		if (LOWER_QUANTITY_UNITS.includes(lower)) {
			// We tag as size_unit_candidate because spec 8.5 says "number + size_unit_candidate"
			// But spec 8.4 also says "Leading number... quantity_unit = 'package' (from unit lexicon)"
			// So it acts as both depending on context.
			// We'll use size_unit_candidate as the generic "unit" label for now, or add a specific quantity_unit_candidate if needed.
			// The spec defines `size_unit_candidate` in section 7.2, but NOT `quantity_unit_candidate`.
			// It implies `size_unit_candidate` covers both or we differentiate in grammar.
			labels.push({ kind: "size_unit_candidate", canonical_unit: lower });
		}
		// Also check SIZE_UNITS if distinct (some overlap usually)
		if (LOWER_SIZE_UNITS.includes(lower)) {
			// Avoid duplicate label if already added
			if (
				!labels.some(
					(l) => l.kind === "size_unit_candidate" && l.canonical_unit === lower,
				)
			) {
				labels.push({ kind: "size_unit_candidate", canonical_unit: lower });
			}
		}

		// Brands
		if (LOWER_BRAND_NAMES.includes(lower)) {
			// Find original case from BRAND_NAMES? Or just use lower as canonical for now?
			// The spec type says `canonical_brand: string`.
			// Let's find the proper casing if we can.
			const original =
				BRAND_NAMES.find((b) => b.toLowerCase() === lower) || lower;
			labels.push({ kind: "brand_candidate", canonical_brand: original });
		}

		// Stores
		if (LOWER_STORE_NAMES.includes(lower)) {
			labels.push({ kind: "store_candidate", canonical_store: lower });
		}

		// Organic
		if (ORGANIC_TAGS.includes(lower)) {
			labels.push({ kind: "organic_tag" });
		}

		// Offer keywords
		if (OFFER_KEYWORDS.includes(lower)) {
			labels.push({ kind: "offer_pattern" });
		}

		// Items
		if (COMMON_ITEMS.includes(lower)) {
			labels.push({ kind: "item_candidate", canonical_item: lower });
		}

		// Heuristic: If it's a word and NOT a keyword/unit/brand/store/organic, it might be an item.
		// Spec 8.6 says: "If no item_candidate: Try last word not tagged as brand/store/organic/unit."
		// So we don't necessarily need to label it `item_candidate` here if it's unknown,
		// we can let the Grammar step pick it up as fallback.
		// BUT, if we want to support "Partial" parsing where we identify the item even if unknown,
		// tagging it as a candidate if it's "plain" is useful.
		// Let's stick to the explicit lexicon for `item_candidate` labels to be "high confidence",
		// and let the fallback logic handle unknown words.

		return { ...token, labels };
	});
}
