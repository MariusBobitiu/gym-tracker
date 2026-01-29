CREATE TABLE `cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`split_id` text NOT NULL,
	`rotation` text NOT NULL,
	`anchor_week_start` text NOT NULL,
	`created_at` text NOT NULL,
	`is_active` integer NOT NULL,
	FOREIGN KEY (`split_id`) REFERENCES `splits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`variant_id` text NOT NULL,
	`name` text NOT NULL,
	`muscle_groups` text,
	`position` integer NOT NULL,
	FOREIGN KEY (`variant_id`) REFERENCES `split_variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `split_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`split_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text,
	`position` integer NOT NULL,
	FOREIGN KEY (`split_id`) REFERENCES `splits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `split_variants_split_id_key` ON `split_variants` (`split_id`,`key`);--> statement-breakpoint
CREATE TABLE `splits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
