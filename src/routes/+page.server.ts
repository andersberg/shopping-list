import { error, fail } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { insertListSchema, lists } from '../db/schema/shoppingList';
import type { Actions } from './$types';

export async function load({ platform }) {
	const env = platform?.env;
	if (!env) {
		return error(500, 'Environment not found');
	}

	const db = drizzle(env.DB);
	const results = (await db.select().from(lists).all()) ?? [];

	return {
		lists: results
	};
}

export const actions = {
	default: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const db = drizzle(env.DB);

		const formData = await request.formData();
		const name = formData.get('name');

		if (typeof name !== 'string') {
			return fail(400, { error: 'name is required', value: name ?? '' });
		}

		if (name.length < 3) {
			return fail(400, { error: 'Name should be at least 3 characters', value: name ?? '' });
		}

		const newList = insertListSchema.parse({
			name
		});

		const result = await db.insert(lists).values(newList).returning();

		return {
			message: 'List added',
			result
		};
	}
} satisfies Actions;
