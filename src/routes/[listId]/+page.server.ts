import { UNITS } from '$lib/constants';
import { items } from '$lib/db/schema/items';
import { insertListItemSchema, listItems, selectListItemSchema } from '$lib/db/schema/listItems';
import { lists, selectListSchema } from '$lib/db/schema/lists';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { zod } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { Actions } from './$types';

const LIST_FORM_ID = 'list-form';
// const ITEM_FORM_ID = 'item-form';

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

	const items = await db.select().from(listItems).where(eq(listItems.listId, listId));

	const editListForm = await superValidate(list, zod(selectListSchema));

	const addListItemForm = await superValidate(zod(insertListItemSchema));

	const editListItemForm = await superValidate(zod(selectListItemSchema));

	return {
		// list,
		editListForm,
		addListItemForm,
		editListItemForm,
		items,
		units: UNITS
	};
}

export const actions = {
	addItem: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(insertListItemSchema));

		if (!form.valid) {
			return message(form, 'Item not added');
		}

		const db = drizzle(env.DB);

		const [existingItem] = await db
			.select()
			.from(items)
			.where(eq(items.name, form.data.name))
			.limit(1);

		if (existingItem) {
			const comment = form.data.comment;

			await db.insert(listItems).values({
				comment: comment && comment.length ? comment : existingItem.comment,
				itemId: existingItem.id,
				listId: form.data.listId,
				name: form.data.name,
				quantity: form.data.quantity ?? existingItem.quantity,
				unit: form.data.unit ?? existingItem.unit
			});

			return message(form, 'Item added');
		}

		const [newItem] = await db.insert(items).values(form.data).returning();

		await db.insert(listItems).values({
			comment: form.data.comment,
			itemId: newItem.id,
			listId: form.data.listId,
			name: form.data.name,
			quantity: form.data.quantity,
			unit: form.data.unit
		});

		return message(form, 'Item added');
	},
	updateItem: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(selectListItemSchema));

		if (!form.valid) {
			return message(form, 'Item not updated', { status: 400 });
		}

		const db = drizzle(env.DB);

		const comment = form.data.comment;
		await db
			.update(listItems)
			.set({
				comment: comment?.length ? comment : undefined,
				itemId: form.data.itemId,
				listId: form.data.listId,
				name: form.data.name,
				quantity: form.data.quantity,
				unit: form.data.unit
			})
			.where(eq(listItems.id, form.data.id));

		return message(form, 'Item updated');
	},
	deleteItem: async ({ request, platform }) => {
		const env = platform?.env;

		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(selectListItemSchema));

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

		const form = await superValidate(request, zod(selectListSchema), {
			id: LIST_FORM_ID
		});

		if (!form.valid) {
			return message(form, 'List not updated');
		}

		const db = drizzle(env.DB);

		const [updatedList] = await db
			.update(lists)
			.set({ name: form.data.name })
			.where(eq(lists.id, form.data.id))
			.returning();

		return message({ ...form, data: updatedList }, 'List updated');
	}
} satisfies Actions;
