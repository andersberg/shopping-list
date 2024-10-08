import { DEFAULT_QUANTITY, DEFAULT_UNIT } from '$lib/constants';
import type { InsertShoppingItem } from '$lib/db/schema/items';
import { isValidUnit } from '$lib/db/schema/utils';
import { parseListInput, type ShoppingItemNames } from './parseListInput';

export function parseListInputWithQuantity(
	input: string,
	itemNames: ShoppingItemNames
): Pick<InsertShoppingItem, 'name' | 'comment' | 'quantity' | 'unit'> {
	const inputParts = input.split(' ');
	const quantityPart = inputParts.at(0)?.trim() ?? DEFAULT_QUANTITY;
	const quantity = Number(quantityPart);

	let value = inputParts.slice(1).join(' ').trim() ?? input;
	let unit: InsertShoppingItem['unit'] = DEFAULT_UNIT;

	const maybeUnit = inputParts.at(1)?.trim();

	if (isValidUnit(maybeUnit)) {
		unit = maybeUnit;
		value = inputParts.slice(2).join(' ').trim();
	}

	const match = parseListInput(value, itemNames);

	const result = {
		...match,
		quantity,
		unit
	};

	return result;
}
