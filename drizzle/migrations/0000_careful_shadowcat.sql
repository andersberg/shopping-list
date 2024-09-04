CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`displayName` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`comment` text,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
