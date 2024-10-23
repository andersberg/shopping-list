import { sql } from 'drizzle-orm';
import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
	createCommentColumn,
	createDateTimeColumn,
	createForeignKeyColumn,
	createIdAsPrimaryKeyColumn,
	createNameColumn,
	createQuantityColumn,
	createUnitColumn
} from './columnTypes';
import { lists } from './lists';
import { idString, nameString } from './primitives';

export const listItems = sqliteTable('list_items', {
	id: createIdAsPrimaryKeyColumn(),
	listId: createForeignKeyColumn(lists.id),
	name: createNameColumn(),
	unit: createUnitColumn(),
	quantity: createQuantityColumn(),
	comment: createCommentColumn(),
	created: createDateTimeColumn(),
	updated: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
});

export const insertListItemSchema = createInsertSchema(listItems, {
	name: z.string().min(2).max(255)
});

export const addListItemSchema = insertListItemSchema
	.pick({
		listId: true
	})
	.extend({
		value: z.string().min(2).max(255)
	});

export type AddListItem = z.infer<typeof addListItemSchema>;

export const selectListItemSchema = createSelectSchema(listItems, {
	name: nameString,
	listId: idString
});
