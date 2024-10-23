import { parseListInput, type ShoppingItemNames } from './ParseLinstInput/parseListInput';
import { parseListInputWithQuantity } from './ParseLinstInput/parseListInputWithQuantity';
import { DEFAULT_QUANTITY, DEFAULT_UNIT, STARTS_WITH_NUMBER_REGEX } from './constants';
import type { InsertShoppingItem } from './db/schema/items';

type ParsedShoppingItem = Omit<InsertShoppingItem, 'id' | 'created' | 'updated'>;

export function parseShoppingItemInput(
	input: string,
	itemNames: ShoppingItemNames
): ParsedShoppingItem {
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
