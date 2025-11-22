import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
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

/** Item status values supported by the database schema. */
export const ITEM_STATUSES = [
        "active",
        "checked",
        "error",
        "needs_review",
] as const;

/**
 * Grocery list table definition including metadata used for Drizzle queries.
 */
export const grocery_list = sqliteTable("grocery_list", {
        id: createIdAsPrimaryKeyColumn(),
        created_at: createDateTimeColumn(),
        updated_at: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
        deleted: createBooleanColumn(),
        name: createNameColumn(),
        store: text(),
});

/**
 * Relation helper connecting grocery lists to their items.
 */
export const grocery_list_relations = relations(grocery_list, ({ many }) => ({
        items: many(grocery_list_item),
}));

/**
 * Convenience type representing a list with its associated items.
 */
export type GroceryListWithItems = typeof grocery_list.$inferSelect & {
        items: (typeof grocery_list_item.$inferSelect)[];
};

/**
 * Grocery list item table definition with parsed and raw attributes.
 */
export const grocery_list_item = sqliteTable("grocery_list_item", {
        id: createIdAsPrimaryKeyColumn(),
        created_at: createDateTimeColumn(),
        updated_at: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
        name: createNameColumn(false),
        grocery_list_id: createForeignKeyColumn(grocery_list.id),
        checked: createBooleanColumn(),
        comment: createCommentColumn(),
        discount_price: createDiscountPriceColumn(),
        quantity: createQuantityColumn(),
        unit: createUnitColumn(),
        input_raw: text().notNull().default(""),
        item: text(),
        quantity_unit: text(),
        size_value: real(),
        size_unit: text(),
        brand: text(),
        organic: createBooleanColumn(),
        status: text({ enum: ITEM_STATUSES }).notNull().default("needs_review"),
        position: integer().notNull().default(0),
});

/**
 * Relation helper connecting items back to their parent grocery list.
 */
export const grocery_list_item_relations = relations(
        grocery_list_item,
        ({ one }) => ({
                grocery_list: one(grocery_list, {
			fields: [grocery_list_item.grocery_list_id],
			references: [grocery_list.id],
		}),
	}),
);

/**
 * Zod schema for validating inserts into the grocery_list_item table.
 */
export const grocery_list_item_insert_schema = createInsertSchema(
        grocery_list_item,
        {
                quantity: () => z.number().min(1).default(1),
                position: () => z.number().min(0).default(0),
                status: () => z.enum(ITEM_STATUSES).default("needs_review"),
        },
);

/** Type representing the shape of grocery list item inserts. */
export type GroceryListItemInsert = z.infer<
        typeof grocery_list_item_insert_schema
>;

/**
 * Zod schema for selecting grocery list items with defaults applied.
 */
export const grocery_list_item_select_schema = createSelectSchema(
        grocery_list_item,
        {
                checked: () => z.boolean().default(false),
        },
);

/** Type representing the shape of selected grocery list items. */
export type GroceryListItemSelect = z.infer<
        typeof grocery_list_item_select_schema
>;
