import { v7 as uuidv7 } from "uuid";
import { type ShoppingItem } from "../lib/ShoppingItem";

export const MOCK_SHOPPING_ITEMS = [
  {
    id: uuidv7(),
    value: "ost",
    displayName: "Ost",
    unit: "kg",
    quantity: 1,
  },
  {
    id: uuidv7(),
    value: "mjölk",
    displayName: "mjölk",
    unit: "fpk",
    quantity: 1,
  },
  {
    id: uuidv7(),
    value: "cola",
    displayName: "Cola",
    unit: "fpk",
    quantity: 10,
  },
  {
    id: uuidv7(),
    value: "ketchup",
    displayName: "ketchup",
    unit: "st",
    quantity: 1,
  },
  {
    id: uuidv7(),
    value: "cola zero",
    displayName: "Cola Zero",
    unit: "cl",
    quantity: 33,
  },
] satisfies Array<ShoppingItem>;
