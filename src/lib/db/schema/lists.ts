import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const lists = sqliteTable('lists', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId())
		.notNull(),
	name: text('name').notNull(),
	created: text('created') // TODO: Change to integer
		.default(sql`(CURRENT_TIMESTAMP)`)
		.notNull(),
	updated: text('updated') // TODO: Change to integer
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
		.notNull()
});

export type NewList = typeof lists.$inferInsert;

export const insertListSchema = createInsertSchema(lists, {
	name: z.string().min(3)
});

export const selectListSchema = createSelectSchema(lists);
