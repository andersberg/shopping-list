import { z } from "zod";
import { ShoppingItemSchema } from "./ShoppingItem";

export const ShoppingListSchema = z.object({
  id: z.string().nanoid(),
  name: z.string().min(3, {
    message: "List name must be at least 2 characters.",
  }),
  items: z.array(ShoppingItemSchema),
});
export type ShoppingList = z.infer<typeof ShoppingListSchema>;

export const ShoppingListWithoutIdSchema = ShoppingListSchema.omit({
  id: true,
});
export type ShoppingListWithoutId = z.infer<typeof ShoppingListWithoutIdSchema>;
