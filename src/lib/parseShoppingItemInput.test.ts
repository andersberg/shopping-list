import { describe, expect, it } from 'vitest';
import type { InsertShoppingItem } from './db/schema/items';
import { parseShoppingItemInput } from './parseShoppingItemInput';

const MOCK_SHOPPING_ITEM_NAMES = ['cola', 'cola zero', 'coca cola', 'ketchup', 'sandwich'];

describe('parseShoppingItemInput', () => {
	it('1 kg mjöl 3 för 2', () => {
		const input = '1 kg mjöl 3 för 2';

		const expected = {
			comment: '3 för 2',
			quantity: 1,
			unit: 'kg',
			name: 'mjöl'
		} as const satisfies Omit<InsertShoppingItem, 'id'>;

		const result = parseShoppingItemInput(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});

	it('cola zero: rabatt 2/50 kr', () => {
		const input = 'cola zero rabatt';
		const expected = {
			comment: 'rabatt',
			quantity: 1,
			unit: 'st',
			name: 'cola zero'
		} as const satisfies Omit<InsertShoppingItem, 'id'>;

		const result = parseShoppingItemInput(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});
});
