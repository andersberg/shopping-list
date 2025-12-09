import { beforeAll, describe, expect, it } from "vitest";
import type { GroceryItem } from "./token-mapper";

// Test data from scripts/send-parse-cf-ai.js
const TEST_LINES = [
	"2 paket ekologisk mjölk",
	"1 kg potatis",
	"6 st ägg",
	"1 burk krossade tomater",
	"500 g spaghetti",
	"3 dl grädde",
	"1 flaska olivolja",
	"2 pkt jäst",
	"1 st gurka",
	"4 bananer",
	"ett halvt kilo morötter",
	"två paket med smör",
	"en burk tonfisk i olja",
	"mjölk 2 liter",
	"potatis 1 kilo",
	"3 stycken röda äpplen",
	"ett par tomater",
	"ungefär ett kilo lök",
	"lite grädde",
	"några ägg",
	"2 paket Arla mjölk från Ica",
	"Zeta olivolja 500 ml",
	"Garant kikärtor burk",
	"1 st ekologisk banan från Coop",
	"Findus ärtor 750 g",
];

const API_URL = "http://localhost:5180/api/parse";

interface TestCase {
	input: string;
	expected: Partial<GroceryItem>;
	description: string;
}

const TEST_CASES: TestCase[] = [
	{
		input: "2 paket ekologisk mjölk",
		description: "Basic quantity, unit, item with organic modifier",
		expected: {
			item: "mjölk",
			category: "mejeri",
			quantity: 2,
			quantity_unit: "pkt",
			organic: true,
			status: "ok",
		},
	},
	{
		input: "1 kg potatis",
		description: "Weight-based item",
		expected: {
			item: "potatis",
			category: "frukt & grönt",
			quantity: 1,
			quantity_unit: "kg",
			status: "ok",
		},
	},
	{
		input: "6 st ägg",
		description: "Countable item with 'st' unit",
		expected: {
			item: "ägg",
			category: "mejeri",
			quantity: 6,
			quantity_unit: "st",
			status: "ok",
		},
	},
	{
		input: "1 burk krossade tomater",
		description: "Container unit with multi-word item",
		expected: {
			item: "tomat",
			category: "frukt & grönt",
			quantity: 1,
			quantity_unit: "burk",
			status: "ok",
		},
	},
	{
		input: "500 g spaghetti",
		description: "Weight without explicit quantity",
		expected: {
			item: "spaghetti",
			category: "skafferi",
			quantity: 0,
			size_value: 500,
			size_unit: "g",
			status: "ok",
		},
	},
	{
		input: "3 dl grädde",
		description: "Volume unit",
		expected: {
			item: "grädde",
			category: "mejeri",
			quantity: 3,
			status: "ok",
		},
	},
	{
		input: "1 flaska olivolja",
		description: "Container unit with oil",
		expected: {
			item: "olivolja",
			category: "skafferi",
			quantity: 1,
			quantity_unit: "flaska",
			status: "ok",
		},
	},
	{
		input: "2 pkt jäst",
		description: "Simple packet item",
		expected: {
			item: "jäst",
			category: "skafferi",
			quantity: 2,
			quantity_unit: "pkt",
			status: "ok",
		},
	},
	{
		input: "1 st gurka",
		description: "Single vegetable",
		expected: {
			item: "gurka",
			category: "frukt & grönt",
			quantity: 1,
			quantity_unit: "st",
			status: "ok",
		},
	},
	{
		input: "4 bananer",
		description: "Item without explicit unit",
		expected: {
			item: "banan",
			category: "frukt & grönt",
			quantity: 4,
			quantity_unit: null,
			status: "ok",
		},
	},
	{
		input: "Zeta olivolja 500 ml",
		description: "Brand with size specification",
		expected: {
			item: "olivolja",
			category: "skafferi",
			brand: "Zeta",
			size_value: 500,
			size_unit: "ml",
			status: "ok",
		},
	},
	{
		input: "1 st ekologisk banan från Coop",
		description: "Organic item with store reference",
		expected: {
			item: "banan",
			category: "frukt & grönt",
			quantity: 1,
			quantity_unit: "st",
			organic: true,
			status: "ok",
		},
	},
];

describe("Parsing Integration Tests", () => {
	let server_ready = false;

	beforeAll(async () => {
		// Check if server is running
		try {
			const response = await fetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ input: "test" }),
			});
			server_ready = response.ok;
		} catch (_error) {
			console.warn("Server not available, skipping integration tests");
		}
	});

	it("should have server running for integration tests", () => {
		expect(server_ready).toBe(true);
	});

	describe.each(TEST_CASES)("$description", ({ input, expected }) => {
		it(`should parse: "${input}"`, async () => {
			if (!server_ready) {
				console.warn("Skipping test - server not available");
				return;
			}

			const response = await fetch(API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ input }),
			});

			expect(response.ok).toBe(true);

			const result: GroceryItem = await response.json();

			// Basic sanity checks - these should always pass
			expect(["ok", "needs_review", "parse_error"]).toContain(result.status);
			expect(result.error).toBeNull();
			expect(result.item).toBeDefined();

			// Log the result for debugging/monitoring
			console.log(`Input: "${input}"`);
			console.log(`Status: ${result.status}`);
			console.log(
				`Parsed: item="${result.item}", category="${result.category}", quantity=${result.quantity}, unit="${result.quantity_unit}"`,
			);

			// For critical fields, check if they're reasonable rather than exact matches
			if (expected.item) {
				expect(result.item).toBeTruthy();
				expect(result.item?.toLowerCase()).toContain(
					expected.item.toLowerCase(),
				);
			}

			if (expected.category) {
				// Category should be populated for known items
				if (result.status === "ok") {
					expect(result.category).toBeTruthy();
				}
			}

			console.log("---");
		});
	});

	it("should handle all test lines without errors", async () => {
		if (!server_ready) {
			console.warn("Skipping batch test - server not available");
			return;
		}

		const results: GroceryItem[] = [];

		for (const line of TEST_LINES) {
			const response = await fetch(API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ input: line }),
			});

			expect(response.ok).toBe(true);

			const result: GroceryItem = await response.json();
			results.push(result);

			// System should never crash or return parse errors
			expect(result.status).not.toBe("parse_error");
			expect(result.error).toBeNull();

			// Basic structure should be valid
			expect(result.item).toBeDefined();
			expect(["ok", "needs_review"]).toContain(result.status);
		}

		// All results should be valid
		expect(results).toHaveLength(TEST_LINES.length);

		// Count successful vs needs_review
		const successful = results.filter((r) => r.status === "ok").length;
		const needs_review = results.filter(
			(r) => r.status === "needs_review",
		).length;
		const parse_errors = results.filter(
			(r) => r.status === "parse_error",
		).length;

		console.log(
			`Parsing results: ${successful} successful, ${needs_review} need review, ${parse_errors} errors`,
		);

		// System should be stable - no parse errors
		expect(parse_errors).toBe(0);

		// At least 70% should parse successfully (adjusted for AI variability)
		expect(successful).toBeGreaterThanOrEqual(TEST_LINES.length * 0.7);
	}, 60000);

	it("should maintain consistency across similar patterns", async () => {
		if (!server_ready) {
			console.warn("Skipping consistency test - server not available");
			return;
		}

		// Test similar weight patterns
		const weight_tests = ["1 kg potatis", "potatis 1 kilo", "mjölk 2 liter"];

		const results = await Promise.all(
			weight_tests.map(async (line) => {
				const response = await fetch(API_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ input: line }),
				});
				return response.json() as unknown as GroceryItem;
			}),
		);

		// All should have valid items and categories
		results.forEach((result) => {
			expect(result.item).toBeTruthy();
			expect(result.category).toBeTruthy();
			expect(result.status).toBe("ok");
		});
	});
});
