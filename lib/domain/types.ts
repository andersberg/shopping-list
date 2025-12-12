import z from "zod/v4";
import { CURRENCIES } from "./constants";

// --- Offer Value Object ---

/** Offer schema for price and quantity information */
export const offer_schema = z.object({
	quantity: z.number().min(1),
	price: z.number().min(0),
	currency: z.enum(CURRENCIES),
});

/** Offer type */
export type Offer = z.infer<typeof offer_schema>;

// --- Type Re-exports ---

/** Legacy type for backward compatibility
 * @deprecated Use Offer instead
 */
export type GroceryItemDiscountPrice = Offer;
