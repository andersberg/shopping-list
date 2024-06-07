import { ShoppingItem } from "./schema";

export const MOCK_SHOPPING_ITEMS = [
  {
    id: "1",
    value: "mjölk",
    displayName: "mjölk",
    unit: "fpk",
  },
  {
    id: "2",
    value: "ost",
    displayName: "ost",
    unit: "kg",
  },
  {
    id: "3",
    value: "cola",
    displayName: "Cola",
    unit: "st",
  },
  {
    id: "4",
    value: "ketchup",
    displayName: "ketchup",
    unit: "ml",
  },
  {
    id: "5",
    value: "cola zero",
    displayName: "Cola Zero",
    unit: "cl",
  },
] as const satisfies Array<ShoppingItem>;
