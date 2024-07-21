import { nanoid } from "nanoid";
import { z } from "zod";
import { UNITS } from "./constants";

export const ShoppingItemSchema = z.object({
  id: z.string().nanoid().default(nanoid),
  value: z.string().min(2, {
    message: "Item must be at least 2 characters.",
  }),
  displayName: z.string().min(2, {
    message: "Item must be at least 2 characters.",
  }),
  unit: z.enum(UNITS).default("st"),
  quantity: z
    .number()
    .min(1, {
      message: "Quantity must be at least 1.",
    })
    .default(1),
  comment: z.string().optional(),
});

export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

export const ShoppingItemWithoutIdSchema = ShoppingItemSchema.omit({
  id: true,
});
export type ShoppingItemWithoutId = z.infer<typeof ShoppingItemWithoutIdSchema>;
