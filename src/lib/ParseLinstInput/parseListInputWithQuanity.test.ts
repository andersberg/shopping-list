import type { InsertShoppingItem } from '$lib/db/schema/items';
import { describe, expect, it } from 'vitest';
import { parseListInputWithQuantity } from './parseListInputWithQuantity';

const MOCK_SHOPPING_ITEM_NAMES = ['mjölk'];

describe('parseListInputWithQuantity', () => {
	it('2 mjölk', () => {
		const input = '2 mjölk';
		const expected = {
			comment: undefined,
			quantity: 2,
			unit: 'st',
			name: 'mjölk'
		} as const satisfies Omit<InsertShoppingItem, 'id'>;

		const result = parseListInputWithQuantity(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});

	it('2 mjölk stor eko', () => {
		const input = '2 mjölk stor eko';
		const expected = {
			comment: 'stor eko',
			quantity: 2,
			unit: 'st',
			name: 'mjölk'
		} as const satisfies Omit<InsertShoppingItem, 'id'>;

		const result = parseListInputWithQuantity(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});

	it('2 kg mjölk', () => {
		const input = '2 kg mjölk';
		const expected = {
			comment: undefined,
			quantity: 2,
			unit: 'kg',
			name: 'mjölk'
		} as const satisfies Omit<InsertShoppingItem, 'id'>;

		const result = parseListInputWithQuantity(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});

	it('1 kg mjölk 3 för 2', () => {
		const input = '1 kg mjölk 3 för 2';

		const expected = {
			comment: '3 för 2',
			quantity: 1,
			unit: 'kg',
			name: 'mjölk'
		} as const satisfies Omit<InsertShoppingItem, 'id'>;

		const result = parseListInputWithQuantity(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});
});
