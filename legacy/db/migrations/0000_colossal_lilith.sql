CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`unit` text DEFAULT 'st' NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`comment` text,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`listId` text NOT NULL,
	`name` text NOT NULL,
	`unit` text DEFAULT 'st' NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`comment` text,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`checked` integer DEFAULT false,
	FOREIGN KEY (`listId`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
