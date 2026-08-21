CREATE TABLE `catalog_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`detail` text NOT NULL,
	`price` real NOT NULL,
	`inventory` integer DEFAULT 0 NOT NULL,
	`lead_time_days` integer DEFAULT 10 NOT NULL,
	`materials` text DEFAULT '' NOT NULL,
	`options_json` text DEFAULT '[]' NOT NULL,
	`image` text NOT NULL,
	`alt` text NOT NULL,
	`badge` text DEFAULT 'Custom' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_products_slug_unique` ON `catalog_products` (`slug`);--> statement-breakpoint
CREATE TABLE `communications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`channel` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'drafted' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`shipping_address` text DEFAULT '' NOT NULL,
	`billing_address` text DEFAULT '' NOT NULL,
	`total_spent` real DEFAULT 0 NOT NULL,
	`credit_balance` real DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `design_briefs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`dimensions` text DEFAULT '' NOT NULL,
	`materials` text DEFAULT '' NOT NULL,
	`customization` text DEFAULT '' NOT NULL,
	`rendering_image` text DEFAULT '' NOT NULL,
	`timeline` text DEFAULT '' NOT NULL,
	`payment_status` text DEFAULT 'Deposit due' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `design_briefs_project_id_unique` ON `design_briefs` (`project_id`);--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `customer_phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `customer_id` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `kind` text DEFAULT 'Commission' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `priority` text DEFAULT 'Standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `delivery_speed` text DEFAULT 'Standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `order_status` text DEFAULT 'Open' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `payment_status` text DEFAULT 'Deposit due' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `shipping_address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `materials_needed` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `projects` SET `customer_phone`='908-555-0142', `kind`='Commission', `priority`='Standard', `delivery_speed`='Freight', `order_status`='Open', `payment_status`='50% paid', `shipping_address`='Morristown, NJ', `materials_needed`='Fire-truck rear panel · steel tube · walnut' WHERE `id`=1;--> statement-breakpoint
UPDATE `projects` SET `customer_phone`='201-555-0188', `kind`='Commission', `priority`='Standard', `delivery_speed`='White glove', `order_status`='Hold', `payment_status`='Deposit paid', `shipping_address`='Hoboken, NJ', `materials_needed`='Aircraft wing · tempered glass · steel legs' WHERE `id`=2;--> statement-breakpoint
UPDATE `projects` SET `customer_phone`='973-555-0126', `kind`='Semi-custom', `priority`='Rush', `delivery_speed`='Rush · 3 day', `order_status`='Open', `payment_status`='Paid', `shipping_address`='Montclair, NJ', `materials_needed`='Black acrylic · LED strip · oak backer', `due`='2026-08-23', `due_label`='3 days', `paid`=1750 WHERE `id`=3;--> statement-breakpoint
UPDATE `projects` SET `name`='Colorado shotski', `customer`='A. Sullivan', `customer_email`='asullivan@example.com', `customer_phone`='908-555-0171', `kind`='Semi-custom', `priority`='Expedited', `delivery_speed`='Priority · 6 day', `order_status`='Approval', `payment_status`='Paid', `shipping_address`='Boulder, CO', `materials_needed`='Vintage ski · 4 shot cups · CU colors', `due`='2026-08-27', `due_label`='7 days', `estimate`=7, `remaining`=5, `value`=285, `paid`=285 WHERE `id`=4;--> statement-breakpoint
UPDATE `projects` SET `customer_email`='smorgan@example.com', `customer_phone`='732-555-0193', `kind`='Semi-custom', `priority`='Rush', `delivery_speed`='Rush · 3 day', `order_status`='Open', `payment_status`='Paid', `shipping_address`='Princeton, NJ', `materials_needed`='Walnut blank · food-safe oil', `due`='2026-08-22', `due_label`='2 days' WHERE `id`=5;--> statement-breakpoint
INSERT INTO `customers` (`id`,`name`,`email`,`phone`,`shipping_address`,`billing_address`,`total_spent`,`credit_balance`,`notes`) VALUES
(1,'M. Delaney','m.delaney@example.com','908-555-0142','Morristown, NJ','Same as shipping',3200,0,'Firehouse bar commission'),
(2,'J. Archer','j.archer@example.com','201-555-0188','Hoboken, NJ','Same as shipping',2500,0,'Aviation collector'),
(3,'Stride Fitness','studio@stride.example','973-555-0126','Montclair, NJ','Same as shipping',1750,0,'Commercial signage'),
(4,'A. Sullivan','asullivan@example.com','908-555-0171','Boulder, CO','Same as shipping',285,0,'University of Colorado shotski'),
(5,'S. Morgan','smorgan@example.com','732-555-0193','Princeton, NJ','Same as shipping',245,0,'Anniversary gift');--> statement-breakpoint
INSERT INTO `catalog_products` (`slug`,`name`,`category`,`detail`,`price`,`inventory`,`lead_time_days`,`materials`,`options_json`,`image`,`alt`,`badge`,`active`) VALUES
('shotski','Custom vintage shotski','Ski & college','School colors, crest, names and 3–5 glasses',195,12,10,'Vintage ski · glass holders · engraved hardwood','["College or custom theme","3, 4 or 5 glasses","Standard, priority or rush"]','/assets/ski-display.webp','Vintage ski transformed into a custom shotski','College favorite',1),
('serving-board','Story serving board','Gifts','Names, dates, handwriting, logos or artwork',92,18,7,'Maple, walnut or cherry · food-safe finish','["Wood species","Size","Engraving style"]','/assets/charcuterie-board.webp','Custom engraved wood serving board','Gift-ready',1),
('guitar-hanger','Engraved guitar hanger','Music','Choose wood, instrument mark and message',78,8,7,'Hardwood · steel hardware · felt','["Wood species","Engraving","Hardware finish"]','/assets/guitar-hanger.webp','Custom engraved guitar wall hanger','Bestseller',1),
('lighted-sign','Custom lighted sign','Signs','Your mark, colors and lighting style',245,6,14,'Wood or acrylic · concealed LED','["Size","Material","Light color","Branding"]','/assets/lighted-sign.webp','Custom illuminated wall sign','Made to order',1),
('house-sign','Custom house sign','Signs','Weather-ready and built for the place',185,10,10,'Exterior hardwood · metal · marine finish','["Shape","Address or name","Mounting"]','/assets/house-sign.webp','Round custom address sign','Custom',1),
('ski-display','Ski display stand','Ski & college','Built around the ski and its story',165,5,12,'Reclaimed ski · hardwood base','["Ski selection","Plaque","Finish"]','/assets/ski-display.webp','Custom ski display stand','Limited',1),
('retail-display','Custom retail display','Business','Purpose-built merchandising for shops and events',325,4,18,'Hardwood · CNC fabrication','["Footprint","Product count","Logo engraving"]','/assets/custom-store-display.webp','Custom wood retail display','Small batch',1),
('heirloom-light','Heirloom light conversion','Furniture & lighting','Antique fixtures reworked into one-of-one lighting',850,2,30,'Client or sourced antique · timber · UL-rated wiring','["Fixture sourcing","Beam size","Finish"]','/assets/antique-chandelier-light.webp','Antique lantern chandelier on reclaimed wood','Commission',1);
