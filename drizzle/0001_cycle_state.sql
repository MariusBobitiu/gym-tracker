CREATE TABLE `cycle_state` (
	`id` text PRIMARY KEY NOT NULL,
	`cycle_id` text NOT NULL UNIQUE,
	`current_variant_key` text NOT NULL,
	`session_index_a` integer NOT NULL DEFAULT 0,
	`session_index_b` integer NOT NULL DEFAULT 0,
	`session_index_c` integer NOT NULL DEFAULT 0,
	`last_completed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE cascade
);
