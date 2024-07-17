import { describe, expect, it } from "bun:test";
import { MOCK_SHOPPING_ITEMS } from "../mocks";
import { ShoppingListItem } from "../schema";
import { parseListInputWithQuantity } from "./parseListInputWithQuantity";

describe("parseListInputWithQuantity", () => {
  it("2 mjölk", () => {
    const input = "2 mjölk";
    const expected = {
      comment: undefined,
      displayName: "mjölk",
      quantity: 2,
      unit: "st",
      value: "mjölk",
    } as const satisfies Omit<ShoppingListItem, "id">;

    const result = parseListInputWithQuantity(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });

  it("2 mjölk stor eko", () => {
    const input = "2 mjölk stor eko";
    const expected = {
      comment: "stor eko",
      displayName: "mjölk",
      quantity: 2,
      unit: "st",
      value: "mjölk",
    } as const satisfies Omit<ShoppingListItem, "id">;

    const result = parseListInputWithQuantity(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });

  it("2 kg mjöl", () => {
    const input = "2 kg mjöl";
    const expected = {
      comment: undefined,
      displayName: "mjöl",
      quantity: 2,
      unit: "kg",
      value: "mjöl",
    } as const satisfies Omit<ShoppingListItem, "id">;

    const result = parseListInputWithQuantity(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });

  it("1 kg mjöl 3 för 2", () => {
    const input = "1 kg mjöl 3 för 2";

    const expected = {
      comment: "3 för 2",
      displayName: "mjöl",
      quantity: 1,
      unit: "kg",
      value: "mjöl",
    } as const satisfies Omit<ShoppingListItem, "id">;

    const result = parseListInputWithQuantity(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });
});
