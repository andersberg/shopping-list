import { describe, it, expect } from "vitest";
import { GroceryAiExtractionSchema, map_tokens_to_grocery_item } from "./token-mapper";

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

    expect(GroceryAiExtractionSchema.parse(valid_tokens)).toEqual(valid_tokens);
  });
});