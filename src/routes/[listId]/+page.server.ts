import { UNITS } from '$lib/constants';
import { items } from '$lib/db/schema/items';
import {
	addListItemSchema,
	listItems,
	selectListItemSchema,
	updateListItemSchema
} from '$lib/db/schema/listItems';
import { lists, selectListSchema } from '$lib/db/schema/lists';
import { parseShoppingItemInput } from '$lib/parseShoppingItemInput';
import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { zod } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { Actions } from './$types';

export async function load({ params, platform, depends }) {
	depends('app:list');
	const env = platform?.env;
	if (!env) {
		return error(500, 'Environment not found');
	}

	const db = drizzle(env.DB);
	const [list] = await db.select().from(lists).where(eq(lists.id, params.listId));
	const items = await db
		.select()
		.from(listItems)
		.where(eq(listItems.listId, params.listId))
		.orderBy(asc(listItems.checked));

	const addListItemForm = await superValidate(
		{
			listId: list.id
		},
		zod(addListItemSchema)
	);

	const editListForm = await superValidate(list, zod(selectListSchema));

	// const editListItemForm = await superValidate(zod(selectListItemSchema));

	return {
		forms: {
			addListItem: addListItemForm,
			editList: editListForm
		},
		items,
		list,
		units: UNITS
	};
}

export const actions = {
	addItem: async ({ request, platform }) => {
		const env = platform?.env;

		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(addListItemSchema));
		console.log('form', JSON.stringify(form, null, 2));

		if (!form.valid) {
			return fail(400, { form });
		}

		const db = drizzle(env.DB);

		const value = form.data.value;

		const result = await db
			.select({
				name: items.name
			})
			.from(items)
			.all();

		const itemNames = result.map((item) => item.name);

		const item = parseShoppingItemInput(value, itemNames);

		await db.insert(listItems).values({
			name: item.name,
			comment: item.comment,
			quantity: item.quantity,
			unit: item.unit,
			listId: form.data.listId
		});

		return message(form, 'Item added');
	},
	updateItem: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(updateListItemSchema));
		if (!form.valid) {
			return message(form, 'Item not updated', { status: 400 });
		}

		const db = drizzle(env.DB);
		const comment = form.data.comment;

		await db
			.update(listItems)
			.set({
				comment: comment?.length ? comment : undefined,
				name: form.data.name,
				quantity: form.data.quantity,
				unit: form.data.unit,
				checked: form.data.checked
			})
			.where(eq(listItems.id, form.data.id));

		return message(form, 'Item updated');
	},
	deleteItem: async ({ request, platform }) => {
		const env = platform?.env;

		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(
			request,
			zod(
				selectListItemSchema.pick({
					id: true
				})
			)
		);

		if (!form.valid) {
			return message(form, 'Item not deleted');
		}

		const db = drizzle(env.DB);

		const [existingItem] = await db.select().from(listItems).where(eq(listItems.id, form.data.id));

		if (!existingItem) {
			return error(404, 'Item not found');
		}

		await db.delete(listItems).where(eq(listItems.id, form.data.id));

		return message(form, 'Item deleted');
	},
	editList: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(selectListSchema));

		if (!form.valid) {
			return message(form, 'List not updated');
		}

		const db = drizzle(env.DB);

		const [result] = await db
			.update(lists)
			.set({ name: form.data.name })
			.where(eq(lists.id, form.data.id))
			.returning();

		return message({ ...form, data: result }, 'List updated');
	}
} satisfies Actions;
