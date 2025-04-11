import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import {
	createBooleanColumn,
	createCommentColumn,
	createDateTimeColumn,
	createDiscountPriceColumn,
	createForeignKeyColumn,
	createIdAsPrimaryKeyColumn,
	createNameColumn,
	createQuantityColumn,
	createUnitColumn,
} from "./columnTypes";

export const grocery_list = sqliteTable("grocery_list", {
	id: createIdAsPrimaryKeyColumn(),
	created_at: createDateTimeColumn(),
	updated_at: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	deleted: createBooleanColumn(),
	name: createNameColumn(),
});

export const grocery_list_relations = relations(grocery_list, ({ many }) => ({
	items: many(grocery_list_item),
}));

export type GroceryListWithItems = typeof grocery_list.$inferSelect & {
	items: (typeof grocery_list_item.$inferSelect)[];
};

export const grocery_list_item = sqliteTable("grocery_list_item", {
	id: createIdAsPrimaryKeyColumn(),
	created_at: createDateTimeColumn(),
	updated_at: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	name: createNameColumn(),
	grocery_list_id: createForeignKeyColumn(grocery_list.id),
	checked: createBooleanColumn(),
	comment: createCommentColumn(),
	discount_price: createDiscountPriceColumn(),
	quantity: createQuantityColumn(),
	unit: createUnitColumn(),
});

export const grocery_list_item_relations = relations(
	grocery_list_item,
	({ one }) => ({
		grocery_list: one(grocery_list, {
			fields: [grocery_list_item.grocery_list_id],
			references: [grocery_list.id],
		}),
	}),
);

export const grocery_list_item_insert_schema = createInsertSchema(
	grocery_list_item,
	{
		quantity: (schema) => schema.min(1),
	},
);

export type GroceryListItemInsert = z.infer<
	typeof grocery_list_item_insert_schema
>;

export const grocery_list_item_select_schema = createSelectSchema(
	grocery_list_item,
	{
		checked: (schema) => schema.default(false),
	},
);

export type GroceryListItemSelect = z.infer<
	typeof grocery_list_item_select_schema
>;
