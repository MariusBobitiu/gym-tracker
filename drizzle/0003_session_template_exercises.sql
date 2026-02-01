CREATE TABLE `session_template_exercises` (
  `id` text PRIMARY KEY NOT NULL,
  `session_template_id` text NOT NULL,
  `name` text NOT NULL,
  `sets` integer NOT NULL,
  `reps` integer NOT NULL,
  `weight` real NOT NULL,
  `position` integer NOT NULL,
  FOREIGN KEY (`session_template_id`) REFERENCES `session_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
