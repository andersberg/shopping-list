import { sql } from "drizzle-orm";
import { type SQLiteColumn, integer, text } from "drizzle-orm/sqlite-core";
import type { GroceryItemDiscountPrice } from "../GroceryItem";
import { GROCERY_ITEM_KNOWN_UNITS } from "../constants";

/**
 * Creates a primary key text column backed by UUIDs generated in the database layer.
 *
 * @returns A Drizzle text column configured as the primary key.
 */
export function createIdAsPrimaryKeyColumn() {
        return text()
                .primaryKey()
                .$defaultFn(() => crypto.randomUUID());
}

/**
 * Creates a timestamp column with a default of the current time.
 *
 * @returns A Drizzle text column typed as a JavaScript Date.
 */
export function createDateTimeColumn() {
        return text().notNull().default(sql`CURRENT_TIMESTAMP`).$type<Date>();
}

/**
 * Creates a required text column that references another table's primary key.
 *
 * @param column The referenced column.
 * @returns A Drizzle text column configured as a foreign key.
 */
export function createForeignKeyColumn<T extends SQLiteColumn>(column: T) {
        return text()
                .notNull()
                .references(() => column);
}

/**
 * Creates a numeric quantity column defaulting to one.
 *
 * @returns A Drizzle integer column for quantities.
 */
export function createQuantityColumn() {
        return integer().notNull().default(1);
}

/**
 * Creates a unit column constrained to known grocery units.
 *
 * @returns A Drizzle text column with a default of "st".
 */
export function createUnitColumn() {
        return text({
                enum: GROCERY_ITEM_KNOWN_UNITS,
        })
                .notNull()
                .default("st");
}

/**
 * Creates an optional text column intended for free-form comments.
 *
 * @returns A Drizzle text column.
 */
export function createCommentColumn() {
        return text();
}

/**
 * Builds a required text column for entity names.
 *
 * @param unique Whether to enforce a unique constraint on the column.
 * @returns A configured Drizzle column builder.
 */
export function createNameColumn(unique: boolean = true) {
        const column = text().notNull();

        return unique ? column.unique() : column;
}

/**
 * Creates a boolean column stored as an integer with a configurable default.
 *
 * @param defaultValue The default boolean value to store.
 * @returns A Drizzle integer column typed as boolean.
 */
export function createBooleanColumn(defaultValue = false) {
        return integer({ mode: "boolean" }).notNull().default(defaultValue);
}

/**
 * Creates a JSON-encoded text column for discount price metadata.
 *
 * @returns A Drizzle text column typed as {@link GroceryItemDiscountPrice}.
 */
export function createDiscountPriceColumn() {
        return text({ mode: "json" }).$type<GroceryItemDiscountPrice>();
}
