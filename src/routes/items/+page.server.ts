import { UNITS } from '$lib/constants';
import { insertItemSchema, items, selectItemSchema } from '$lib/db/schema/items';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (context) => {
	const env = context.platform?.env;
	if (!env) {
		return error(500, 'Environment not found');
	}

	const db = drizzle(env.DB);

	const results = await db.select().from(items).all();

	const addItemForm = await superValidate(zod(insertItemSchema));
	const editItemForm = await superValidate(zod(selectItemSchema));

	return {
		addItemForm,
		editItemForm,
		items: results,
		units: UNITS
	};
};

export const actions = {
	addItem: async ({ request, platform }) => {
		const env = platform?.env;

		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(insertItemSchema));

		if (!form.valid) {
			return message(form, 'Item not added', { status: 400 });
		}

		const db = drizzle(env.DB);

		await db.insert(items).values(form.data);

		return message(form, 'Item added');
	},
	updateItem: async ({ request, platform }) => {
		const env = platform?.env;

		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(selectItemSchema));

		if (!form.valid) {
			return message(form, 'Item not updated', { status: 400 });
		}

		const db = drizzle(env.DB);

		await db
			.update(items)
			.set({
				name: form.data.name,
				unit: form.data.unit,
				quantity: form.data.quantity,
				comment: form.data.comment
			})
			.where(eq(items.id, form.data.id));

		return message(form, 'Item updated');
	},
	deleteItem: async ({ request, platform }) => {
		const env = platform?.env;

		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(selectItemSchema));

		if (!form.valid) {
			return message(form, 'Item not deleted', { status: 400 });
		}

		const db = drizzle(env.DB);

		await db.delete(items).where(eq(items.id, form.data.id));

		return message(form, 'Item deleted');
	}
} satisfies Actions;
