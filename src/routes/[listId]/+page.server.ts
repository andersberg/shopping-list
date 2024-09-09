import { UNITS } from '$lib/constants';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { lists } from '../../db/schema/shoppingList';
import type { Actions } from './$types';

export async function load({ params, platform }) {
	const env = platform?.env;
	if (!env) {
		return error(500, 'Environment not found');
	}

	const listId = params.listId;
	if (typeof listId !== 'string') {
		return error(404, 'listId is required');
	}

	const db = drizzle(env.DB);
	const [list] = await db.select().from(lists).where(eq(lists.id, listId));

	return {
		list,
		units: UNITS
	};
}

export const actions = {
	default: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const formData = await request.formData();
		const name = formData.get('name');
		const listId = formData.get('listId');

		if (typeof name !== 'string') {
			return error(400, 'name is required');
		}

		if (name.length < 3) {
			return error(400, 'Name should be at least 3 characters');
		}

		if (typeof listId !== 'string') {
			return error(400, 'listId is required');
		}

		console.log({ listId });

		// const db = drizzle(env.DB);
	}
} satisfies Actions;
