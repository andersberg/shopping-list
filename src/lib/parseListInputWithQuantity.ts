import { DEFAULT_QUANTITY, DEFAULT_UNIT, UNITS } from "./constants";
import { findBestMatch, parseListInput } from "./parseListInput";
import { ShoppingItem, ShoppingListItem } from "./schema";

type Unit = (typeof UNITS)[number];
const isUnit = (value: unknown): value is Unit =>
  typeof value === "string" && UNITS.includes(value as Unit);

export function parseListInputWithQuantity(
  input: string,
  items: Array<ShoppingItem>
): Omit<ShoppingListItem, "id"> {
  const inputParts = input.split(" ");
  const quantityPart = inputParts.at(0)?.trim() ?? DEFAULT_QUANTITY;
  const quantity = Number(quantityPart);

  let value = inputParts.slice(1).join(" ").trim() ?? input;
  let unit: Unit = DEFAULT_UNIT;

  const maybeUnit = inputParts.at(1)?.trim();

  if (isUnit(maybeUnit)) {
    unit = maybeUnit;
    value = inputParts.slice(2).join(" ").trim();
  }

  const match = parseListInput(value, items);

  const result = {
    ...match,
    quantity,
    unit,
  };

  return result;
}
