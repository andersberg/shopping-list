import { ShoppingItemSchema } from "@backend/lib/ShoppingItem";
import { z } from "zod";

export const ShoppingListItemSchema = ShoppingItemSchema.extend({
  quantity: z
    .number()
    .min(1, {
      message: "Quantity must be at least 1.",
    })
    .default(1),
  comment: z.string().optional(),
});

export type ShoppingListItem = z.infer<typeof ShoppingListItemSchema>;
export type ShoppingListItemWithoutId = Omit<ShoppingListItem, "id">;
