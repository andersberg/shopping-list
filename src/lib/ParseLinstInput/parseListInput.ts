import type { ShoppingItem } from '$lib/db/schema/shoppingItem';
import { COLON_SPLIT_REGEX, SPLIT_FIRST_WORD_REGEX } from '../frontend/constants';

export function parseListInput(input: string, items: Array<ShoppingItem>) {
	const [valuePart = '', commentPart = ''] = input.split(COLON_SPLIT_REGEX, 2);
	const match = findBestMatch(valuePart, items);

	if (match) {
		const comment = [
			commentPart.trim(),
			input.replace(match?.name, '').trim() // TODO: Fix this?
		].filter(Boolean);

		return {
			id: match.id,
			comment: comment.length > 0 ? comment.join(', ') : undefined,
			displayName: match.displayName,
			value: match.name
		};
	}

	const [, value, inputRest = ''] = input.match(SPLIT_FIRST_WORD_REGEX) ?? [];

	const comment = [commentPart.trim(), inputRest.trim()].filter(Boolean);

	return {
		comment: comment.length > 0 ? comment.join(', ') : undefined,
		displayName: value.trim(),
		value: value.trim()
	};
}

// Create a regular expression to match whole words
const wordBoundaryPattern = (value: string) => new RegExp(`\\b${value}\\b`, 'i');

export function findBestMatch(input: string, items: Array<ShoppingItem>) {
	items.sort((a, b) => b.name.length - a.name.length);

	for (const item of items) {
		if (wordBoundaryPattern(item.name).test(input)) {
			return item;
		}
	}

	return null;
}
