import { insertListSchema, lists, selectListSchema } from '$lib/db/schema/lists';
import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from './$types';

export async function load({ platform }) {
	const env = platform?.env;
	if (!env) {
		return error(500, 'Environment not found');
	}

	const form = await superValidate(zod(insertListSchema));

	// const editForm = await superValidate(zod(insertListSchema), {
	// 	id: 'edit-list-form'
	// });

	const db = drizzle(env.DB);
	const results = await db.select().from(lists).all();

	return {
		form,
		// editForm,
		lists: results
	};
}

export const actions = {
	add: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(insertListSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const db = drizzle(env.DB);

		const newList = insertListSchema.parse({
			name: form.data.name
		});

		await db.insert(lists).values(newList);

		return {
			form
		};
	},
	// edit: async ({ request, platform }) => {
	// 	const env = platform?.env;
	// 	if (!env) {
	// 		return error(500, 'Environment not found');
	// 	}

	// 	const form = await superValidate(request, zod(insertListSchema));

	// 	if (!form.valid) {
	// 		return fail(400, { form });
	// 	}

	// 	const db = drizzle(env.DB);

	// 	const formData = await request.formData();
	// 	const name = formData.get('name');

	// 	const [existingList] = await db.select().from(lists).where(eq(lists.name, form.data.name));

	// 	if (!existingList) {
	// 		return fail(404, { error: 'List not found', value: form.data.name, form });
	// 	}

	// 	const updatedList = insertListSchema.parse({
	// 		name: name ?? existingList.name
	// 	});

	// 	await db.update(lists).set(updatedList).where(eq(lists.name, form.data.name));

	// 	return {
	// 		form
	// 	};
	// },
	delete: async ({ request, platform }) => {
		const env = platform?.env;
		if (!env) {
			return error(500, 'Environment not found');
		}

		const form = await superValidate(request, zod(selectListSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const db = drizzle(env.DB);

		await db.delete(lists).where(eq(lists.id, form.data.id));

		return {
			message: 'List deleted',
			form
		};
	}
} satisfies Actions;
