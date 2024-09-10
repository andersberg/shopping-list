import { parseListInput } from './ParseLinstInput/parseListInput';
import { parseListInputWithQuantity } from './ParseLinstInput/parseListInputWithQuantity';
import type { ShoppingItem } from './db/schema/shoppingItem';
import { DEFAULT_QUANTITY, DEFAULT_UNIT, STARTS_WITH_NUMBER_REGEX } from './frontend/constants';

export function parseShoppingItemInput(input: string, items: Array<ShoppingItem>): ShoppingItem {
	const startsWithQuantity = STARTS_WITH_NUMBER_REGEX.test(input);

	if (startsWithQuantity) {
		return parseListInputWithQuantity(input, items);
	} else {
		const result = parseListInput(input, items);

		return {
			...result,
			quantity: DEFAULT_QUANTITY,
			unit: DEFAULT_UNIT
		};
	}
}
