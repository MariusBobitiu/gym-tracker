-- Make completed_at nullable so we can have one in-progress workout session row (single source of truth in SQLite)
PRAGMA foreign_keys=OFF;

CREATE TABLE `workout_sessions_new` (
  `id` text PRIMARY KEY NOT NULL,
  `cycle_id` text,
  `planned_session_template_id` text,
  `session_title` text NOT NULL,
  `started_at` integer NOT NULL,
  `completed_at` integer,
  `duration_mins` integer,
  `total_volume_kg` real,
  `total_sets` integer NOT NULL DEFAULT 0,
  `total_reps` integer NOT NULL DEFAULT 0,
  FOREIGN KEY (`cycle_id`) REFERENCES `cycles`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`planned_session_template_id`) REFERENCES `session_templates`(`id`) ON UPDATE no action ON DELETE set null
);

INSERT INTO `workout_sessions_new` SELECT `id`, `cycle_id`, `planned_session_template_id`, `session_title`, `started_at`, `completed_at`, `duration_mins`, `total_volume_kg`, `total_sets`, `total_reps` FROM `workout_sessions`;

DROP TABLE `workout_sessions`;

ALTER TABLE `workout_sessions_new` RENAME TO `workout_sessions`;

PRAGMA foreign_keys=ON;
