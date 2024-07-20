import { ShoppingItem } from "@backend/lib/ShoppingItem";

export const MOCK_SHOPPING_ITEMS = [
  {
    id: "1",
    value: "mjölk",
    displayName: "mjölk",
    unit: "fpk",
    quantity: 1,
  },
  {
    id: "2",
    value: "ost",
    displayName: "ost",
    unit: "kg",
    quantity: 1,
  },
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
  {
    id: "5",
    value: "cola zero",
    displayName: "Cola Zero",
    unit: "cl",
    quantity: 1,
  },
] as const satisfies Array<ShoppingItem>;
