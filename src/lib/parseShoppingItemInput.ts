import {
  DEFAULT_QUANTITY,
  DEFAULT_UNIT,
  STARTS_WITH_NUMBER_REGEX,
} from "./constants";
import { parseListInput } from "./parseListInput";
import { parseListInputWithQuantity } from "./parseListInputWithQuantity";
import { ShoppingItem, ShoppingListItemWithoutId } from "./schema";

export function parseShoppingItemInput(
  input: string,
  items: Array<ShoppingItem>
): ShoppingListItemWithoutId {
  const startsWithQuantity = STARTS_WITH_NUMBER_REGEX.test(input);

  if (startsWithQuantity) {
    const result = parseListInputWithQuantity(input, items);

    return result;
  } else {
    const result = parseListInput(input, items);

    return {
      ...result,
      quantity: DEFAULT_QUANTITY,
      unit: DEFAULT_UNIT,
    };
  }
}
