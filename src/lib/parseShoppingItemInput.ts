import { parseListInput, type ShoppingItemNames } from './ParseLinstInput/parseListInput';
import { parseListInputWithQuantity } from './ParseLinstInput/parseListInputWithQuantity';
import { DEFAULT_QUANTITY, DEFAULT_UNIT, STARTS_WITH_NUMBER_REGEX } from './constants';
import type { InsertShoppingItem } from './db/schema/items';

export function parseShoppingItemInput(
	input: string,
	itemNames: ShoppingItemNames
): Omit<InsertShoppingItem, 'id' | 'created' | 'updated'> {
	const startsWithQuantity = STARTS_WITH_NUMBER_REGEX.test(input);

	if (startsWithQuantity) {
		return parseListInputWithQuantity(input, itemNames);
	} else {
		const result = parseListInput(input, itemNames);

		return {
			...result,
			quantity: DEFAULT_QUANTITY,
			unit: DEFAULT_UNIT
		};
	}
}
