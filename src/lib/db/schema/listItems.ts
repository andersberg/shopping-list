import { sql } from 'drizzle-orm';
import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import {
	createCommentColumn,
	createDateTimeColumn,
	createForeignKeyColumn,
	createIdAsPrimaryKeyColumn,
	createNameColumn,
	createQuantityColumn,
	createUnitColumn
} from './columnTypes';
import { items } from './items';
import { lists } from './lists';

export const listItems = sqliteTable('list_items', {
	id: createIdAsPrimaryKeyColumn(),
	itemId: createForeignKeyColumn(items.id),
	listId: createForeignKeyColumn(lists.id),
	name: createNameColumn(),
	unit: createUnitColumn(),
	quantity: createQuantityColumn(),
	comment: createCommentColumn(),
	created: createDateTimeColumn(),
	updated: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
});

export type NewListItem = typeof listItems.$inferInsert;

export const insertListItemSchema = createInsertSchema(listItems);

export const selectListItemSchema = createSelectSchema(listItems);
