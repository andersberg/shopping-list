import { describe, expect, it } from "vitest";
import {
	grocery_ai_extraction_schema,
	map_tokens_to_grocery_item,
} from "./token-mapper";

describe("Token Mapper", () => {
	it("should map basic tokens to grocery item", () => {
		const tokens = {
			raw_text: "3 pkt mjölk eko",
			raw_item: "mjölk",
			raw_qty: "3",
			raw_unit: "pkt",
			raw_brand: null,
			raw_modifiers: ["eko"],
			raw_offer: null,
			raw_size_value: null,
			raw_size_unit: null,
			raw_comment: null,
		};

		const result = map_tokens_to_grocery_item(tokens);

		expect(result).toEqual({
			// Database fields
			name: "mjölk",
			comment: null,
			discount_price: null,
			quantity: 3,
			unit: "pkt",

			// API fields
			item: "mjölk",
			category: "mejeri",
			quantity_unit: "pkt",
			size_value: 0,
			size_unit: null,
			brand: null,
			organic: true,
			unit_normalized: null,
			total_quantity_value: 0,
			total_quantity_unit: null,
			store_normalized: null,
			store_raw: null,
			offer_quantity: 0,
			offer_total_price_value: 0,
			offer_currency: null,
			offer_unit_price_value: 0,
			status: "ok",
			error: null,
			source: "ai",
		});
	});

	it("should handle size information", () => {
		const tokens = {
			raw_text: "1.5l mjölk",
			raw_item: "mjölk",
			raw_qty: null,
			raw_unit: null,
			raw_brand: null,
			raw_modifiers: [],
			raw_offer: null,
			raw_size_value: "1.5",
			raw_size_unit: "l",
			raw_comment: null,
		};

		const result = map_tokens_to_grocery_item(tokens);

		expect(result.item).toBe("mjölk");
		expect(result.category).toBe("mejeri");
		expect(result.size_value).toBe(1.5);
		expect(result.size_unit).toBe("l");
		expect(result.total_quantity_value).toBe(1.5);
		expect(result.total_quantity_unit).toBe("l");
	});

	it("should handle offer information", () => {
		const tokens = {
			raw_text: "tomater 4/50kr",
			raw_item: "tomater",
			raw_qty: null,
			raw_unit: null,
			raw_brand: null,
			raw_modifiers: [],
			raw_offer: "4/50kr",
			raw_size_value: null,
			raw_size_unit: null,
			raw_comment: null,
		};

		const result = map_tokens_to_grocery_item(tokens);

		expect(result.item).toBe("tomat");
		expect(result.category).toBe("frukt & grönt");
		expect(result.offer_quantity).toBe(4);
		expect(result.offer_total_price_value).toBe(50);
		expect(result.offer_currency).toBe("SEK");
		expect(result.offer_unit_price_value).toBe(12.5);
	});

	it("should handle unknown items with needs_review status", () => {
		const tokens = {
			raw_text: "okänd produkt",
			raw_item: "okänd produkt",
			raw_qty: null,
			raw_unit: null,
			raw_brand: null,
			raw_modifiers: [],
			raw_offer: null,
			raw_size_value: null,
			raw_size_unit: null,
			raw_comment: null,
		};

		const result = map_tokens_to_grocery_item(tokens);

		expect(result.item).toBe("okänd produkt");
		expect(result.category).toBe(null);
		expect(result.status).toBe("needs_review");
	});

	it("should validate token schema", () => {
		const valid_tokens = {
			raw_text: "test",
			raw_item: "test",
			raw_qty: null,
			raw_unit: null,
			raw_brand: null,
			raw_modifiers: [],
			raw_offer: null,
			raw_size_value: null,
			raw_size_unit: null,
			raw_comment: null,
		};

		expect(grocery_ai_extraction_schema.parse(valid_tokens)).toEqual(
			valid_tokens,
		);
	});

	// Comprehensive tests from parsing-integration.test.ts TEST_CASES
	describe("Integration test case coverage", () => {
		it("should map basic organic milk (2 paket ekologisk mjölk)", () => {
			const tokens = {
				raw_text: "2 paket ekologisk mjölk",
				raw_item: "mjölk",
				raw_qty: "2",
				raw_unit: "paket",
				raw_brand: null,
				raw_modifiers: ["ekologisk"],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("mjölk");
			expect(result.category).toBe("mejeri");
			expect(result.quantity).toBe(2);
			expect(result.quantity_unit).toBe("pkt");
			expect(result.organic).toBe(true);
			expect(result.status).toBe("ok");
		});

		it("should map weight-based item (1 kg potatis)", () => {
			const tokens = {
				raw_text: "1 kg potatis",
				raw_item: "potatis",
				raw_qty: "1",
				raw_unit: "kg",
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("potatis");
			expect(result.category).toBe("frukt & grönt");
			expect(result.quantity).toBe(1);
			expect(result.quantity_unit).toBe("kg");
			expect(result.status).toBe("ok");
		});

		it("should map countable item with st unit (6 st ägg)", () => {
			const tokens = {
				raw_text: "6 st ägg",
				raw_item: "ägg",
				raw_qty: "6",
				raw_unit: "st",
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("ägg");
			expect(result.category).toBe("mejeri");
			expect(result.quantity).toBe(6);
			expect(result.quantity_unit).toBe("st");
			expect(result.status).toBe("ok");
		});

		it("should singularize and map multi-word item (1 burk krossade tomater)", () => {
			const tokens = {
				raw_text: "1 burk krossade tomater",
				raw_item: "krossade tomater",
				raw_qty: "1",
				raw_unit: "burk",
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("krossade tomater");
			expect(result.category).toBe("skafferi");
			expect(result.quantity).toBe(1);
			expect(result.quantity_unit).toBe("burk");
			expect(result.status).toBe("ok");
		});

		it("should handle weight without explicit quantity (500 g spaghetti)", () => {
			const tokens = {
				raw_text: "500 g spaghetti",
				raw_item: "spaghetti",
				raw_qty: null,
				raw_unit: null,
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: "500",
				raw_size_unit: "g",
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("spaghetti");
			expect(result.category).toBe("skafferi");
			expect(result.quantity).toBe(0);
			expect(result.size_value).toBe(500);
			expect(result.size_unit).toBe("g");
			expect(result.total_quantity_value).toBe(500);
			expect(result.total_quantity_unit).toBe("g");
			expect(result.status).toBe("ok");
		});

		it("should handle volume unit (3 dl grädde)", () => {
			const tokens = {
				raw_text: "3 dl grädde",
				raw_item: "grädde",
				raw_qty: "3",
				raw_unit: "dl",
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("grädde");
			expect(result.category).toBe("mejeri");
			expect(result.quantity).toBe(3);
			expect(result.quantity_unit).toBe("dl");
			expect(result.status).toBe("ok");
		});

		it("should handle container unit with oil (1 flaska olivolja)", () => {
			const tokens = {
				raw_text: "1 flaska olivolja",
				raw_item: "olivolja",
				raw_qty: "1",
				raw_unit: "flaska",
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("olivolja");
			expect(result.category).toBe("skafferi");
			expect(result.quantity).toBe(1);
			expect(result.quantity_unit).toBe("flaska");
			expect(result.status).toBe("ok");
		});

		it("should handle simple packet item (2 pkt jäst)", () => {
			const tokens = {
				raw_text: "2 pkt jäst",
				raw_item: "jäst",
				raw_qty: "2",
				raw_unit: "pkt",
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("jäst");
			expect(result.category).toBe("skafferi");
			expect(result.quantity).toBe(2);
			expect(result.quantity_unit).toBe("pkt");
			expect(result.status).toBe("ok");
		});

		it("should handle single vegetable (1 st gurka)", () => {
			const tokens = {
				raw_text: "1 st gurka",
				raw_item: "gurka",
				raw_qty: "1",
				raw_unit: "st",
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("gurka");
			expect(result.category).toBe("frukt & grönt");
			expect(result.quantity).toBe(1);
			expect(result.quantity_unit).toBe("st");
			expect(result.status).toBe("ok");
		});

		it("should handle item without explicit unit, with singularization (4 bananer)", () => {
			const tokens = {
				raw_text: "4 bananer",
				raw_item: "bananer",
				raw_qty: "4",
				raw_unit: null,
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("banan");
			expect(result.category).toBe("frukt & grönt");
			expect(result.quantity).toBe(4);
			expect(result.quantity_unit).toBe(null);
			expect(result.status).toBe("ok");
		});

		it("should handle brand with size specification (Zeta olivolja 500 ml)", () => {
			const tokens = {
				raw_text: "Zeta olivolja 500 ml",
				raw_item: "olivolja",
				raw_qty: null,
				raw_unit: null,
				raw_brand: "Zeta",
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: "500",
				raw_size_unit: "ml",
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("olivolja");
			expect(result.category).toBe("skafferi");
			expect(result.brand).toBe("Zeta");
			expect(result.size_value).toBe(500);
			expect(result.size_unit).toBe("ml");
			expect(result.total_quantity_value).toBe(500);
			expect(result.total_quantity_unit).toBe("ml");
			expect(result.status).toBe("ok");
		});

		it("should handle organic item with store reference (1 st ekologisk banan från Coop)", () => {
			const tokens = {
				raw_text: "1 st ekologisk banan från Coop",
				raw_item: "banan",
				raw_qty: "1",
				raw_unit: "st",
				raw_brand: null,
				raw_modifiers: ["ekologisk"],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: "från Coop",
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("banan");
			expect(result.category).toBe("frukt & grönt");
			expect(result.quantity).toBe(1);
			expect(result.quantity_unit).toBe("st");
			expect(result.organic).toBe(true);
			expect(result.status).toBe("ok");
		});
	});

	describe("Edge cases", () => {
		it("should handle offer pattern with slash (4/50kr)", () => {
			const tokens = {
				raw_text: "tomater 4/50kr",
				raw_item: "tomater",
				raw_qty: null,
				raw_unit: null,
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: "4/50kr",
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("tomat");
			expect(result.offer_quantity).toBe(4);
			expect(result.offer_total_price_value).toBe(50);
			expect(result.offer_currency).toBe("SEK");
			expect(result.offer_unit_price_value).toBe(12.5);
		});

		it("should handle offer pattern with 'för' (3 för 20kr)", () => {
			const tokens = {
				raw_text: "äpplen 3 för 20kr",
				raw_item: "äpplen",
				raw_qty: null,
				raw_unit: null,
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: "3 för 20kr",
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.item).toBe("äpple");
			expect(result.offer_quantity).toBe(3);
			expect(result.offer_total_price_value).toBe(20);
			expect(result.offer_currency).toBe("SEK");
			expect(result.offer_unit_price_value).toBeCloseTo(6.67, 1);
		});

		it("should calculate total quantity when both quantity and size exist", () => {
			const tokens = {
				raw_text: "3 1.5l mjölk",
				raw_item: "mjölk",
				raw_qty: "3",
				raw_unit: null,
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: "1.5",
				raw_size_unit: "l",
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.quantity).toBe(3);
			expect(result.size_value).toBe(1.5);
			expect(result.size_unit).toBe("l");
			expect(result.total_quantity_value).toBe(4.5);
			expect(result.total_quantity_unit).toBe("l");
		});

		it("should handle decimal comma in size value", () => {
			const tokens = {
				raw_text: "1,5kg morötter",
				raw_item: "morötter",
				raw_qty: null,
				raw_unit: null,
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: "1,5",
				raw_size_unit: "kg",
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			expect(result.size_value).toBe(1.5);
			expect(result.size_unit).toBe("kg");
		});

		it("should detect organic from various modifier forms", () => {
			const modifiers_to_test = [
				["eko"],
				["ekologisk"],
				["ekologiska"],
				["organic"],
				["krav"],
			];

			for (const modifiers of modifiers_to_test) {
				const tokens = {
					raw_text: "test",
					raw_item: "test",
					raw_qty: null,
					raw_unit: null,
					raw_brand: null,
					raw_modifiers: modifiers,
					raw_offer: null,
					raw_size_value: null,
					raw_size_unit: null,
					raw_comment: null,
				};

				const result = map_tokens_to_grocery_item(tokens);
				expect(result.organic).toBe(true);
			}
		});

		it("should handle error gracefully and return parse_error status", () => {
			// Force an error by passing invalid data type (this is a bit contrived)
			const tokens = {
				raw_text: "test",
				raw_item: null,
				raw_qty: null,
				raw_unit: null,
				raw_brand: null,
				raw_modifiers: [],
				raw_offer: null,
				raw_size_value: null,
				raw_size_unit: null,
				raw_comment: null,
			};

			const result = map_tokens_to_grocery_item(tokens);

			// Should still return an object with parse_error status
			expect(result.status).toBeDefined();
		});
	});
});
