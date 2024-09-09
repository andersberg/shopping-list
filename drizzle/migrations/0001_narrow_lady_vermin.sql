CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `listItems` (
	`id` text PRIMARY KEY NOT NULL,
	`itemId` text NOT NULL,
	`listId` text NOT NULL,
	`name` text NOT NULL,
	`displayName` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`comment` text,
	`created` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`listId`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action
);
