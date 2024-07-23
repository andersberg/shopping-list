import { nanoid } from "nanoid";
import { ShoppingList } from "../lib/ShoppingList";

const SHOPPING_LIST_INITIAL_ID_1 = "Is60jSon-C9Rr9we8HwkH";
const SHOPPING_LIST_INITIAL_ID_2 = "Nxuod_harReD0Jm80g2-8";

export const SHOPPING_LISTS = new Map<string, ShoppingList>([
  [
    SHOPPING_LIST_INITIAL_ID_1,
    {
      id: SHOPPING_LIST_INITIAL_ID_1,
      name: "List 1",
      items: [
        {
          id: "1",
          value: "ost",
          displayName: "Ost",
          unit: "kg",
          quantity: 1,
        },
        {
          id: "2",
          value: "mjölk",
          displayName: "mjölk",
          unit: "fpk",
          quantity: 1,
        },
      ],
    },
  ],
  [
    SHOPPING_LIST_INITIAL_ID_2,
    {
      id: SHOPPING_LIST_INITIAL_ID_2,
      name: "List 2",
      items: [
        {
          id: "3",
          value: "cola",
          displayName: "Cola",
          unit: "st",
          quantity: 1,
        },
        {
          id: "4",
          value: "ketchup",
          displayName: "ketchup",
          unit: "ml",
          quantity: 1,
        },
      ],
    },
  ],
]);
