/**
 * Fuzzy Matching Service for Domain Services
 *
 * Provides progressive matching: exact → alias → substring → fuzzy
 * Uses Levenshtein distance for similarity calculations
 * Preserves Swedish characters and uses Unicode-aware matching
 */

import { BRAND_NAMES, STORE_NAMES } from "./constants";
import { BRAND_VARIATIONS } from "./brand-aliases";

// === Fuzzy Matching Configuration ===

/**
 * Configuration options for fuzzy matching
 */
export interface FuzzyMatchOptions {
	/** Matching strategy to use */
	strategy: "exact" | "progressive";
	/** Minimum confidence threshold (0-1) */
	threshold: number;
	/** Whether matching is case sensitive */
	case_sensitive: boolean;
	/** Whether to try progressive matching stages */
	enable_progressive: boolean;
}

/**
 * Result of a fuzzy matching operation
 */
export interface FuzzyMatchResult<T> {
	/** The matched item (or null if no match) */
	match: T | null;
	/** Confidence score (0-1) */
	confidence: number;
	/** Original input string */
	original_input: string;
	/** The term that was matched */
	matched_term: string | null;
	/** How the match was found */
	match_type: "exact" | "alias" | "substring" | "fuzzy";
}

// === Default Configurations ===

/**
 * Default fuzzy matching options for different domains
 */
export const DEFAULT_FUZZY_OPTIONS = {
	/** Liberal matching for items (allows more variations) */
	items: {
		strategy: "progressive" as const,
		threshold: 0.75,
		case_sensitive: false,
		enable_progressive: true,
	},

	/** Moderate matching for brands (more conservative) */
	brands: {
		strategy: "progressive" as const,
		threshold: 0.85,
		case_sensitive: false,
		enable_progressive: true,
	},

	/** Conservative matching for units (very precise) */
	units: {
		strategy: "progressive" as const,
		threshold: 0.9,
		case_sensitive: false,
		enable_progressive: true,
	},

	/** Flexible matching for stores (substring is important) */
	stores: {
		strategy: "progressive" as const,
		threshold: 0.8,
		case_sensitive: false,
		enable_progressive: true,
	},
};

// === Levenshtein Distance Algorithm ===

/**
 * Calculate Levenshtein distance between two strings
 * Uses dynamic programming approach with O(m*n) time and space
 *
 * @param a - First string
 * @param b - Second string
 * @returns Number of edits needed to transform a into b
 */
export function levenshtein_distance(a: string, b: string): number {
	const matrix: number[][] = [];

	// Initialize matrix
	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	// Fill matrix
	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j] + 1, // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings
 * Returns 1.0 for identical strings, 0.0 for completely different
 *
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score between 0 and 1
 */
export function calculate_similarity(a: string, b: string): number {
	// Both empty strings are considered identical
	if (a === "" && b === "") return 1;
	if (!a || !b) return 0;
	if (a === b) return 1;

	const max_len = Math.max(a.length, b.length);
	if (max_len === 0) return 1;

	const distance = levenshtein_distance(a, b);
	return 1 - distance / max_len;
}

// === Core Fuzzy Matching Functions ===

/**
 * Progressive matching implementation
 * Tries exact → alias → substring → fuzzy in order
 *
 * @param input - Input string to match
 * @param candidates - Array of possible matches
 * @param options - Matching configuration
 * @returns FuzzyMatchResult with best match found
 */
export function progressive_match<T>(
	input: string,
	candidates: T[],
	options: FuzzyMatchOptions,
	aliases?: Record<string, T>,
): FuzzyMatchResult<T> {
	if (!input || !candidates || candidates.length === 0) {
		return {
			match: null,
			confidence: 0,
			original_input: input,
			matched_term: null,
			match_type: "fuzzy",
		};
	}

	const normalizedInput = options.case_sensitive ? input : input.toLowerCase();

	// 1. Exact match (confidence: 1.0)
	for (const candidate of candidates) {
		const candidateStr = String(candidate);
		const normalizedCandidate = options.case_sensitive
			? candidateStr
			: candidateStr.toLowerCase();

		if (normalizedInput === normalizedCandidate) {
			return {
				match: candidate,
				confidence: 1.0,
				original_input: input,
				matched_term: candidateStr,
				match_type: "exact",
			};
		}
	}

	// 2. Alias match (confidence: 0.95)
	if (aliases && normalizedInput in aliases) {
		const canonical = aliases[normalizedInput];
		return {
			match: canonical,
			confidence: 0.95,
			original_input: input,
			matched_term: normalizedInput,
			match_type: "alias",
		};
	}

	// 3. Substring match (confidence: 0.9)
	for (const candidate of candidates) {
		const candidateStr = String(candidate);
		const normalizedCandidate = options.case_sensitive
			? candidateStr
			: candidateStr.toLowerCase();

		if (
			normalizedCandidate.includes(normalizedInput) ||
			normalizedInput.includes(normalizedCandidate)
		) {
			return {
				match: candidate,
				confidence: 0.9,
				original_input: input,
				matched_term: candidateStr,
				match_type: "substring",
			};
		}
	}

	// 4. Fuzzy match (confidence: varies)
	let bestMatch: T | null = null;
	let bestConfidence = 0;
	let bestTerm = null;

	for (const candidate of candidates) {
		const candidateStr = String(candidate);
		const normalizedCandidate = options.case_sensitive
			? candidateStr
			: candidateStr.toLowerCase();

		const similarity = calculate_similarity(
			normalizedInput,
			normalizedCandidate,
		);

		if (similarity > bestConfidence && similarity >= options.threshold) {
			bestMatch = candidate;
			bestConfidence = similarity;
			bestTerm = candidateStr;
		}
	}

	if (bestMatch) {
		return {
			match: bestMatch,
			confidence: bestConfidence,
			original_input: input,
			matched_term: bestTerm,
			match_type: "fuzzy",
		};
	}

	// No match found
	return {
		match: null,
		confidence: 0,
		original_input: input,
		matched_term: null,
		match_type: "fuzzy",
	};
}

// === Domain-Specific Matching Functions ===

/**
 * Match brand name using fuzzy matching
 * Uses brand aliases and BRAND_NAMES array
 */
export function match_brand(input: string): FuzzyMatchResult<string> {
	if (!input) {
		return {
			match: null,
			confidence: 0,
			original_input: input,
			matched_term: null,
			match_type: "fuzzy",
		};
	}

	return progressive_match(
		input,
		[...BRAND_NAMES],
		DEFAULT_FUZZY_OPTIONS.brands,
		BRAND_VARIATIONS,
	);
}

/**
 * Match store name using fuzzy matching
 * Uses STORE_NAMES array with substring matching
 */
export function match_store(input: string): FuzzyMatchResult<string> {
	if (!input) {
		return {
			match: null,
			confidence: 0,
			original_input: input,
			matched_term: null,
			match_type: "fuzzy",
		};
	}

	return progressive_match(
		input,
		[...STORE_NAMES],
		DEFAULT_FUZZY_OPTIONS.stores,
	);
}

/**
 * Match items using fuzzy matching
 * Generic function for item matching
 */
export function match_items<T extends string>(
	input: string,
	items: T[],
	options: Partial<FuzzyMatchOptions> = {},
): FuzzyMatchResult<T> {
	const mergedOptions = { ...DEFAULT_FUZZY_OPTIONS.items, ...options };

	return progressive_match(input, items, mergedOptions);
}

/**
 * Match generic candidates with custom options
 */
export function match_generic<T extends string>(
	input: string,
	candidates: T[],
	options: Partial<FuzzyMatchOptions> = {},
	aliases?: Record<string, T>,
): FuzzyMatchResult<T> {
	const mergedOptions = {
		strategy: "progressive" as const,
		threshold: 0.75,
		case_sensitive: false,
		enable_progressive: true,
		...options,
	};

	return progressive_match(input, candidates, mergedOptions, aliases);
}
