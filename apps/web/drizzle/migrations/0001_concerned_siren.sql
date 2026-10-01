CREATE TABLE `plan_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`lookback_days` integer NOT NULL,
	`max_sessions` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `attempts` ADD `help_prompt` text;--> statement-breakpoint
ALTER TABLE `attempts` ADD `lesson_id` text;--> statement-breakpoint
ALTER TABLE `attempts` ADD `lesson_label` text;--> statement-breakpoint
ALTER TABLE `attempts` ADD `part_of_speech` text;--> statement-breakpoint
ALTER TABLE `attempts` ADD `word_type` text;--> statement-breakpoint
ALTER TABLE `attempts` ADD `word` text;--> statement-breakpoint
ALTER TABLE `attempts` ADD `traits_json` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `session_date` text;