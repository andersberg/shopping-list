import { describe, expect, it } from "bun:test";
import type { ShoppingListItem } from "../../../server/src/lib/schema";
import { MOCK_SHOPPING_ITEMS } from "./mocks";
import { parseShoppingItemInput } from "./parseShoppingItemInput";

describe("parseShoppingItemInput", () => {
  it("1 kg mjöl 3 för 2", () => {
    const input = "1 kg mjöl 3 för 2";

    const expected = {
      comment: "3 för 2",
      displayName: "mjöl",
      quantity: 1,
      unit: "kg",
      value: "mjöl",
    } as const satisfies Omit<ShoppingListItem, "id">;

    const result = parseShoppingItemInput(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });

  it("cola zero: rabatt 2/50 kr", () => {
    const input = "cola zero rabatt";
    const expected = {
      comment: "rabatt",
      displayName: "Cola Zero",
      quantity: 1,
      unit: "st",
      value: "cola zero",
    } as const satisfies Omit<ShoppingListItem, "id">;

    const result = parseShoppingItemInput(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });
});
