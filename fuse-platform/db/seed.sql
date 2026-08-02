-- ============================================================================
-- Fuse Platform — dev seed. Fake but realistic data so the app has content on
-- first load. No real people's data; NJ Raw is the demo org.
-- Idempotent-ish: run against a freshly migrated database.
-- ============================================================================

-- Identity ------------------------------------------------------------------
insert into auth.users(id) values
  ('a0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000004');

insert into app_user(id, full_name, email) values
  ('a0000000-0000-4000-8000-000000000001','Adam Rutkowski','adam@njraw.example'),
  ('a0000000-0000-4000-8000-000000000002','Jason Roman','jason@njraw.example'),
  ('a0000000-0000-4000-8000-000000000003','Nick Rutkowski','nick@njraw.example'),
  -- Fresh organizer with no org membership yet — used to demo onboarding.
  ('a0000000-0000-4000-8000-000000000004','Taylor Chen','taylor@example.com');

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

-- Players (for store attribution / credit leaderboards)
insert into auth.users(id) values
  ('a0000000-0000-4000-8000-000000000101'),
  ('a0000000-0000-4000-8000-000000000102');
insert into app_user(id, full_name) values
  ('a0000000-0000-4000-8000-000000000101','Mason Roman'),
  ('a0000000-0000-4000-8000-000000000102','Myles Roman');
insert into membership(org_id, user_id, role, team_id) values
  ('11111111-1111-1111-1111-111111111111','a0000000-0000-4000-8000-000000000003','player','22222222-0000-4000-8000-000000000001'),
  ('11111111-1111-1111-1111-111111111111','a0000000-0000-4000-8000-000000000101','player','22222222-0000-4000-8000-000000000001'),
  ('11111111-1111-1111-1111-111111111111','a0000000-0000-4000-8000-000000000102','player','22222222-0000-4000-8000-000000000001');

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

-- Sponsors (CRM) + deliverables (proof of performance)
insert into sponsor(id, org_id, business, contact_name, contact_email, category, renewal_date, notes) values
  ('70000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','Clinton Auto Group','Dana Ruiz','dana@clintonauto.example','auto_dealer', date '2026-12-01','Title sponsor 3 years running'),
  ('70000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','Riverside Pediatrics','Dr. Patel','patel@rvped.example','healthcare', date '2026-11-15','Interested in streaming ads'),
  ('70000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','Hometown Bank','Sam Cole','sam@htbank.example','financial', date '2027-01-10', null);
insert into sponsor_deliverable(org_id, sponsor_id, campaign_id, description, status, due_date) values
  ('11111111-1111-1111-1111-111111111111','70000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Logo on event banner','fulfilled', date '2026-10-01'),
  ('11111111-1111-1111-1111-111111111111','70000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Hole 9 signage photo','pending', date '2026-10-13'),
  ('11111111-1111-1111-1111-111111111111','70000000-0000-4000-8000-000000000002',null,'Streaming lower-third (5 games)','in_progress', date '2026-11-01');

-- ============================ Sports operations ============================
-- RAW model v2: three weighted pillars
insert into raw_pillar(code, name, weight, sort) values
  ('phys','Physical',0.30,1),('tech','Technical',0.40,2),('psych','Psychological',0.30,3);

-- Domains under pillars (psychological expanded into 7 coach-rated sub-traits)
insert into raw_domain(code, name, weight, pillar_id, kind, sort)
select v.code, v.name, v.weight, (select id from raw_pillar where code=v.pillar), v.kind, v.sort
from (values
  ('spd','Speed',1.0,'phys','objective',1),
  ('pow','Power',1.1,'phys','objective',2),
  ('arm','Arm',0.9,'phys','objective',3),
  ('ath','Athleticism',1.0,'phys','subjective',4),
  ('hit','Hitting',1.2,'tech','objective',1),
  ('fld','Fielding',1.0,'tech','subjective',2),
  ('thr','Throwing',0.9,'tech','subjective',3),
  ('iq','Baseball IQ',1.0,'tech','subjective',4),
  ('cmp','Compete',1.2,'psych','subjective',1),
  ('coa','Coachability',1.0,'psych','subjective',2),
  ('res','Resilience',1.1,'psych','subjective',3),
  ('foc','Focus',1.0,'psych','subjective',4),
  ('poi','Poise',1.0,'psych','subjective',5),
  ('eth','Work Ethic',1.0,'psych','subjective',6),
  ('ldr','Leadership',0.9,'psych','subjective',7)
) as v(code,name,weight,pillar,kind,sort);

-- Latest RAW scores for the three players (deterministic pseudo-values 45-95)
insert into raw_score(org_id, player_id, domain_id, score, as_of, method)
select '11111111-1111-1111-1111-111111111111', pl.id, d.id,
       45 + (abs(hashtext(pl.id::text || d.code)) % 51), date '2026-07-15','coach'
from (values ('a0000000-0000-4000-8000-000000000003'::uuid),
             ('a0000000-0000-4000-8000-000000000101'::uuid),
             ('a0000000-0000-4000-8000-000000000102'::uuid)) pl(id)
cross join raw_domain d;

-- Games
insert into game(id, org_id, team_id, opponent, starts_at, location, home, status, us_runs, them_runs, inning) values
  ('80000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','22222222-0000-4000-8000-000000000001','Hunterdon Heat', now()-interval '3 days','Diamond 1', true,'final',7,4,7),
  ('80000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','22222222-0000-4000-8000-000000000001','Warren Wave', now()+interval '2 days','Away', false,'scheduled',0,0,1);

-- Box score for the completed game
insert into player_game_stat(org_id, game_id, player_id, ab,h,b2,b3,hr,rbi,bb,so,r,sb) values
  ('11111111-1111-1111-1111-111111111111','80000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003',4,2,1,0,1,3,0,1,2,1),
  ('11111111-1111-1111-1111-111111111111','80000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000101',3,1,0,0,0,1,1,0,1,0),
  ('11111111-1111-1111-1111-111111111111','80000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000102',4,3,1,0,0,2,0,0,2,2);

-- Training
insert into workout(id, org_id, name, category, description) values
  ('90000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','Tee Work — Oppo Field','Hitting','3x15 balls driven to the opposite field'),
  ('90000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','Sprint Ladder','Speed','6x60ft sprints, full recovery'),
  ('90000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','Long Toss Progression','Arm','Build out to 120ft, controlled');
insert into workout_assignment(id, org_id, workout_id, player_id, assigned_by, due_date) values
  ('91000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','90000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001', date '2026-08-05'),
  ('91000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','90000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001', date '2026-08-06'),
  ('91000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','90000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000101','a0000000-0000-4000-8000-000000000001', date '2026-08-05');
insert into workout_log(org_id, assignment_id, player_id, logged_on, completed, notes) values
  ('11111111-1111-1111-1111-111111111111','91000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003', date '2026-08-01', true,'42/45 solid contact, stayed inside the ball');

-- Schedule (practices / tournament) + a couple RSVPs
insert into schedule_event(id, org_id, team_id, type, title, starts_at, location, notes) values
  ('a1000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','22222222-0000-4000-8000-000000000001','practice','Tuesday Practice', now()+interval '1 day', 'Diamond 2','Hitting + baserunning'),
  ('a1000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','22222222-0000-4000-8000-000000000001','practice','Thursday Practice', now()+interval '3 days', 'Diamond 2','Defense focus'),
  ('a1000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','22222222-0000-4000-8000-000000000001','tournament','Labor Day Classic', now()+interval '10 days', 'Flemington Sportsplex','Pool play Sat, brackets Sun');
insert into rsvp(org_id, schedule_event_id, user_id, status) values
  ('11111111-1111-1111-1111-111111111111','a1000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','yes'),
  ('11111111-1111-1111-1111-111111111111','a1000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000101','yes'),
  ('11111111-1111-1111-1111-111111111111','a1000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000102','maybe');
