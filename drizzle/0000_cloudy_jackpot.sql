CREATE TABLE `workout_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_date` text NOT NULL,
	`routine` text NOT NULL,
	`duration_minutes` integer,
	`rpe` integer,
	`exercise_data` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_workout_sessions_date` ON `workout_sessions` (`session_date`);--> statement-breakpoint
CREATE INDEX `idx_workout_sessions_routine_date` ON `workout_sessions` (`routine`,`session_date`);