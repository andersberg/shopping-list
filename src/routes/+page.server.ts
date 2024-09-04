import { UNITS } from '$lib/constants';
import { error } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { insertItemSchema, items } from '../db/schema/shoppingItem';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (context) => {
	const message = 'Hello World';
	const env = context.platform?.env;
	if (!env) {
		return error(500, 'Environment not found');
	}

	const db = drizzle(env.DB);

	const results = (await db.select().from(items).all()) ?? [];

	return {
		message,
		results,
		units: UNITS
	};
};

export const actions = {
	'add-item': async ({ request, platform }) => {
		const env = platform?.env;

		if (!env) {
			return error(500, 'Environment not found');
		}

		const formData = await request.formData();
		const value = formData.get('value');
		const quantity = formData.get('quantity');
		const comment = formData.get('comment');
		const unit = formData.get('unit');

		if (value === null || quantity === null) {
			return error(400);
		}

		const db = drizzle(env.DB);

		if (typeof value !== 'string') {
			return error(400, 'Value should be a string');
		}

		const newItem = insertItemSchema.parse({
			value,
			displayName: value,
			quantity: Number(quantity) > 0 ? Number(quantity) : undefined,
			comment: comment ?? '',
			unit
		});

		const result = await db.insert(items).values(newItem).returning();

		return {
			message: 'Item added',
			result
		};
	}
} satisfies Actions;
