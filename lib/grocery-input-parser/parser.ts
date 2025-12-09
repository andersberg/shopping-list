import { CURRENCY_SEK } from "../constants";
import type { GroceryItemLegacy, GroceryItem } from "../grocery-item";
import { ManualParser } from "../parsers/manual/manual-parser";

export interface ParsedGroceryItem {
	quantity: number;
	unit: string | undefined;
	item: string;
	comment: string | undefined;
	discount_price: GroceryItemLegacy["discount_price"] | undefined;
}

/**
 * Adapter class to provide backward compatibility for client code
 * that expects the legacy ParsedGroceryItem format.
 *
 * This wraps the new ManualParser and converts GroceryItem to ParsedGroceryItem.
 */
export class GroceryInputParser {
	private manualParser: ManualParser;

	// Keep parameters for backward compatibility
	constructor(_knownUnits: readonly string[], _modifiers: readonly string[]) {
		// The new ManualParser doesn't need these parameters, but we keep them
		// for backward compatibility with existing client code
		this.manualParser = new ManualParser();
	}

	/**
	 * Parses grocery input and returns legacy ParsedGroceryItem format
	 * for backward compatibility with client code.
	 */
	parse(input: string): ParsedGroceryItem {
		const groceryItem: GroceryItem = this.manualParser.parse(input);

		// Convert GroceryItem to ParsedGroceryItem format
		return {
			quantity: groceryItem.quantity,
			unit: groceryItem.quantity_unit || undefined,
			item: groceryItem.item || "",
			comment: groceryItem.comment || undefined,
			discount_price: groceryItem.offer_total_price_value
				? {
						amount: groceryItem.offer_total_price_value,
						currency: CURRENCY_SEK,
						quantity: groceryItem.offer_quantity,
					}
				: undefined,
		};
	}
}
