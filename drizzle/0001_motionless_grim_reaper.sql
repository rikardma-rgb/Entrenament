CREATE TABLE `coach_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`analysis` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coach_feedback_session_id_unique` ON `coach_feedback` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_coach_feedback_session` ON `coach_feedback` (`session_id`);
