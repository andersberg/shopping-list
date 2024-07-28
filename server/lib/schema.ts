import { z } from "zod";
import { ShoppingItemSchema } from "./ShoppingItem";

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
