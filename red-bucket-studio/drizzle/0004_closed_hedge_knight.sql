ALTER TABLE `projects` ADD `board_hidden` integer DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE `projects` SET `status`='Fabricate', `stage`='Fabricate', `progress`=50, `next_action`='Advance to Package' WHERE `status`='Build';
--> statement-breakpoint
UPDATE `projects` SET `status`='Design', `stage`='Design', `progress`=33, `next_action`='Advance to Fabricate' WHERE `status` IN ('Proof','Design');
--> statement-breakpoint
UPDATE `projects` SET `status`='Package', `stage`='Package', `progress`=67, `next_action`='Advance to Ship' WHERE `status`='Finish';
--> statement-breakpoint
UPDATE `projects` SET `status`='Confirm materials', `stage`='Confirm materials', `progress`=17, `next_action`='Advance to Design' WHERE `status`='Queued';
--> statement-breakpoint
UPDATE `projects` SET `status`='Ship', `stage`='Ship', `progress`=83, `next_action`='Advance to Complete' WHERE `status`='Delivery';
--> statement-breakpoint
INSERT INTO `projects` (`code`,`name`,`customer`,`customer_email`,`customer_phone`,`kind`,`priority`,`delivery_speed`,`order_status`,`payment_status`,`shipping_address`,`materials_needed`,`status`,`stage`,`due`,`due_label`,`estimate`,`logged`,`remaining`,`value`,`paid`,`progress`,`next_action`,`blocker`,`color`,`created_at`) VALUES
('RB-255','Bourbon heritage chest','T. Brennan','tbrennan@example.com','908-555-0108','Semi-custom','Standard','Standard','Open','Paid','Bernardsville, NJ','Vintage chest · walnut insert · hardware','Confirm materials','Confirm materials','2026-09-03','Sep 3',14,3,11,425,425,17,'Advance to Design','','green','2026-08-18 09:12:00'),
('RB-256','Restaurant blade sign','Field & Flame','hello@fieldandflame.example','973-555-0114','Commercial','Expedited','Priority','Open','Deposit paid','Madison, NJ','Steel bracket · cedar · warm LED','Design','Design','2026-09-11','Sep 11',31,8,23,3900,1950,33,'Advance to Fabricate','Confirm electrical feed','gold','2026-08-19 13:42:00'),
('RB-258','Wedding time-capsule box','C. Reyes','creyes@example.com','732-555-0162','Semi-custom','Rush','Rush','Open','Paid','Red Bank, NJ','White oak · aged brass · velvet lining','Ordered','Ordered','2026-08-28','Aug 28',9,0,9,325,325,0,'Advance to Confirm materials','','red','2026-08-20 08:25:00');
