import { describe, expect, it } from "vitest";
import {
	normalize_string,
	normalize_decimal,
	normalize_unit,
	canonicalize_item,
	map_item_to_category,
	normalize_brand,
	parse_offer,
	extract_store_from_text,
	extract_organic,
	apply_default_quantity,
	determine_parse_status,
} from "./grocery-item-services";

describe("Domain Services - Text Normalization", () => {
	describe("normalize_string", () => {
		it("should normalize basic text", () => {
			const result = normalize_string("  Mjölk  ");
			expect(result.status).toBe("success");
			expect(result.data).toBe("mjölk");
		});

		it("should handle null input", () => {
			const result = normalize_string(null);
			expect(result.status).toBe("success");
			expect(result.data).toBeNull();
		});

		it("should handle empty string", () => {
			const result = normalize_string("");
			expect(result.status).toBe("success");
			expect(result.data).toBe("");
		});

		it("should normalize whitespace", () => {
			const result = normalize_string("  ekologisk   mjölk  ");
			expect(result.status).toBe("success");
			expect(result.data).toBe("ekologisk mjölk");
		});

		it("should handle unicode characters", () => {
			const result = normalize_string("ÅKA FÖR PÅGEN");
			expect(result.status).toBe("success");
			expect(result.data).toBe("åka för pågen");
		});
	});

	describe("normalize_decimal", () => {
		it("should parse basic decimal", () => {
			const result = normalize_decimal("2.5");
			expect(result.status).toBe("success");
			expect(result.data).toBe(2.5);
		});

		it("should handle comma as decimal separator", () => {
			const result = normalize_decimal("2,5");
			expect(result.status).toBe("success");
			expect(result.data).toBe(2.5);
		});

		it("should handle null input", () => {
			const result = normalize_decimal(null);
			expect(result.status).toBe("success");
			expect(result.data).toBe(0);
		});

		it("should handle empty string", () => {
			const result = normalize_decimal("");
			expect(result.status).toBe("success");
			expect(result.data).toBe(0);
		});

		it("should handle invalid input", () => {
			const result = normalize_decimal("abc");
			expect(result.status).toBe("success");
			expect(result.data).toBe(0);
		});

		it("should handle integer input", () => {
			const result = normalize_decimal("3");
			expect(result.status).toBe("success");
			expect(result.data).toBe(3);
		});
	});
});

describe("Domain Services - Item Classification", () => {
	describe("canonicalize_item", () => {
		it("should canonicalize known items", () => {
			const result = canonicalize_item("mjölk");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				canonical: "mjölk",
				category: "mejeri",
			});
		});

		it("should singularize plural items", () => {
			const result = canonicalize_item("bananer");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				canonical: "banan",
				category: "frukt & grönt",
			});
		});

		it("should handle unknown items", () => {
			const result = canonicalize_item("okänd produkt");
			expect(result.status).toBe("warning");
			expect(result.message).toBe("Unknown item: okänd produkt");
			expect(result.data).toEqual({
				canonical: "okänd produkt",
				category: null,
			});
		});

		it("should handle null input", () => {
			const result = canonicalize_item(null);
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				canonical: null,
				category: null,
			});
		});

		it("should handle multi-word items", () => {
			const result = canonicalize_item("krossade tomater");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				canonical: "krossade tomater",
				category: "skafferi",
			});
		});

		it("should handle plural multi-word items", () => {
			const result = canonicalize_item("morötter");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				canonical: "morot",
				category: "frukt & grönt",
			});
		});
	});

	describe("map_item_to_category", () => {
		it("should map known item to category", () => {
			const result = map_item_to_category("mjölk");
			expect(result.status).toBe("success");
			expect(result.data).toBe("mejeri");
		});

		it("should handle unknown item", () => {
			const result = map_item_to_category("okänd produkt");
			expect(result.status).toBe("warning");
			expect(result.message).toBe("Unknown category for: okänd produkt");
			expect(result.data).toBeNull();
		});

		it("should handle null input", () => {
			const result = map_item_to_category(null);
			expect(result.status).toBe("success");
			expect(result.data).toBeNull();
		});

		it("should map singularized items", () => {
			const result = map_item_to_category("tomater");
			expect(result.status).toBe("success");
			expect(result.data).toBe("frukt & grönt");
		});
	});
});

describe("Domain Services - Unit Management", () => {
	describe("normalize_unit", () => {
		it("should normalize common unit variations", () => {
			const result = normalize_unit("paket");
			expect(result.status).toBe("success");
			expect(result.data).toBe("pkt");
		});

		it("should handle normalization variations", () => {
			const result = normalize_unit("förpackning");
			expect(result.status).toBe("success");
			expect(result.data).toBe("fp");
		});

		it("should return original unit if no normalization needed", () => {
			const result = normalize_unit("kg");
			expect(result.status).toBe("success");
			expect(result.data).toBe("kg");
		});

		it("should handle null input", () => {
			const result = normalize_unit(null);
			expect(result.status).toBe("success");
			expect(result.data).toBeNull();
		});

		it("should handle empty string", () => {
			const result = normalize_unit("");
			expect(result.status).toBe("success");
			expect(result.data).toBeNull();
		});

		it("should handle unknown units", () => {
			const result = normalize_unit("unknown_unit");
			expect(result.status).toBe("warning");
			expect(result.message).toBe("Unknown unit: unknown_unit");
			expect(result.data).toBe("unknown_unit");
		});
	});
});

describe("Domain Services - Brand Processing", () => {
	describe("normalize_brand", () => {
		it("should normalize known brands with proper casing", () => {
			const result = normalize_brand("arla");
			expect(result.status).toBe("success");
			expect(result.data).toBe("Arla");
		});

		it("should handle already properly cased brands", () => {
			const result = normalize_brand("Arla");
			expect(result.status).toBe("success");
			expect(result.data).toBe("Arla");
		});

		it("should return null for unknown brands", () => {
			const result = normalize_brand("okänt märke");
			expect(result.status).toBe("warning");
			expect(result.message).toBe("Unknown brand: okänt märke");
			expect(result.data).toBeNull();
		});

		it("should handle null input", () => {
			const result = normalize_brand(null);
			expect(result.status).toBe("success");
			expect(result.data).toBeNull();
		});

		it("should handle brands with special characters", () => {
			const result = normalize_brand("kelloggs");
			expect(result.status).toBe("success");
			expect(result.data).toBe("Kellogg's");
		});
	});
});

describe("Domain Services - Offer Analysis", () => {
	describe("parse_offer", () => {
		it("should parse slash notation offer", () => {
			const result = parse_offer("4/50kr");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 4,
				price: 50,
				currency: "kr",
			});
		});

		it("should parse 'för' notation offer", () => {
			const result = parse_offer("3 för 20kr");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 3,
				price: 20,
				currency: "kr",
			});
		});

		it("should handle decimal prices", () => {
			const result = parse_offer("2/29,90kr");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 2,
				price: 29.9,
				currency: "kr",
			});
		});

		it("should handle null input", () => {
			const result = parse_offer(null);
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 0,
				price: 0,
				currency: "kr",
			});
		});

		it("should handle empty string", () => {
			const result = parse_offer("");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 0,
				price: 0,
				currency: "kr",
			});
		});

		it("should handle invalid offer format", () => {
			const result = parse_offer("invalid offer");
			expect(result.status).toBe("warning");
			expect(result.message).toBe("Invalid offer format: invalid offer");
			expect(result.data).toEqual({
				quantity: 0,
				price: 0,
				currency: "kr",
			});
		});

		it("should handle offers with spaces", () => {
			const result = parse_offer("4 / 50 kr");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 4,
				price: 50,
				currency: "kr",
			});
		});
	});
});

describe("Domain Services - Store Detection", () => {
	describe("extract_store_from_text", () => {
		it("should extract store from text", () => {
			const result = extract_store_from_text("1 st ekologisk banan från Coop");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				store_normalized: "coop",
				store_raw: "coop",
			});
		});

		it("should handle store names with mixed case", () => {
			const result = extract_store_from_text("handel från ICA");
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				store_normalized: "ica",
				store_raw: "ica",
			});
		});

		it("should handle text without store", () => {
			const result = extract_store_from_text("2 flaskor mjölk");
			expect(result.status).toBe("warning");
			expect(result.message).toBe("No store found in text");
			expect(result.data).toEqual({
				store_normalized: null,
				store_raw: null,
			});
		});

		it("should handle null input", () => {
			const result = extract_store_from_text(null as any);
			expect(result.status).toBe("error");
			expect(result.message).toBe("Input text cannot be null");
			expect(result.data).toBeNull();
		});

		it("should handle empty string", () => {
			const result = extract_store_from_text("");
			expect(result.status).toBe("warning");
			expect(result.message).toBe("No store found in text");
			expect(result.data).toEqual({
				store_normalized: null,
				store_raw: null,
			});
		});
	});
});

describe("Domain Services - Property Detection", () => {
	describe("extract_organic", () => {
		it("should detect organic from modifiers", () => {
			const result = extract_organic(["ekologisk", "laktosfri"]);
			expect(result).toBe(true);
		});

		it("should detect organic from various forms", () => {
			expect(extract_organic(["eko"])).toBe(true);
			expect(extract_organic(["ekologiska"])).toBe(true);
			expect(extract_organic(["krav"])).toBe(true);
			expect(extract_organic(["organic"])).toBe(true);
		});

		it("should return false for non-organic modifiers", () => {
			const result = extract_organic(["laktosfri", "glutenfri"]);
			expect(result).toBe(false);
		});

		it("should return false for empty modifiers", () => {
			const result = extract_organic([]);
			expect(result).toBe(false);
		});

		it("should be case insensitive", () => {
			const result = extract_organic(["EKOLOGISK"]);
			expect(result).toBe(true);
		});
	});
});

describe("Domain Services - Business Rules", () => {
	describe("apply_default_quantity", () => {
		it("should apply default quantity when missing", () => {
			const result = apply_default_quantity("mjölk", 0, null, 0);
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 1,
				quantity_unit: "st",
			});
		});

		it("should preserve existing quantity when present", () => {
			const result = apply_default_quantity("mjölk", 2, "flaskor", 1);
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 2,
				quantity_unit: "flaskor",
			});
		});

		it("should handle null item", () => {
			const result = apply_default_quantity(null, 0, null, 0);
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 0,
				quantity_unit: null,
			});
		});

		it("should preserve size-based quantities", () => {
			const result = apply_default_quantity("mjölk", 0, null, 1.5);
			expect(result.status).toBe("success");
			expect(result.data).toEqual({
				quantity: 0,
				quantity_unit: null,
			});
		});
	});

	describe("determine_parse_status", () => {
		it("should return error status when errors exist", () => {
			const result = determine_parse_status("mjölk", "mejeri", true);
			expect(result).toBe("error");
		});

		it("should return error status when item is missing", () => {
			const result = determine_parse_status(null, "mejeri", false);
			expect(result).toBe("error");
		});

		it("should return partial status when category is missing", () => {
			const result = determine_parse_status("mjölk", null, false);
			expect(result).toBe("partial");
		});

		it("should return success status when all data is present", () => {
			const result = determine_parse_status("mjölk", "mejeri", false);
			expect(result).toBe("success");
		});

		it("should return error status when both item and category are missing", () => {
			const result = determine_parse_status(null, null, false);
			expect(result).toBe("error");
		});
	});
});
