import type { InsertShoppingItem, SelectShoppingItem } from '$lib/db/schema/items';
import { COLON_SPLIT_REGEX } from '../constants';

export type ShoppingItemNames = Array<SelectShoppingItem['name']>;

export function parseListInput(
	input: string,
	itemNames: ShoppingItemNames
): Pick<InsertShoppingItem, 'name' | 'comment'> {
	const [namePart = '', commentPart = ''] = input.split(COLON_SPLIT_REGEX, 2);
	const match = findBestMatch(namePart, itemNames);

	if (match) {
		const comment = commentPart ? commentPart.trim() : input.replace(match, '').trim();

		return {
			name: match,
			comment: comment.length > 0 ? comment : undefined
		};
	}

	return {
		comment: undefined,
		name: input
	};
}

// Create a regular expression to match whole words
const wordBoundaryPattern = (value: string) => new RegExp(`\\b${value}\\b`, 'i');

export function findBestMatch(input: string, itemNames: ShoppingItemNames): string | null {
	const sortedItemNames = itemNames.toSorted((a, b) => b.length - a.length);

	for (const name of sortedItemNames) {
		if (wordBoundaryPattern(name).test(input)) {
			return name;
		}
	}

	return null;
}
