import { ShoppingItem } from "../lib/ShoppingItem";

// const SHOPPING_LIST_ITEM_INITIAL_ID = nanoid();
export const SHOPPING_ITEM_INITIAL_ID = "tjExFxB1QusZzF7QMoNvP";
export const SHOPPING_ITEMS = new Map<ShoppingItem["id"], ShoppingItem>([
  [
    SHOPPING_ITEM_INITIAL_ID,
    {
      id: SHOPPING_ITEM_INITIAL_ID,
      value: "ost",
      displayName: "Ost",
      unit: "kg",
      quantity: 1,
      comment: "ej prästost",
    },
  ],
]);
