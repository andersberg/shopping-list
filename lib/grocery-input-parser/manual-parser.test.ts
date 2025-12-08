import { describe, expect, it } from "vitest";
import { parse_grocery_line } from "./manual-parser";

describe("ManualParser", () => {
	it("parses complex line: 3 pkt 1,5l mjölk eko arla 4/50kr ica", () => {
		const input = "3 pkt 1,5l mjölk eko arla 4/50kr ica";
		const result = parse_grocery_line(input);

		expect(result).toMatchObject({
			status: "ok",
			item: "mjölk",
			quantity: 3,
			quantity_unit: "pkt",
			size_value: 1.5,
			size_unit: "l",
			brand: "Arla", // Canonical casing
			organic: true,
			store_normalized: "ica",
			offer_quantity: 4,
			offer_total_price_value: 50,
		});
		// total quantity = 3 * 1.5 = 4.5
		expect(result.total_quantity_value).toBe(4.5);
		expect(result.total_quantity_unit).toBe("l");
	});

	it("parses simple line: tomater eko svenska 4/50kr", () => {
		const input = "tomater eko svenska 4/50kr";
		const result = parse_grocery_line(input);

		expect(result).toMatchObject({
			status: "ok", // Item found, defaulted quantity
			item: "tomater",
			organic: true,
			quantity: 1, // Defaulted to 1
			offer_quantity: 4,
			offer_total_price_value: 50,
			comment: "svenska",
		});
	});

	it("parses line with brand: 1 påse chips sourcream garant willys", () => {
		const input = "1 påse chips sourcream garant willys";
		const result = parse_grocery_line(input);

		expect(result).toMatchObject({
			status: "ok",
			quantity: 1,
			quantity_unit: "påse",
			item: "chips",
			brand: "Garant", // Canonical casing
			store_normalized: "willys",
			comment: "sourcream",
		});
	});

	it("parses offer: 3 för 20kr", () => {
		const input = "3 för 20kr";
		const result = parse_grocery_line(input);

		expect(result).toMatchObject({
			offer_quantity: 3,
			offer_total_price_value: 20,
		});
	});

	it("parses lone price: 299kr", () => {
		const input = "299kr";
		const result = parse_grocery_line(input);

		expect(result).toMatchObject({
			offer_total_price_value: 299,
			offer_quantity: 0,
		});
	});

	it("parses basic item: mjölk", () => {
		const input = "mjölk";
		const result = parse_grocery_line(input);

		expect(result).toMatchObject({
			status: "ok", // Defaulted to OK
			item: "mjölk",
			quantity: 1, // Defaulted to 1
			quantity_unit: "st", // Defaulted to st
		});
	});

	it("parses stuck unit: 1.5kg potatis", () => {
		const input = "1.5kg potatis";
		const result = parse_grocery_line(input);

		// 1.5kg -> 1.5 kg -> size or quantity?
		// kg is in QUANTITY_UNITS (kilo) and SIZE_UNITS.
		// Decimal -> size preference in my logic.
		expect(result).toMatchObject({
			item: "potatis",
			size_value: 1.5,
			size_unit: "kg",
			quantity: 0,
		});
		expect(result.total_quantity_value).toBe(1.5);
	});

	it("returns parse_error if no item found", () => {
		const input = "400 500"; // Random numbers
		const result = parse_grocery_line(input);

		expect(result.status).toBe("parse_error");
		expect(result.error).toBe("No item candidate found");
	});
});
