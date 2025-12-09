import type { GroceryItem } from "../../grocery-item";

/**
 * Unified interface for grocery line parsers.
 *
 * Both manual and AI parsers implement this interface to ensure
 * they can be used interchangeably in the two-phase parsing system.
 */
export interface GroceryParser {
	/**
	 * Parse a grocery line into a standardized GroceryItem.
	 *
	 * @param input - Raw Swedish grocery text (e.g., "3 pkt mjölk eko arla 4/50kr ica")
	 * @returns Promise that resolves to standardized GroceryItem
	 */
	parse(input: string): GroceryItem | Promise<GroceryItem>;

	/**
	 * Source identifier for the parser.
	 * Used to track which parser handled the request.
	 */
	readonly source: "manual" | "ai";
}

/**
 * Type alias for parser results.
 * Ensures consistent typing across the parsing system.
 */
export type ParserResult = GroceryItem & {
	parser_source: "manual" | "ai";
};
