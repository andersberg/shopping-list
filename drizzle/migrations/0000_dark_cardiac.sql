CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`comment` text,
	`created` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`list_id` text NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`comment` text,
	`created` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
