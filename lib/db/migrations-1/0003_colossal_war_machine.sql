PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_grocery_list_item` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`name` text NOT NULL,
	`grocery_list_id` text NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	`comment` text,
	`discount_price` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit` text DEFAULT 'st' NOT NULL,
	FOREIGN KEY (`grocery_list_id`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list_item`("id", "created_at", "updated_at", "name", "grocery_list_id", "checked", "comment", "discount_price", "quantity", "unit") SELECT "id", "created_at", "updated_at", "name", "grocery_list_id", "checked", "comment", "discount_price", "quantity", "unit" FROM `grocery_list_item`;--> statement-breakpoint
DROP TABLE `grocery_list_item`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list_item` RENAME TO `grocery_list_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `grocery_list_item_name_unique` ON `grocery_list_item` (`name`);