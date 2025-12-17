import { describe, expect, it } from "vitest";
import {
	levenshtein_distance,
	calculate_similarity,
	progressive_match,
	match_brand,
	match_store,
	match_items,
	match_generic,
	DEFAULT_FUZZY_OPTIONS,
	type FuzzyMatchOptions,
	type FuzzyMatchResult,
} from "./fuzzy-matching-service";
import { BRAND_NAMES, STORE_NAMES } from "./constants";
import { BRAND_ALIASES, BRAND_VARIATIONS } from "./brand-aliases";

describe("Fuzzy Matching Service", () => {
	describe("Levenshtein Distance", () => {
		it("should calculate distance for identical strings", () => {
			const result = levenshtein_distance("test", "test");
			expect(result).toBe(0);
		});

		it("should calculate distance for similar strings", () => {
			const result = levenshtein_distance("test", "tests");
			expect(result).toBe(1);
		});

		it("should calculate distance for completely different strings", () => {
			const result = levenshtein_distance("abc", "xyz");
			expect(result).toBe(3);
		});

		it("should handle empty strings", () => {
			const result = levenshtein_distance("", "test");
			expect(result).toBe(4);
		});

		it("should handle Swedish characters correctly", () => {
			const result = levenshtein_distance("mjölk", "mjolk");
			expect(result).toBe(1);
		});

		it("should handle Unicode characters", () => {
			const result = levenshtein_distance("café", "cafe");
			expect(result).toBe(1);
		});
	});

	describe("Similarity Calculation", () => {
		it("should return 1.0 for identical strings", () => {
			const result = calculate_similarity("test", "test");
			expect(result).toBe(1);
		});

		it("should return 1 for empty strings", () => {
			const result = calculate_similarity("", "");
			expect(result).toBe(1); // Both empty considered identical
		});

		it("should calculate similarity correctly", () => {
			const result = calculate_similarity("test", "tost");
			expect(result).toBe(0.75); // 1 edit out of 4 characters
		});

		it("should handle completely different strings", () => {
			const result = calculate_similarity("abc", "xyz");
			expect(result).toBe(0);
		});

		it("should handle strings of different lengths", () => {
			const result = calculate_similarity("test", "testing");
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThanOrEqual(1);
		});
	});

	describe("Progressive Matching", () => {
		it("should find exact match with confidence 1.0", () => {
			const candidates = ["test", "example", "sample"];
			const result = progressive_match(
				"test",
				candidates,
				DEFAULT_FUZZY_OPTIONS.items,
			);

			expect(result.match).toBe("test");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
			expect(result.matched_term).toBe("test");
		});

		it("should handle case insensitive matching", () => {
			const candidates = ["Test", "Example", "Sample"];
			const options = { ...DEFAULT_FUZZY_OPTIONS.items, case_sensitive: false };
			const result = progressive_match("test", candidates, options);

			expect(result.match).toBe("Test");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});

		it("should find alias match with confidence 0.95", () => {
			const candidates = ["Kellogg's", "Arla", "Oatly"];
			const aliases = { kelloggs: "Kellogg's" };
			const result = progressive_match(
				"kelloggs",
				candidates,
				DEFAULT_FUZZY_OPTIONS.brands,
				aliases,
			);

			expect(result.match).toBe("Kellogg's");
			expect(result.confidence).toBe(0.95);
			expect(result.match_type).toBe("alias");
			expect(result.matched_term).toBe("kelloggs");
		});

		it("should find substring match with confidence 0.9", () => {
			const candidates = ["SuperBrand", "MegaBrand", "UltraBrand"];
			const result = progressive_match(
				"super",
				candidates,
				DEFAULT_FUZZY_OPTIONS.brands,
			);

			expect(result.match).toBe("SuperBrand");
			expect(result.confidence).toBe(0.9);
			expect(result.match_type).toBe("substring");
		});

		it("should find fuzzy match above threshold", () => {
			const candidates = ["test", "best", "rest"];
			const options = { ...DEFAULT_FUZZY_OPTIONS.items, threshold: 0.5 };
			const result = progressive_match("tost", candidates, options);

			expect(result.match).toBe("test");
			expect(result.confidence).toBeGreaterThan(0.5);
			expect(result.match_type).toBe("fuzzy");
		});

		it("should return no match below threshold", () => {
			const candidates = ["apple", "banana", "cherry"];
			const options = { ...DEFAULT_FUZZY_OPTIONS.items, threshold: 0.9 };
			const result = progressive_match("xyz", candidates, options);

			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
			expect(result.match_type).toBe("fuzzy");
		});

		it("should handle empty input", () => {
			const candidates = ["test", "example"];
			const result = progressive_match(
				"",
				candidates,
				DEFAULT_FUZZY_OPTIONS.items,
			);

			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
		});

		it("should handle empty candidates", () => {
			const result = progressive_match("test", [], DEFAULT_FUZZY_OPTIONS.items);

			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
		});

		it("should preserve Swedish characters in matching", () => {
			const candidates = ["mjölk", "ägg", "grädde"];
			const result = progressive_match(
				"mjölk",
				candidates,
				DEFAULT_FUZZY_OPTIONS.items,
			);

			expect(result.match).toBe("mjölk");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});
	});

	describe("Brand Matching", () => {
		it("should match exact brand names", () => {
			const result = match_brand("Arla");

			expect(result.match).toBe("Arla");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});

		it("should match using brand aliases", () => {
			const result = match_brand("kelloggs");

			expect(result.match).toBe("Kellogg's");
			expect(result.confidence).toBe(0.95);
			expect(result.match_type).toBe("alias");
		});

		it("should handle multiple brand aliases", () => {
			const result1 = match_brand("kelloggs");
			const result2 = match_brand("kellog");
			const result3 = match_brand("kellogs");

			expect(result1.match).toBe("Kellogg's");
			expect(result2.match).toBe("Kellogg's");
			expect(result3.match).toBe("Kellogg's");

			expect(result1.match_type).toBe("alias");
			expect(result2.match_type).toBe("alias");
			expect(result3.match_type).toBe("alias");
		});

		it("should match case insensitive brand names", () => {
			const result = match_brand("arla");

			expect(result.match).toBe("Arla");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});

		it("should match brand with special characters", () => {
			const result = match_brand("oatley");

			expect(result.match).toBe("Oatly");
			expect(result.confidence).toBe(0.95);
			expect(result.match_type).toBe("alias");
		});

		it("should match store abbreviations", () => {
			const result = match_brand("i.c.a");

			expect(result.match).toBe("ICA");
			expect(result.confidence).toBe(0.95);
			expect(result.match_type).toBe("alias");
		});

		it("should return null for unknown brands", () => {
			const result = match_brand("UnknownBrand");

			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
			expect(result.match_type).toBe("fuzzy");
		});

		it("should handle null input", () => {
			const result = match_brand(null as any);

			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
		});

		it("should preserve Swedish characters in brands", () => {
			// Test with a hypothetical Swedish brand
			const swedishBrands = ["Mjölkcentralen", "Äggfabriken"];
			const result = progressive_match(
				"mjölkcentralen",
				swedishBrands,
				DEFAULT_FUZZY_OPTIONS.brands,
			);

			expect(result.match).toBe("Mjölkcentralen");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});
	});

	describe("Store Matching", () => {
		it("should match exact store names", () => {
			const result = match_store("ICA");

			expect(result.match).toBe("ICA");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});

		it("should match store names case insensitively", () => {
			const result = match_store("ica");

			expect(result.match).toBe("ICA");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});

		it("should match substring within store names", () => {
			const result = match_store("coop store");

			expect(result.match).toBe("Coop");
			expect(result.confidence).toBe(0.9);
			expect(result.match_type).toBe("substring");
		});

		it("should return null for unknown stores", () => {
			const result = match_store("UnknownStore");

			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
		});

		it("should handle null input", () => {
			const result = match_store(null as any);

			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
		});
	});

	describe("Generic Item Matching", () => {
		it("should match items with default options", () => {
			const items = ["mjölk", "ägg", "bröd"];
			const result = match_items("mjölk", items);

			expect(result.match).toBe("mjölk");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});

		it("should use custom options", () => {
			const items = ["apple", "apricot", "application"];
			const options = { threshold: 0.6 };
			const result = match_items("aple", items, options); // Changed to "aple" to avoid substring match

			expect(result.match).toBeTruthy();
			expect(result.confidence).toBeGreaterThan(0.6);
			expect(result.match_type).toBe("fuzzy");
		});

		it("should handle empty items array", () => {
			const result = match_items("test", []);

			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
		});

		it("should preserve Swedish characters in items", () => {
			const items = ["mjölk", "grädde", "smör"];
			const result = match_items("MJÖLK", items, { case_sensitive: false });

			expect(result.match).toBe("mjölk");
			expect(result.confidence).toBe(1.0);
			expect(result.match_type).toBe("exact");
		});
	});

	describe("Generic Matching with Aliases", () => {
		it("should use aliases for generic matching", () => {
			const candidates = ["CANONICAL_BRAND", "ANOTHER_BRAND"];
			const aliases = { alias_input: "CANONICAL_BRAND" };
			const result = match_generic("alias_input", candidates, {}, aliases);

			expect(result.match).toBe("CANONICAL_BRAND");
			expect(result.confidence).toBe(0.95);
			expect(result.match_type).toBe("alias");
		});

		it("should fall back to fuzzy matching without aliases", () => {
			const candidates = ["apple", "apply"];
			const result = match_generic("aple", candidates, { threshold: 0.5 });

			expect(result.match).toBe("apple");
			expect(result.match_type).toBe("fuzzy");
		});

		it("should handle conflicting options properly", () => {
			const candidates = ["test", "toast"];
			const options = { threshold: 0.9, case_sensitive: true };
			const result = match_generic("TEST", candidates, options);

			// Should not match due to case sensitivity
			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
		});
	});

	describe("Default Configuration", () => {
		it("should have liberal threshold for items", () => {
			expect(DEFAULT_FUZZY_OPTIONS.items.threshold).toBe(0.75);
		});

		it("should have moderate threshold for brands", () => {
			expect(DEFAULT_FUZZY_OPTIONS.brands.threshold).toBe(0.85);
		});

		it("should have conservative threshold for units", () => {
			expect(DEFAULT_FUZZY_OPTIONS.units.threshold).toBe(0.9);
		});

		it("should have flexible threshold for stores", () => {
			expect(DEFAULT_FUZZY_OPTIONS.stores.threshold).toBe(0.8);
		});

		it("should have case insensitive matching by default", () => {
			expect(DEFAULT_FUZZY_OPTIONS.items.case_sensitive).toBe(false);
			expect(DEFAULT_FUZZY_OPTIONS.brands.case_sensitive).toBe(false);
			expect(DEFAULT_FUZZY_OPTIONS.units.case_sensitive).toBe(false);
			expect(DEFAULT_FUZZY_OPTIONS.stores.case_sensitive).toBe(false);
		});

		it("should have progressive strategy enabled by default", () => {
			expect(DEFAULT_FUZZY_OPTIONS.items.enable_progressive).toBe(true);
			expect(DEFAULT_FUZZY_OPTIONS.brands.enable_progressive).toBe(true);
			expect(DEFAULT_FUZZY_OPTIONS.units.enable_progressive).toBe(true);
			expect(DEFAULT_FUZZY_OPTIONS.stores.enable_progressive).toBe(true);
		});
	});

	describe("Edge Cases and Error Handling", () => {
		it("should handle very long strings", () => {
			const longString = "a".repeat(1000);
			const result = calculate_similarity(longString, longString + "b");

			expect(result).toBeCloseTo(0.999, 3);
		});

		it("should handle strings with special characters", () => {
			const result = calculate_similarity("café", "cafe");
			expect(result).toBeGreaterThan(0.5);
		});

		it("should handle empty string matching", () => {
			const result = progressive_match("test", [], DEFAULT_FUZZY_OPTIONS.items);
			expect(result.match).toBeNull();
			expect(result.confidence).toBe(0);
		});

		it("should maintain original input in result", () => {
			const result = match_brand("Kelloggs");
			expect(result.original_input).toBe("Kelloggs");
		});

		it("should handle Swedish diacritics properly", () => {
			const result = calculate_similarity("äpple", "apple");
			expect(result).toBeGreaterThan(0.5);
			expect(result).toBeLessThan(1.0);
		});

		it("should handle progressive matching order correctly", () => {
			const candidates = ["target"];
			const aliases = { alias: "target" };

			// Test that exact match takes precedence over alias
			const exactResult = progressive_match(
				"target",
				candidates,
				DEFAULT_FUZZY_OPTIONS.items,
				aliases,
			);
			expect(exactResult.match_type).toBe("exact");
			expect(exactResult.confidence).toBe(1.0);

			// Test that alias is used when exact match fails
			const aliasResult = progressive_match(
				"alias",
				candidates,
				DEFAULT_FUZZY_OPTIONS.items,
				aliases,
			);
			expect(aliasResult.match_type).toBe("alias");
			expect(aliasResult.confidence).toBe(0.95);
		});
	});

	describe("Performance and Scalability", () => {
		it("should handle large candidate arrays efficiently", () => {
			const largeCandidates = Array.from(
				{ length: 1000 },
				(_, i) => `item${i}`,
			);
			const result = progressive_match(
				"item500",
				largeCandidates,
				DEFAULT_FUZZY_OPTIONS.items,
			);

			expect(result.match).toBe("item500");
			expect(result.confidence).toBe(1.0);
		});

		it("should handle best case (early termination) for exact matches", () => {
			const candidates = ["target", "other1", "other2", "other3"];
			const result = progressive_match(
				"target",
				candidates,
				DEFAULT_FUZZY_OPTIONS.items,
			);

			expect(result.match_type).toBe("exact");
			expect(result.confidence).toBe(1.0);
		});
	});
});
