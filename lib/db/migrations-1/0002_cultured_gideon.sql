ALTER TABLE `grocery_list_item` ADD `checked` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `grocery_list_item` ADD `comment` text;--> statement-breakpoint
ALTER TABLE `grocery_list_item` ADD `discount_price` text;--> statement-breakpoint
ALTER TABLE `grocery_list_item` ADD `quantity` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `grocery_list_item` ADD `unit` text DEFAULT 'st' NOT NULL;