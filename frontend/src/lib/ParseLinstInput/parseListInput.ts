import { COLON_SPLIT_REGEX, SPLIT_FIRST_WORD_REGEX } from "../constants";
import { ShoppingItem, ShoppingListItemWithoutId } from "../schema";

export function parseListInput(
  input: string,
  items: Array<ShoppingItem>
): Omit<ShoppingListItemWithoutId, "quantity" | "unit"> {
  const [valuePart = "", commentPart = ""] = input.split(COLON_SPLIT_REGEX, 2);
  const match = findBestMatch(valuePart, items);

  if (match) {
    const comment = [
      commentPart.trim(),
      input.replace(match?.value, "").trim(), // TODO: Fix this?
    ].filter(Boolean);

    return {
      // id: match.id,
      comment: comment.length > 0 ? comment.join(", ") : undefined,
      displayName: match.displayName,
      value: match.value,
    };
  }

  const [, value, inputRest = ""] = input.match(SPLIT_FIRST_WORD_REGEX) ?? [];

  const comment = [commentPart.trim(), inputRest.trim()].filter(Boolean);

  return {
    // id: nanoid(),
    comment: comment.length > 0 ? comment.join(", ") : undefined,
    displayName: value.trim(),
    value: value.trim(),
  };
}

// Create a regular expression to match whole words
const wordBoundaryPattern = (value: string) =>
  new RegExp(`\\b${value}\\b`, "i");

export function findBestMatch(input: string, items: Array<ShoppingItem>) {
  items.sort((a, b) => b.value.length - a.value.length);

  for (const item of items) {
    if (wordBoundaryPattern(item.value).test(input)) {
      return item;
    }
  }

  return null;
}
