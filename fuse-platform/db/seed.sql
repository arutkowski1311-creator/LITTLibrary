-- ============================================================================
-- Fuse Platform — dev seed. Fake but realistic data so the app has content on
-- first load. No real people's data; NJ Raw is the demo org.
-- Idempotent-ish: run against a freshly migrated database.
-- ============================================================================

-- Identity ------------------------------------------------------------------
insert into auth.users(id) values
  ('a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000003');

insert into app_user(id, full_name, email) values
  ('a0000000-0000-4000-8000-000000000001','Adam Rutkowski','adam@njraw.example'),
  ('a0000000-0000-4000-8000-000000000002','Jason Roman','jason@njraw.example'),
  ('a0000000-0000-4000-8000-000000000003','Nick Rutkowski','nick@njraw.example');

insert into platform_admin(user_id) values ('a0000000-0000-4000-8000-000000000001');

-- Organization + team + roster ----------------------------------------------
insert into organization(id, public_name, legal_name, entity_type, jurisdiction, brand_primary, brand_accent) values
  ('11111111-1111-1111-1111-111111111111','NJ Raw','NJ Raw Baseball Club Inc.','nonprofit_501c3','US-NJ','#F6A93B','#FF6A2B');

insert into membership(org_id, user_id, role) values
  ('11111111-1111-1111-1111-111111111111','a0000000-0000-4000-8000-000000000001','org_owner'),
  ('11111111-1111-1111-1111-111111111111','a0000000-0000-4000-8000-000000000002','team_manager');

insert into team(id, org_id, name, program, season) values
  ('22222222-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','NJ Raw 12U','Travel','2026'),
  ('22222222-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','NJ Raw 14U','Travel','2026');

-- Plans + subscriptions -----------------------------------------------------
insert into plan(id, audience, code, name, modules) values
  ('30000000-0000-4000-8000-000000000001','org','org_pro','Org Pro',
    array['golf','raffle','auction','store','streaming','fuse','sponsorship','dashboard']),
  ('30000000-0000-4000-8000-000000000002','consumer','parent_stream','Parent Stream',
    array['streaming','raw_report','clips']);
insert into plan(id, audience, code, name, modules, org_id) values
  ('30000000-0000-4000-8000-000000000003','consumer','njraw_booster','NJ Raw Booster',
    array['streaming','raw_report'],'11111111-1111-1111-1111-111111111111');

insert into subscription(plan_id, org_id, status) values
  ('30000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','active');

-- Compliance switchboard -----------------------------------------------------
insert into jurisdiction_rule(jurisdiction, module, allowed, requires_license, min_age) values
  ('US-NJ','raffle', true, true, 18);

-- Golf course network --------------------------------------------------------
insert into golf_course(id, name, location, min_players, max_players, amenities) values
  ('40000000-0000-4000-8000-000000000001','Beaver Brook Country Club','Clinton, NJ',72,144,
    array['Driving range','Pro shop','Banquet hall']);
insert into golf_package(id, course_id, name, green_fee_cents, cart_cents, food_cents, beverage_cents, includes) values
  ('41000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Shotgun + Dinner',
    12000,2500,3500,1500,'{"range":true,"prizes":true,"gratuity_included":true}');
insert into golf_availability(course_id, date, is_blackout)
  select '40000000-0000-4000-8000-000000000001', d::date, false
  from generate_series(timestamp '2026-09-01', timestamp '2026-10-15', interval '1 week') d;

-- Golf outing (the first vertical slice) -------------------------------------
insert into campaign(id, org_id, type, title, slug, goal_cents, status) values
  ('50000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','golf',
    'Get RAW at The Beav','golf-2026',2000000,'published');
insert into event(id, org_id, campaign_id, name, starts_at, location, capacity) values
  ('51000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111',
    '50000000-0000-4000-8000-000000000001','Get RAW at The Beav', timestamptz '2026-10-13 08:00-04',
    'Beaver Brook CC',144);
insert into golf_outing(id, org_id, event_id, course_id, package_id, proposed_date, deposit_cents, go_no_go_deadline) values
  ('52000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111',
    '51000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001', date '2026-10-13', 100000, date '2026-09-22');

insert into package(id, org_id, campaign_id, event_id, kind, name, price_cents, qty_total, exclusive_category) values
  ('53000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','registration','Foursome',60000,36,null),
  ('53000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','registration','Individual Golfer',15000,20,null),
  ('53000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','sponsorship','Title Sponsor',250000,1,'title'),
  ('53000000-0000-4000-8000-000000000004','11111111-1111-1111-1111-111111111111','50000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','sponsorship','Hole Sponsor',25000,18,null);

-- Supporters -----------------------------------------------------------------
insert into supporter(id, org_id, user_id, full_name, email) values
  ('60000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','a0000000-0000-4000-8000-000000000002','Jason Roman','jason@njraw.example'),
  ('60000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111',null,'Coach Mike','mike@njraw.example'),
  ('60000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','a0000000-0000-4000-8000-000000000001','Adam Rutkowski','adam@njraw.example');

-- Raffle (published through the compliance gate) -----------------------------
insert into campaign(id, org_id, type, title, slug, goal_cents, status) values
  ('50000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','raffle',
    'Season Kickoff Raffle','raffle-2026',1500000,'draft');
insert into raffle(id, campaign_id, org_id, license_number, draw_at) values
  ('54000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111','NJ-RL-2026-0042', timestamptz '2026-11-30 19:00-05');
insert into raffle_prize(raffle_id, title, fmv_cents, winner_order) values
  ('54000000-0000-4000-8000-000000000001','Signed Team Jersey',20000,1),
  ('54000000-0000-4000-8000-000000000001','Season Pass',50000,2);
insert into raffle_rule_version(raffle_id, version, body, published_at) values
  ('54000000-0000-4000-8000-000000000001',1,'Official rules: 18+, NJ residents, no purchase necessary...', now());
-- entry package: $5 per ticket, unlimited (revenue flows through the shared spine)
insert into package(id, org_id, campaign_id, kind, name, price_cents, qty_total) values
  ('53000000-0000-4000-8000-000000000005','11111111-1111-1111-1111-111111111111','50000000-0000-4000-8000-000000000002','entry','Raffle Ticket',500,null);
update campaign set status='published' where id='50000000-0000-4000-8000-000000000002';
insert into raffle_entry(raffle_id, org_id, supporter_id, entry_number, rules_version)
  select '54000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111',
         '60000000-0000-4000-8000-000000000001', g, 1
  from generate_series(1,50) g;

-- Auction --------------------------------------------------------------------
insert into campaign(id, org_id, type, title, slug, status) values
  ('50000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','auction',
    'Fall Gala Auction','auction-2026','published');
insert into auction(id, campaign_id, org_id, mode, anti_snipe_seconds) values
  ('55000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111','silent',120);
insert into auction_item(id, auction_id, org_id, title, fmv_cents, reserve_cents, min_bid_cents, increment_cents, closes_at) values
  ('56000000-0000-4000-8000-000000000001','55000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','Signed Jersey',30000,10000,5000,2500, now()+interval '5 days'),
  ('56000000-0000-4000-8000-000000000002','55000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','Batting Lesson x4',40000,15000,7500,2500, now()+interval '5 days');
