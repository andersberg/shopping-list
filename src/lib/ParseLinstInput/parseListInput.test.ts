import type { InsertShoppingItem } from '$lib/db/schema/items';
import { describe, expect, it } from 'vitest';
import { parseListInput } from './parseListInput';

const MOCK_SHOPPING_ITEM_NAMES = ['cola', 'cola zero', 'coca cola', 'ketchup', 'sandwich'];

describe('parseListInput', () => {
	it('ketchup', () => {
		const input = 'ketchup';
		const expected = {
			comment: undefined,
			name: 'ketchup'
		} as const satisfies Omit<InsertShoppingItem, 'id' | 'quantity' | 'unit'>;

		const result = parseListInput(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});

	it('cola ej zero', () => {
		const input = 'cola ej zero';
		const expected = {
			comment: 'ej zero',
			name: 'cola'
		} as const satisfies Omit<InsertShoppingItem, 'id' | 'quantity' | 'unit'>;

		const result = parseListInput(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});

	it('cola zero rabatt', () => {
		const input = 'cola zero rabatt';
		const expected = {
			comment: 'rabatt',
			name: 'cola zero'
		} as const satisfies Omit<InsertShoppingItem, 'id' | 'quantity' | 'unit'>;

		const result = parseListInput(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});

	it('sandwich: 39kr', () => {
		const input = 'sandwich: 39kr';
		const expected = {
			comment: '39kr',
			name: 'sandwich'
		} as const satisfies Omit<InsertShoppingItem, 'id' | 'quantity' | 'unit'>;

		const result = parseListInput(input, MOCK_SHOPPING_ITEM_NAMES);
		expect(result).toEqual(expected);
	});
});
