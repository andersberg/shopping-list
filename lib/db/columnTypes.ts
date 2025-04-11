import { sql } from "drizzle-orm";
import { type SQLiteColumn, integer, text } from "drizzle-orm/sqlite-core";
import { GROCERY_ITEM_KNOWN_UNITS } from "../constants";

export function createIdAsPrimaryKeyColumn() {
	return text()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID())
		.notNull();
}

export function createDateTimeColumn() {
	return text().default(sql`CURRENT_TIMESTAMP`).notNull();
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

export function createCheckedColumn(checked = false) {
	return integer({ mode: "boolean" }).default(checked);
}
