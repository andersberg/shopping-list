import { UNITS } from '$lib/constants';
import { items } from '$lib/db/schema/shoppingItem';
import { lists } from '$lib/db/schema/shoppingList';
import { insertListItemSchema, listItems } from '$lib/db/schema/shoppingListItem';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
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
	const items = await db.select().from(listItems).where(eq(listItems.listId, listId));

	return {
		list,
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

		const formData = await request.formData();
		const name = formData.get('name');
		const listId = formData.get('listId');
		const quantity = formData.get('quantity');
		const unit = formData.get('unit');
		const comment = formData.get('comment');

		if (typeof name !== 'string') {
			return error(400, 'name is required');
		}

		if (name.length < 3) {
			return error(400, 'Name should be at least 3 characters');
		}

		if (typeof listId !== 'string') {
			return error(400, 'listId is required');
		}

		const db = drizzle(env.DB);

		const [existingItem] = await db.select().from(items).where(eq(items.name, name));

		if (!existingItem) {
			return error(404, 'Item not found');
		}

		const newListItem = insertListItemSchema.parse({
			name,
			listId,
			itemId: existingItem.id,
			displayName: name,
			quantity: Number(quantity) > 0 ? Number(quantity) : undefined,
			comment: comment ? String(comment) : existingItem.comment,
			unit
		});


		const result = await db.insert(listItems).values(newListItem).returning();

		return {
			message: 'Item added',
			result
		};
	},
	edit: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name');
		const listId = formData.get('listId');
		const quantity = formData.get('quantity');
		const unit = formData.get('unit');
		const comment = formData.get('comment');
		
		if (typeof id !== 'string') {
			return error(400, 'id is required');
		}

		if (typeof name !== 'string') {
			return error(400, 'name is required');
		}

		if (typeof listId !== 'string') {
			return error(400, 'listId is required');
		}

		const db = drizzle(env.DB);

		const [existingItem] = await db.select().from(listItems).where(eq(listItems.id, id));

		if (!existingItem) {
		}
		
		
	}
} satisfies Actions;
