CREATE TABLE `inquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`person` text NOT NULL,
	`interest` text NOT NULL,
	`budget` text NOT NULL,
	`story` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`customer` text NOT NULL,
	`status` text DEFAULT 'Design' NOT NULL,
	`stage` text DEFAULT 'New inquiry' NOT NULL,
	`due` text NOT NULL,
	`due_label` text NOT NULL,
	`estimate` real DEFAULT 0 NOT NULL,
	`logged` real DEFAULT 0 NOT NULL,
	`remaining` real DEFAULT 0 NOT NULL,
	`value` real DEFAULT 0 NOT NULL,
	`paid` real DEFAULT 0 NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`next_action` text DEFAULT 'Review project brief' NOT NULL,
	`blocker` text DEFAULT '' NOT NULL,
	`color` text DEFAULT 'red' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_code_unique` ON `projects` (`code`);--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_unique` ON `subscribers` (`email`);--> statement-breakpoint
INSERT INTO `projects` (`id`, `code`, `name`, `customer`, `status`, `stage`, `due`, `due_label`, `estimate`, `logged`, `remaining`, `value`, `paid`, `progress`, `next_action`, `blocker`, `color`) VALUES
(1, 'RB-241', 'Firehouse bar', 'M. Delaney', 'Build', 'Frame fabrication', '2026-09-18', 'Sep 18', 38, 21.5, 18, 6400, 3200, 62, 'Weld lower cabinet frame', '', 'red'),
(2, 'RB-244', 'Aviation coffee table', 'J. Archer', 'Design', 'Concept approved', '2026-10-02', 'Oct 2', 44, 8.5, 36, 8200, 2500, 28, 'Confirm glass dimensions', 'Waiting on glass vendor', 'gold'),
(3, 'RB-247', 'Lighted studio sign', 'Stride Fitness', 'Finish', 'Finishing', '2026-08-28', 'Aug 28', 16, 13, 3.5, 1750, 875, 84, 'Wire LED backer', '', 'green'),
(4, 'RB-250', 'Rutgers shotski batch', 'Alumni Group', 'Proof', 'Awaiting approval', '2026-09-04', 'Sep 4', 11, 2, 9, 1480, 740, 18, 'Release engraving files', 'Customer approval overdue', 'blue'),
(5, 'RB-252', 'Anniversary serving board', 'S. Morgan', 'Queued', 'Materials ready', '2026-08-26', 'Aug 26', 4.5, 0.5, 4, 245, 245, 12, 'Engrave handwriting', '', 'gray');
