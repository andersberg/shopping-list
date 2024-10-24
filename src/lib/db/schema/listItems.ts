import { sql } from 'drizzle-orm';
import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
	createCheckedColumn,
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
	updated: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	checked: createCheckedColumn()
});

export const insertListItemSchema = createInsertSchema(listItems, {
	name: nameString
});

export const addListItemSchema = insertListItemSchema
	.pick({
		listId: true
	})
	.extend({
		value: nameString
	});

export type AddListItem = z.infer<typeof addListItemSchema>;

export const selectListItemSchema = createSelectSchema(listItems, {
	name: nameString,
	listId: idString
});

export type ListItem = z.infer<typeof selectListItemSchema>;

export const updateListItemSchema = insertListItemSchema.partial().merge(
	z.object({
		id: idString,
		listId: idString
	})
);

export type UpdateListItem = z.infer<typeof updateListItemSchema>;
