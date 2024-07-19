import { describe, expect, it } from "bun:test";
import { MOCK_SHOPPING_ITEMS } from "../mocks";
import { ShoppingListItem } from "../schema";
import { parseListInput } from "./parseListInput";

describe("parseListInput", () => {
  it("ketchup", () => {
    const input = "ketchup";
    const expected = {
      comment: undefined,
      displayName: "ketchup",
      value: "ketchup",
    } as const satisfies Omit<ShoppingListItem, "id" | "quantity" | "unit">;

    const result = parseListInput(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });

  it("cola ej zero", () => {
    const input = "cola ej zero";
    const expected = {
      comment: "ej zero",
      displayName: "Cola",
      value: "cola",
    } as const satisfies Omit<ShoppingListItem, "id" | "quantity" | "unit">;

    const result = parseListInput(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });

  it("cola zero rabatt", () => {
    const input = "cola zero rabatt";
    const expected = {
      comment: "rabatt",
      displayName: "Cola Zero",
      value: "cola zero",
    } as const satisfies Omit<ShoppingListItem, "id" | "quantity" | "unit">;

    const result = parseListInput(input, MOCK_SHOPPING_ITEMS);
    expect(result).toEqual(expected);
  });

  // it("sandwich: 39kr", () => {
  //   const input = "sandwich: 39kr";
  //   const expected = {
  //     comment: "39kr",
  //     displayName: "sandwich",
  //     value: "sandwich",
  //   } as const satisfies Omit<ShoppingListItem, "id" | "quantity" | "unit">;

  //   const result = parseListInputWithoutQuanity(input, MOCK_SHOPPING_ITEMS);
  //   expect(result).toEqual(expected);
  // });
});
