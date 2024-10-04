import { UNITS } from '$lib/constants';
import { insertItemSchema, items, selectItemSchema } from '$lib/db/schema/items';
import { isValidUnit } from '$lib/db/schema/utils';
import { error, fail, type RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (context) => {
	const message = 'Hello World';
	const env = context.platform?.env;
	if (!env) {
		return error(500, 'Environment not found');
	}

	const db = drizzle(env.DB);

	const results = (await db.select().from(items).all()) ?? [];

	// const form = superValidate(formData, selectItemSchema);

	return {
		message,
		results,
		units: UNITS
	};
};

export const actions = {
	addItem,
	editItem,
	removeItem
} satisfies Actions;

async function addItem({ request, platform }: RequestEvent) {
	const env = platform?.env;

	if (!env) {
		return error(500, 'Environment not found');
	}

	const formData = await request.formData();

	const name = formData.get('name')?.toString().trim();
	const quantity = formData.get('quantity')?.toString().trim();
	const unit = formData.get('unit')?.toString().trim();
	const comment = formData.get('comment')?.toString().trim();

	const values = {
		name: String(name).toLowerCase(),
		displayName: String(name),
		quantity: Number(quantity) > 0 ? Number(quantity) : undefined,
		comment: comment ? String(comment) : undefined,
		unit: String(unit)
	};

	const errors = new Map<string, string>();

	if (!name || name.length < 1) {
		errors.set('name', 'Name should not be empty.');
	}

	if (!quantity || quantity.length < 1) {
		errors.set('quantity', 'Quantity should be at least 1.');
	}

	if (!unit || unit.length < 1) {
		errors.set('unit', 'Unit should not be empty');
	}

	if (errors.size > 0) {
		return fail(422, {
			errors: {
				name: errors.get('name'),
				quantity: errors.get('quantity'),
				unit: errors.get('unit')
			},
			values
		});
	}

	const db = drizzle(env.DB);

	const newItem = insertItemSchema.parse(values);

	const result = await db.insert(items).values(newItem).returning();

	return {
		message: 'Item added',
		result
	};
}

async function editItem({ request, platform }: RequestEvent) {
	const env = platform?.env;

	if (!env) {
		return error(500, 'Environment not found');
	}

	const formData = await request.formData();
	const id = formData.get('id');
	const name = formData.get('name');
	const quantity = formData.get('quantity');
	const unit = formData.get('unit');
	const comment = formData.get('comment');

	if (typeof id !== 'string') {
		return error(400, 'id is required');
	}

	if (typeof name !== 'string') {
		return error(400, 'name is required');
	}

	if (typeof quantity !== 'string') {
		return error(400, 'quantity is required');
	}

	if (typeof unit !== 'string') {
		return error(400, 'unit is required');
	}

	if (typeof comment !== 'string') {
		return error(400, 'comment is required');
	}

	if (typeof unit !== 'string' || !isValidUnit(unit)) {
		return error(400, 'unit is required');
	}

	if (typeof quantity !== 'string') {
		return error(400, 'quantity is required');
	}

	const db = drizzle(env.DB);

	const [existingItem] = await db.select().from(items).where(eq(items.id, id));

	if (existingItem) {
		const newItemValues = insertItemSchema.parse({
			name: name ?? existingItem.name,
			quantity: Number(quantity) > 0 ? Number(quantity) : existingItem.quantity,
			comment: comment.length ? comment : existingItem.comment,
			unit: unit ?? existingItem.unit
		});

		const result = await db.update(items).set(newItemValues).where(eq(items.id, id)).returning();

		return {
			message: 'Item added',
			result
		};
	}

	return error(404, 'Item not found');
}

async function removeItem({ request, platform }: RequestEvent) {
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

	return {
		deleted: true,
		result
	};
}
