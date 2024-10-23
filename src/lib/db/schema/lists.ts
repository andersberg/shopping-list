import { sql } from 'drizzle-orm';
import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { createDateTimeColumn, createIdAsPrimaryKeyColumn, createNameColumn } from './columnTypes';

export const lists = sqliteTable('lists', {
	id: createIdAsPrimaryKeyColumn(),
	name: createNameColumn(),
	created: createDateTimeColumn(),
	updated: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
});

export const insertListSchema = createInsertSchema(lists, {
	name: z.string().min(3)
});

export const selectListSchema = createSelectSchema(lists);
export type List = z.infer<typeof selectListSchema>;
