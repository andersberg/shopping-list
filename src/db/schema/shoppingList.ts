import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const lists = sqliteTable('lists', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId())
		.notNull(),
	name: text('name').notNull(),
	created: text('created')
		.default(sql`(CURRENT_TIMESTAMP)`)
		.notNull(),
	updated: text('updated')
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
		.notNull()
});

export type NewList = typeof lists.$inferInsert;

export const insertListSchema = createInsertSchema(lists);

export const selectListSchema = createSelectSchema(lists);
