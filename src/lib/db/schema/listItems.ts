import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { UNITS } from '../../constants';
import { items } from './items';
import { lists } from './lists';

export const listItems = sqliteTable('list_items', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId())
		.notNull(),
	itemId: text('item_id')
		.notNull()
		.references(() => items.id),
	listId: text('list_id')
		.notNull()
		.references(() => lists.id),
	name: text('name').notNull(),
	unit: text('unit', { enum: UNITS }).notNull(),
	quantity: integer('quantity').notNull().default(1),
	comment: text('comment'),
	created: text('created')
		.default(sql`(CURRENT_TIMESTAMP)`)
		.notNull(),
	updated: text('updated')
		.default(sql`(CURRENT_TIMESTAMP)`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
		.notNull()
});

export type NewListItem = typeof listItems.$inferInsert;

export const insertListItemSchema = createInsertSchema(listItems);

export const selectListItemSchema = createSelectSchema(listItems);
