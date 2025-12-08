import { sql } from "drizzle-orm";
import { type SQLiteColumn, integer, text } from "drizzle-orm/sqlite-core";
import type { GroceryItemDiscountPrice } from "../grocery-item";
import { GROCERY_ITEM_KNOWN_UNITS } from "../constants";

export function createIdAsPrimaryKeyColumn() {
	return text()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());
}

export function createDateTimeColumn() {
	return text().notNull().default(sql`CURRENT_TIMESTAMP`).$type<Date>();
}

export function createForeignKeyColumn<T extends SQLiteColumn>(column: T) {
	return text()
		.notNull()
		.references(() => column);
}

export function createQuantityColumn() {
	return integer().notNull().default(1);
}

export function createUnitColumn() {
	return text({
		enum: GROCERY_ITEM_KNOWN_UNITS,
	})
		.notNull()
		.default("st");
}

export function createCommentColumn() {
	return text();
}

export function createNameColumn() {
	return text().notNull().unique();
}

export function createBooleanColumn(defaultValue = false) {
	return integer({ mode: "boolean" }).notNull().default(defaultValue);
}

export function createDiscountPriceColumn() {
	return text({ mode: "json" }).$type<GroceryItemDiscountPrice>();
}
