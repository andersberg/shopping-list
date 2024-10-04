import { UNITS } from '$lib/constants';
import { insertItemSchema, items } from '$lib/db/schema/items';
import { insertListItemSchema, listItems } from '$lib/db/schema/listItems';
import { insertListSchema, lists, selectListSchema } from '$lib/db/schema/lists';
import { isValidUnit } from '$lib/db/schema/utils';
import { error, fail } from '@sveltejs/kit';
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

	const editListForm = await superValidate(list, zod(selectListSchema), {
		id: LIST_FORM_ID
	});

	const addItemForm = await superValidate(zod(insertListItemSchema));

	return {
		// list,
		editListForm,
		addItemForm,
		items,
		units: UNITS
	};
}

export const actions = {
	add: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(insertListItemSchema));

		if (!form.valid) {
			return message(form, 'Item not added');
		}

		// const formData = await request.formData();
		// const name = formData.get('name');
		// const listId = formData.get('listId');
		// const quantity = formData.get('quantity');
		// const unit = formData.get('unit');
		// const comment = formData.get('comment');

		// if (typeof name !== 'string') {
		// 	return error(400, 'name is required');
		// }

		// if (name.length < 3) {
		// 	return error(400, 'Name should be at least 3 characters');
		// }

		// if (typeof listId !== 'string') {
		// 	return error(400, 'listId is required');
		// }

		// if (typeof comment !== 'string') {
		// 	return error(400, 'comment is required');
		// }

		// if (typeof unit !== 'string' || !isValidUnit(unit)) {
		// 	return error(400, 'unit is required');
		// }

		// if (typeof quantity !== 'string') {
		// 	return error(400, 'quantity is required');
		// }

		const db = drizzle(env.DB);

		const [existingItem] = await db.select().from(items).where(eq(items.name, form.data.name));

		if (existingItem) {
			const name = form.data.name;
			const listId = form.data.listId;
			const quantity = form.data.quantity;
			const unit = form.data.unit;
			const comment = form.data.comment;

			const newListItemValues = insertListItemSchema.parse({
				name: name ?? existingItem.name,
				listId,
				itemId: existingItem.id,
				quantity: Number(quantity) > 0 ? Number(quantity) : existingItem.quantity,
				comment: comment && comment.length ? comment : existingItem.comment,
				unit: unit ?? existingItem.unit
			});

			await db.insert(listItems).values(newListItemValues);

			return message(form, 'Item added');
		}

		const [newItem] = await db.insert(items).values(form.data).returning();

		await db.insert(listItems).values({ ...form.data, itemId: newItem.id });

		return message(form, 'Item added');
	},
	// edit: async ({ request, platform }) => {
	// 	const env = platform?.env;
	// 	if (!env) {
	// 		return error(500, 'Environment not found');
	// 	}

	// 	const formData = await request.formData();
	// 	const id = formData.get('id');
	// 	const name = formData.get('name');
	// 	const listId = formData.get('listId');
	// 	const quantity = formData.get('quantity');
	// 	const unit = formData.get('unit');
	// 	const comment = formData.get('comment');

	// 	if (typeof id !== 'string') {
	// 		return error(400, 'id is required');
	// 	}

	// 	if (typeof name !== 'string') {
	// 		return error(400, 'name is required');
	// 	}

	// 	if (typeof listId !== 'string') {
	// 		return error(400, 'listId is required');
	// 	}

	// 	if (typeof quantity !== 'string') {
	// 		return error(400, 'quantity is required');
	// 	}

	// 	if (typeof unit !== 'string' || !isValidUnit(unit)) {
	// 		return error(400, 'unit is required');
	// 	}

	// 	if (typeof comment !== 'string') {
	// 		return error(400, 'comment is required');
	// 	}

	// 	const db = drizzle(env.DB);

	// 	const [existingItem] = await db.select().from(listItems).where(eq(listItems.id, id));

	// 	if (!existingItem || existingItem.listId !== listId) {
	// 		return error(404, 'Item not found');
	// 	}

	// 	const updatedListItem = insertListItemSchema.parse({
	// 		name: name ?? existingItem.name,
	// 		itemId: existingItem.itemId,
	// 		quantity: Number(quantity) > 0 ? Number(quantity) : existingItem.quantity,
	// 		comment: comment.length ? comment : existingItem.comment,
	// 		unit: unit ?? existingItem.unit,
	// 		listId
	// 	});

	// 	const result = await db.update(listItems).set(updatedListItem).where(eq(listItems.id, id));

	// 	return {
	// 		message: 'Item updated',
	// 		result
	// 	};
	// },
	// delete: async ({ request, platform }) => {
	// 	const env = platform?.env;
	// 	if (!env) {
	// 		return error(500, 'Environment not found');
	// 	}

	// 	const formData = await request.formData();
	// 	const id = formData.get('id');

	// 	if (typeof id !== 'string') {
	// 		return error(400, 'id is required');
	// 	}

	// 	const db = drizzle(env.DB);

	// 	const [existingItem] = await db.select().from(listItems).where(eq(listItems.id, id));

	// 	if (!existingItem) {
	// 		return error(404, 'Item not found');
	// 	}

	// 	const result = await db.delete(listItems).where(eq(listItems.id, id)).returning();

	// 	return {
	// 		message: 'Item deleted',
	// 		result
	// 	};
	// },
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
