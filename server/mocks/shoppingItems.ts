import { nanoid } from "nanoid";
import { type ShoppingItem } from "../lib/ShoppingItem";

const SHOPPING_LIST_ITEM_INITIAL_ID_1 = nanoid();
const SHOPPING_LIST_ITEM_INITIAL_ID_2 = nanoid();
const SHOPPING_LIST_ITEM_INITIAL_ID_3 = nanoid();
const SHOPPING_LIST_ITEM_INITIAL_ID_4 = nanoid();
const SHOPPING_LIST_ITEM_INITIAL_ID_5 = nanoid();

export const SHOPPING_ITEMS = new Map<ShoppingItem["id"], ShoppingItem>([
  [
    SHOPPING_LIST_ITEM_INITIAL_ID_1,
    {
      id: SHOPPING_LIST_ITEM_INITIAL_ID_1,
      value: "ost",
      displayName: "Ost",
      unit: "kg",
      quantity: 1,
    },
  ],
  [
    SHOPPING_LIST_ITEM_INITIAL_ID_2,
    {
      id: SHOPPING_LIST_ITEM_INITIAL_ID_2,
      value: "mjölk",
      displayName: "mjölk",
      unit: "fpk",
      quantity: 1,
    },
  ],
  [
    SHOPPING_LIST_ITEM_INITIAL_ID_3,
    {
      id: SHOPPING_LIST_ITEM_INITIAL_ID_3,
      value: "cola",
      displayName: "Cola",
      unit: "fpk",
      quantity: 10,
    },
  ],
  [
    SHOPPING_LIST_ITEM_INITIAL_ID_4,
    {
      id: SHOPPING_LIST_ITEM_INITIAL_ID_4,
      value: "ketchup",
      displayName: "ketchup",
      unit: "st",
      quantity: 1,
    },
  ],
  [
    SHOPPING_LIST_ITEM_INITIAL_ID_5,
    {
      id: SHOPPING_LIST_ITEM_INITIAL_ID_5,
      value: "cola zero",
      displayName: "Cola Zero",
      unit: "cl",
      quantity: 33,
    },
  ],
]);
