CREATE TABLE `grocery_list` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grocery_list_name_unique` ON `grocery_list` (`name`);--> statement-breakpoint
CREATE TABLE `grocery_list_item` (
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
CREATE UNIQUE INDEX `grocery_list_item_name_unique` ON `grocery_list_item` (`name`);