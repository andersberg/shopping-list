import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { insertItemSchema, items } from '../../db/schema/shoppingItem';
import type { RequestEvent } from './$types';

export async function add({ request, platform }: RequestEvent) {
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
		name: String(name),
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
		console.log(errors, Object.fromEntries(errors));
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

	const newItem = insertItemSchema.parse({
		name: String(name),
		displayName: String(name),
		quantity: Number(quantity) > 0 ? Number(quantity) : undefined,
		comment: comment ? String(comment) : undefined,
		unit: String(unit)
	});

	const result = await db.insert(items).values(newItem).returning();

	return {
		message: 'Item added',
		result
	};
}

export async function remove({ request, platform }: RequestEvent) {
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
