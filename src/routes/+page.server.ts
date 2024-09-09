import { UNITS } from '$lib/constants';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { items } from '../db/schema/shoppingItem';
import type { Actions, PageServerLoad } from './$types';
import { addShoppingItemAction } from './actions';

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
	add: addShoppingItemAction,
	delete: async ({ request, platform }) => {
		const env = platform?.env;

		if (!env) {
			return error(500, 'Environment not found');
		}

		const formdata = await request.formData();
		const id = formdata.get('id');

		if (id === null) {
			return error(400, 'id is required');
		}

		if (typeof id !== 'string') {
			return error(400, 'id should be a string');
		}

		const db = drizzle(env.DB);
		const result = await db.delete(items).where(eq(items.id, id)).returning();
		console.log(result);
		return {
			deleted: true,
			result
		};
	}
} satisfies Actions;
