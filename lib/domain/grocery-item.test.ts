import { describe, expect, it } from "vitest";
import { grocery_item_schema, GroceryItem } from "./grocery-item";
import {
  Brand,
  Category,
  ContainerUnit,
  create_brand,
  create_category,
  create_container_unit,
  create_item_canonical,
  create_property,
  create_store,
  ItemCanonical,
  Property,
  Store,
} from "./value-objects";

describe("Domain Logic - Value Objects", () => {
  describe("create_container_unit", () => {
    it("should create valid container units", () => {
      const valid_units = ["burkar", "flaskor", "st", "paket"];
      valid_units.forEach((unit) => {
        const result = create_container_unit(unit);
        expect(result).toBe(unit);
        expect(typeof result).toBe("string");
      });
    });

    it("should reject empty strings", () => {
      expect(() => create_container_unit("")).toThrow(
        "Container unit cannot be empty",
      );
    });

    it("should reject whitespace-only strings", () => {
      expect(() => create_container_unit("   ")).toThrow(
        "Container unit cannot be empty",
      );
    });

    it("should handle unicode characters", () => {
      const result = create_container_unit("burkar");
      expect(result).toBe("burkar");
    });
  });

  describe("create_store", () => {
    it("should create valid store names", () => {
      const valid_stores = ["ICA", "Coop", "Willys", "Axfood"];
      valid_stores.forEach((store) => {
        const result = create_store(store);
        expect(result).toBe(store);
        expect(typeof result).toBe("string");
      });
    });

    it("should reject empty store names", () => {
      expect(() => create_store("")).toThrow("Store name cannot be empty");
    });

    it("should handle store names with spaces", () => {
      const result = create_store("ICA Maxi");
      expect(result).toBe("ICA Maxi");
    });
  });

  describe("create_brand", () => {
    it("should create valid brand names", () => {
      const valid_brands = ["Arla", "Oatly", "Barilla"];
      valid_brands.forEach((brand) => {
        const result = create_brand(brand);
        expect(result).toBe(brand);
        expect(typeof result).toBe("string");
      });
    });

    it("should reject empty brand names", () => {
      expect(() => create_brand("")).toThrow("Brand name cannot be empty");
    });

    it("should handle brand names with special characters", () => {
      const result = create_brand("Kellogg's");
      expect(result).toBe("Kellogg's");
    });
  });

  describe("create_property", () => {
    it("should create valid properties", () => {
      const valid_properties = ["ekologisk", "färsk", "laktosfri"];
      valid_properties.forEach((property) => {
        const result = create_property(property);
        expect(result).toBe(property);
        expect(typeof result).toBe("string");
      });
    });

    it("should reject empty properties", () => {
      expect(() => create_property("")).toThrow("Property cannot be empty");
    });

    it("should handle compound properties", () => {
      const result = create_property("extra virgin");
      expect(result).toBe("extra virgin");
    });
  });

  describe("create_category", () => {
    it("should create valid categories", () => {
      const valid_categories = ["mejeri", "frukt & grönt", "kött & fisk"];
      valid_categories.forEach((category) => {
        const result = create_category(category);
        expect(result).toBe(category);
        expect(typeof result).toBe("string");
      });
    });

    it("should reject empty categories", () => {
      expect(() => create_category("")).toThrow("Category cannot be empty");
    });
  });

  describe("create_item_canonical", () => {
    it("should create valid canonical item names", () => {
      const valid_items = ["mjölk", "bröd", "ägg"];
      valid_items.forEach((item) => {
        const result = create_item_canonical(item);
        expect(result).toBe(item);
        expect(typeof result).toBe("string");
      });
    });

    it("should reject empty item names", () => {
      expect(() => create_item_canonical("")).toThrow(
        "Item canonical cannot be empty",
      );
    });

    it("should handle item names with spaces", () => {
      const result = create_item_canonical("gräddfil naturell");
      expect(result).toBe("gräddfil naturell");
    });
  });
});

describe("Domain Logic - Schemas", () => {
  describe("grocery_item_schema", () => {
    const create_test_grocery_item = (overrides = {}): any => {
      return {
        // Required metadata
        original_input: "test input",
        parse_status: "success" as const,
        parse_error: null,
        parse_source: "manual" as const,
        item: "test item",

        // Core product data
        item_canonical: "test item",
        category: "test category",
        brand: "Test Brand",

        // Purchase intent with defaults
        purchase_quantity: 1,
        purchase_unit: "st",

        // Item specification with defaults
        item_size: 1,
        item_unit: "st" as const,

        // Additional details with defaults
        properties: [],
        stores: [],
        comment: null,
        offer: null,

        ...overrides,
      };
    };

    it("should validate complete grocery item", () => {
      const valid_item = create_test_grocery_item({
        original_input: "2 flaskor mjölk arla 1.5 l",
        item_canonical: "mjölk",
        category: "mejeri",
        purchase_quantity: 2,
        purchase_unit: "flaskor",
        item_size: 1.5,
        item_unit: "l" as const,
        properties: ["ekologisk"],
        stores: ["ICA"],
        brand: "Arla",
        offer: null,
      });

      const result = grocery_item_schema.parse(valid_item);

      expect(result.original_input).toBe("2 flaskor mjölk arla 1.5 l");
      expect(result.item_canonical).toBe("mjölk");
      expect(result.category).toBe("mejeri");
      expect(result.brand).toBe("Arla");
      expect(result.properties).toEqual(["ekologisk"]);
      expect(result.stores).toEqual(["ICA"]);
      expect(result.purchase_quantity).toBe(2);
      expect(result.purchase_unit).toBe("flaskor");
      expect(result.item_size).toBe(1.5);
      expect(result.item_unit).toBe("l");
    });

    it("should apply default values automatically", () => {
      const minimal_item = {
        // Required metadata
        original_input: "mjölk",
        parse_status: "success" as const,
        parse_error: null,
        parse_source: "manual" as const,
        item: "mjölk",

        // Core product data
        item_canonical: "mjölk",
        category: "mejeri",
        brand: null,
      };

      const result = grocery_item_schema.parse(minimal_item);

      expect(result.purchase_quantity).toBe(1);
      expect(result.purchase_unit).toBe("st");
      expect(result.item_size).toBe(1);
      expect(result.item_unit).toBe("st");
      expect(result.properties).toEqual([]);
      expect(result.stores).toEqual([]);
      expect(result.offer).toBeNull();
    });

    it("should accept null values for optional fields", () => {
      const item_with_nulls = create_test_grocery_item({
        brand: null,
        comment: null,
        offer: null,
      });

      const result = grocery_item_schema.parse(item_with_nulls);
      expect(result.brand).toBeNull();
      expect(result.comment).toBeNull();
      expect(result.offer).toBeNull();
    });

    it("should reject invalid required fields", () => {
      const invalid_item = {
        // Missing required field 'item'
        original_input: "test",
        parse_status: "success" as const,
        parse_error: null,
        parse_source: "manual" as const,
      };

      expect(() => grocery_item_schema.parse(invalid_item)).toThrow();
    });

    it("should validate enum constraints", () => {
      const item_with_invalid_status = create_test_grocery_item({
        parse_status: "invalid_status" as any, // Not in PARSE_STATUS enum
      });

      expect(() =>
        grocery_item_schema.parse(item_with_invalid_status),
      ).toThrow();

      const item_with_invalid_unit = create_test_grocery_item({
        item_unit: "invalid_unit" as any, // Not in SIZE_UNITS enum
      });

      expect(() => grocery_item_schema.parse(item_with_invalid_unit)).toThrow();
    });

    it("should validate quantity constraints", () => {
      const item_with_zero_quantity = create_test_grocery_item({
        purchase_quantity: 0, // Violates min(1) constraint
      });

      expect(() =>
        grocery_item_schema.parse(item_with_zero_quantity),
      ).toThrow();

      const item_with_negative_quantity = create_test_grocery_item({
        purchase_quantity: -1, // Violates min(1) constraint
      });

      expect(() =>
        grocery_item_schema.parse(item_with_negative_quantity),
      ).toThrow();
    });

    it("should validate size constraints", () => {
      const item_with_negative_size = create_test_grocery_item({
        item_size: -1, // Violates min(0) constraint
      });

      expect(() =>
        grocery_item_schema.parse(item_with_negative_size),
      ).toThrow();

      const item_with_zero_size = create_test_grocery_item({
        item_size: 0, // Should be allowed (min(0))
      });

      expect(() =>
        grocery_item_schema.parse(item_with_zero_size),
      ).not.toThrow();
    });

    it("should validate offer schema when provided", () => {
      const item_with_offer = create_test_grocery_item({
        offer: {
          quantity: 2,
          price: 25.5,
          currency: "kr" as const,
        },
      });

      const result = grocery_item_schema.parse(item_with_offer);
      expect(result.offer).toEqual({
        quantity: 2,
        price: 25.5,
        currency: "kr",
      });
    });

    it("should reject invalid offer schema", () => {
      const item_with_invalid_offer = create_test_grocery_item({
        offer: {
          quantity: 0, // Violates min(1) constraint
          price: -10, // Violates min(0) constraint
          currency: "invalid" as any, // Not in CURRENCIES enum
        },
      });

      expect(() =>
        grocery_item_schema.parse(item_with_invalid_offer),
      ).toThrow();
    });

    it("should handle empty arrays for properties and stores", () => {
      const item_with_empty_arrays = create_test_grocery_item({
        properties: [],
        stores: [],
      });

      const result = grocery_item_schema.parse(item_with_empty_arrays);
      expect(result.properties).toEqual([]);
      expect(result.stores).toEqual([]);
    });

    it("should handle arrays with multiple values", () => {
      const item_with_multiple_values = create_test_grocery_item({
        properties: ["ekologisk", "laktosfri"],
        stores: ["ICA", "Coop"],
      });

      const result = grocery_item_schema.parse(item_with_multiple_values);
      expect(result.properties).toEqual(["ekologisk", "laktosfri"]);
      expect(result.stores).toEqual(["ICA", "Coop"]);
    });
  });
});

describe("Domain Logic - Type Safety", () => {
  it("should enforce TypeScript types", () => {
    // Test that the types are properly exported and usable
    const item_canonical: ItemCanonical = create_item_canonical("mjölk");
    const category: Category = create_category("mejeri");
    const brand: Brand = create_brand("Arla");
    const store: Store = create_store("ICA");
    const property: Property = create_property("ekologisk");
    const container_unit: ContainerUnit = create_container_unit("flaskor");

    expect(typeof item_canonical).toBe("string");
    expect(typeof category).toBe("string");
    expect(typeof brand).toBe("string");
    expect(typeof store).toBe("string");
    expect(typeof property).toBe("string");
    expect(typeof container_unit).toBe("string");
  });

  it("should provide proper type inference", () => {
    const test_item = {
      original_input: "test",
      parse_status: "success" as const,
      parse_error: null,
      parse_source: "manual" as const,
      item: "test",
      item_canonical: "test" as ItemCanonical,
      category: "test" as Category,
      brand: "test" as Brand,
    };

    const result: GroceryItem = grocery_item_schema.parse(test_item);
    expect(typeof result.original_input).toBe("string");
    expect(typeof result.purchase_quantity).toBe("number");
    expect(Array.isArray(result.properties)).toBe(true);
    expect(Array.isArray(result.stores)).toBe(true);
  });
});

describe("Domain Logic - Edge Cases", () => {
  it("should handle extreme values within constraints", () => {
    const extreme_item = {
      original_input: "x".repeat(1000), // Very long string
      parse_status: "success" as const,
      parse_error: null,
      parse_source: "manual" as const,
      item: "x".repeat(500),
      item_canonical: "x".repeat(100),
      category: "test",
      brand: "x".repeat(200),
      purchase_quantity: 999999,
      purchase_unit: "st",
      item_size: 999999.99,
      item_unit: "kg" as const,
      properties: Array(100).fill("test"),
      stores: Array(50).fill("test"),
      comment: "x".repeat(1000),
      offer: {
        quantity: 999999,
        price: 999999.99,
        currency: "kr" as const,
      },
    };

    // Should parse successfully as all values are within constraints
    expect(() => grocery_item_schema.parse(extreme_item)).not.toThrow();
  });

  it("should handle Unicode and special characters", () => {
    const unicode_item = {
      original_input: "2 flaskor mjölk åäö ñü 1.5 l",
      parse_status: "success" as const,
      parse_error: null,
      parse_source: "manual" as const,
      item: "mjölk åäö",
      item_canonical: "mjölk åäö",
      category: "mejeri",
      brand: "ÅCA",
      purchase_quantity: 2,
      purchase_unit: "flaskor",
      item_size: 1.5,
      item_unit: "l" as const,
      properties: ["ekologisk"],
      stores: ["ICA"],
      comment: "Special chars: åäö ñü",
      offer: null,
    };

    const result = grocery_item_schema.parse(unicode_item);
    expect(result.original_input).toContain("åäö ñü");
    expect(result.item).toContain("åäö");
    expect(result.brand).toBe("ÅCA");
    expect(result.comment).toContain("åäö ñü");
  });
});
