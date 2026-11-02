CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message` text NOT NULL,
	`author` text DEFAULT 'Anonymous' NOT NULL,
	`color` text NOT NULL,
	`created_at` integer NOT NULL
);
