import type { GroceryItemLegacy } from "../GroceryItem";

export interface ParsedGroceryItem {
	quantity: number;
	unit: string | undefined;
	item: string;
	comment: string | undefined;
	discount_price: GroceryItemLegacy["discount_price"] | undefined;
}

/**
 * Parses grocery list text into structured objects.
 *
 * This class provides a structured way to parse grocery list text into objects
 * that represent individual items. It handles various formats including
 * quantity, unit, item, comment, and discount price.
 *
 * @example
 * const parser = new GroceryInputParser(
 *   ["fpk", "pkt", "kg", "g", "l", "dl", "ml", "st"],
 *   ["ekologisk", "ej zero", "extra", "extra virgin", "hemgjord"]
 * );
 * const item = parser.parse("4 pkt pasta ekologisk");
 * console.log(item);
 */
export class GroceryInputParser {
	readonly known_units: readonly string[];
	readonly modifiers: readonly string[];

	constructor(knownUnits: readonly string[], modifiers: readonly string[]) {
		this.known_units = knownUnits;
		this.modifiers = modifiers;
	}

	/**
	 * Parses a single line of grocery list text.
	 *
	 * @param input - The grocery list line (e.g., "4 pkt pasta ekologisk")
	 * @returns Object containing quantity, unit, item, comment, and discount_price.
	 */
	private parse_grocery_input(input: string) {
		// Normalize input: lowercase and trim whitespace.
		let tokens = input.trim().toLowerCase().split(/\s+/);

		let quantity = 1;
		let unit: string | undefined;
		let discount_price: GroceryItemLegacy["discount_price"] | undefined;

		// 1. Extract quantity if the first token is numeric.
		if (tokens.length && /^\d+(\.\d+)?$/.test(tokens[0])) {
			quantity = Number.parseFloat(tokens[0]);
			tokens.shift();
		}

		// 2. Check if the next token is a known unit.
		if (tokens.length && this.known_units.includes(tokens[0])) {
			unit = tokens[0];
			tokens.shift();
		}

		// 3. Check for special price pattern at the end.
		// Expected format: "<number>/<number> kr"
		if (tokens.length >= 2) {
			const potential_special = tokens.slice(-2); // Get the last two tokens.
			const special_regex = /^(\d+)\/(\d+)$/;
			if (
				special_regex.test(potential_special[0]) &&
				potential_special[1] === "kr"
			) {
				const match = potential_special[0].match(special_regex);
				if (match) {
					discount_price = {
						quantity: Number.parseInt(match[1]),
						price: Number.parseInt(match[2]),
						currency: "kr",
					};
				}
				// Remove special price tokens.
				tokens.splice(-2, 2);
			}
		}

		// 4. Remove any modifiers from tokens (regardless of position).
		// Sort modifiers by descending word count.
		const sorted_modifiers = [...this.modifiers].sort(
			(a, b) => b.split(" ").length - a.split(" ").length,
		);
		const { tokens: tokens_without_modifiers, found_modifiers } =
			this.remove_modifiers(tokens, sorted_modifiers);
		tokens = tokens_without_modifiers;

		// 5. The remaining tokens form the core item name.
		const name = tokens.join(" ").trim() || "";

		return {
			quantity,
			unit,
			item: name,
			comment: found_modifiers.length ? found_modifiers.join(", ") : undefined,
			discount_price,
		};
	}

	/**
	 * Helper function that removes any occurrences of modifier phrases from tokens.
	 *
	 * @param tokens - Array of tokens.
	 * @param sorted_modifiers - Modifiers sorted by descending word count.
	 * @returns Object containing remaining tokens and found modifiers.
	 */
	private remove_modifiers(tokens: string[], sortedModifiers: string[]) {
		const found_modifiers: string[] = [];
		let processed_count = 0;
		while (processed_count < tokens.length) {
			let matched = false;
			for (const mod of sortedModifiers) {
				const mod_tokens = mod.split(" ");
				// Check if the modifier fits at position i.
				if (
					processed_count + mod_tokens.length <= tokens.length &&
					mod_tokens.every(
						(modToken, index) => tokens[processed_count + index] === modToken,
					)
				) {
					found_modifiers.push(mod);
					// Remove the matched tokens.
					tokens.splice(processed_count, mod_tokens.length);
					matched = true;
					break; // break out of the inner loop to re-check current index.
				}
			}
			if (!matched) {
				processed_count++;
			}
		}
		return { tokens, found_modifiers };
	}

	public parse(input: string): ParsedGroceryItem {
		return this.parse_grocery_input(input);
	}
}
