import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { SQLiteColumn, integer, text } from 'drizzle-orm/sqlite-core';
import { UNITS } from '../../constants';

export function createIdAsPrimaryKeyColumn() {
	return text()
		.primaryKey()
		.$defaultFn(() => createId())
		.notNull();
}

export function createDateTimeColumn() {
	return text()
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull();
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
	return text({ enum: UNITS }).notNull();
}

export function createCommentColumn() {
	return text();
}

export function createNameColumn() {
	return text().notNull();
}
