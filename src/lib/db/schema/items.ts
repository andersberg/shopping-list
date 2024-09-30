import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { UNITS } from '../../constants';

export const items = sqliteTable('items', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId())
		.notNull(),
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

export type NewItem = typeof items.$inferInsert;

export const insertItemSchema = createInsertSchema(items);

export const selectItemSchema = createSelectSchema(items);

type InsertShoppingItem = z.infer<typeof insertItemSchema>;
type SelectShoppingItem = z.infer<typeof selectItemSchema>;

export type ShoppingItem = InsertShoppingItem | SelectShoppingItem;