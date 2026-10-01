CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`recorded_at` text NOT NULL,
	`url` text NOT NULL,
	`location` text,
	`input_mode` text,
	`question_mode` text,
	`grammar_point` text,
	`prompt` text,
	`user_answer` text NOT NULL,
	`accepted_answers_json` text NOT NULL,
	`result` text NOT NULL,
	`result_source` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lesson_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`model` text NOT NULL,
	`session_ids_json` text NOT NULL,
	`summary` text NOT NULL,
	`body_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`imported_at` text NOT NULL
);
