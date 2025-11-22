CREATE TABLE `grocery_list` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`store` text
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
	`input_raw` text DEFAULT '' NOT NULL,
	`item` text,
	`quantity_unit` text,
	`size_value` real,
	`size_unit` text,
	`brand` text,
	`organic` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'needs_review' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`grocery_list_id`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
