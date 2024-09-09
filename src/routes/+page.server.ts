import { UNITS } from '$lib/constants';
import { error } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { items } from '../db/schema/shoppingItem';
import type { Actions, PageServerLoad } from './$types';
import { add, remove } from './actions';

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
	add,
	remove
} satisfies Actions;
