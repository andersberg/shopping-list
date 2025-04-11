import { sql } from "drizzle-orm/sql";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import {
	createDateTimeColumn,
	createIdAsPrimaryKeyColumn,
	createNameColumn,
} from "./columnTypes";

export const grocery_list_schema = sqliteTable("grocery_list", {
	id: createIdAsPrimaryKeyColumn(),
	created_at: createDateTimeColumn(),
	updated_at: createDateTimeColumn().$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	name: createNameColumn(),
});
