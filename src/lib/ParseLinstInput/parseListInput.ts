import type { InsertShoppingItem, SelectShoppingItem } from '$lib/db/schema/items';
import { COLON_SPLIT_REGEX } from '../constants';

export type ShoppingItemNames = Array<SelectShoppingItem['name']>;

export function parseListInput(
	input: string,
	itemNames: ShoppingItemNames
): Pick<InsertShoppingItem, 'name' | 'comment'> {
	const [namePart = '', commentPart = ''] = input.split(COLON_SPLIT_REGEX, 2);
	const match = findBestMatch(namePart, itemNames);

	console.log('match', match, { input, itemNames });

	if (match) {
		const comment = commentPart
			? commentPart.trim()
			: input.replace(new RegExp(match, 'i'), '').trim();

		console.log({ comment, commentPart: !!commentPart, input });

		const result = {
			name: match,
			comment: comment.length > 0 ? comment : undefined
		};

		console.log({ result });

		return result;
	}

	return {
		comment: undefined,
		name: input
	};
}

// Create a regular expression to match whole words
// const wordBoundaryPattern = (value: string) => new RegExp(`\\b${value}\\b`, 'i');

export function findBestMatch(input: string, itemNames: ShoppingItemNames): string | null {
	const inputLowerCase = input.toLowerCase();
	const sortedItemNames = itemNames.toSorted((a, b) => b.length - a.length);

	for (const name of sortedItemNames) {
		const nameLowerCase = name.toLowerCase();

		console.log(inputLowerCase, nameLowerCase, inputLowerCase.startsWith(nameLowerCase));

		if (inputLowerCase.startsWith(nameLowerCase)) {
			return name;
		}
	}

	return null;
}
