import { sql } from 'drizzle-orm';
import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import {
	createCommentColumn,
	createDateTimeColumn,
	createIdAsPrimaryKeyColumn,
	createNameColumn,
	createQuantityColumn,
	createUnitColumn
} from './columnTypes';

export const items = sqliteTable('items', {
	id: createIdAsPrimaryKeyColumn(),
	name: createNameColumn(),
	unit: createUnitColumn(),
	quantity: createQuantityColumn(),
	comment: createCommentColumn(),
	created: createDateTimeColumn(),
	updated: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
});

export type NewItem = typeof items.$inferInsert;

export const insertItemSchema = createInsertSchema(items);

export const selectItemSchema = createSelectSchema(items);

type InsertShoppingItem = z.infer<typeof insertItemSchema>;
type SelectShoppingItem = z.infer<typeof selectItemSchema>;

export type ShoppingItem = InsertShoppingItem | SelectShoppingItem;
