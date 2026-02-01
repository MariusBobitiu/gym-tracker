CREATE TABLE `workout_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `cycle_id` text,
  `planned_session_template_id` text,
  `session_title` text NOT NULL,
  `started_at` integer NOT NULL,
  `completed_at` integer NOT NULL,
  `duration_mins` integer,
  `total_volume_kg` real,
  `total_sets` integer NOT NULL DEFAULT 0,
  `total_reps` integer NOT NULL DEFAULT 0,
  FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`planned_session_template_id`) REFERENCES `session_templates`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE TABLE `workout_sets` (
  `id` text PRIMARY KEY NOT NULL,
  `session_id` text NOT NULL,
  `exercise_id` text NOT NULL,
  `exercise_name` text NOT NULL,
  `set_number` integer NOT NULL,
  `weight` real NOT NULL,
  `reps` integer NOT NULL,
  FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
