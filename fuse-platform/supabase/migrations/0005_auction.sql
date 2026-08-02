-- ============================================================================
-- Fuse Platform — Migration 0005: Auction engine (concurrency-safe bidding)
--
-- AUCT-001 requires the highest eligible bid to stay consistent under
-- concurrent use. The guarantee here: place_bid() locks the item row with
-- SELECT ... FOR UPDATE, so simultaneous bids on the same lot serialize —
-- each sees the prior winner before deciding. Proxy (max) bidding and
-- anti-snipe extension (AUCT-002) live inside that same critical section.
-- ============================================================================

create type auction_mode      as enum ('live','silent','hybrid','online');
create type auction_item_state as enum ('open','sold','unsold','canceled');

-- 1:1 with a campaign of type 'auction'.
create table auction (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null unique references campaign(id) on delete cascade,
  org_id            uuid not null references organization(id) on delete cascade,
  mode              auction_mode not null default 'silent',
  anti_snipe_seconds int not null default 120,     -- 0 disables extension
  created_at        timestamptz not null default now()
);
create index on auction (org_id);

create table auction_item (
  id                 uuid primary key default gen_random_uuid(),
  auction_id         uuid not null references auction(id) on delete cascade,
  org_id             uuid not null references organization(id) on delete cascade,
  title              text not null,
  fmv_cents          bigint not null default 0,
  reserve_cents      bigint not null default 0,
  min_bid_cents      bigint not null default 100,
  increment_cents    bigint not null default 100,
  buy_now_cents      bigint,                        -- null = no buy-now
  donor              text,
  media              jsonb not null default '[]',
  state              auction_item_state not null default 'open',
  closes_at          timestamptz,
  current_bid_cents  bigint,                        -- visible price
  current_max_cents  bigint,                        -- leader's hidden ceiling (proxy)
  current_bidder     uuid references supporter(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index on auction_item (auction_id);

create table bid (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references auction_item(id) on delete cascade,
  bidder_id     uuid not null references supporter(id) on delete restrict,
  amount_cents  bigint not null,                    -- resulting visible price
  max_cents     bigint not null,                    -- this bidder's ceiling
  created_at    timestamptz not null default now()
);
create index on bid (item_id, created_at);

alter table auction      enable row level security;
alter table auction_item enable row level security;
create policy auction_rw      on auction      using (is_org_member(org_id) or is_platform_admin()) with check (is_org_member(org_id) or is_platform_admin());
-- Items are publicly readable (bidders browse lots); writes go through place_bid.
create policy auction_item_read  on auction_item for select using (true);
create policy auction_item_write on auction_item for all
  using (is_org_member(org_id) or is_platform_admin())
  with check (is_org_member(org_id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- place_bid — the critical section. Returns a jsonb result describing the
-- outcome. Proxy semantics (eBay-style):
--   * First valid bid: price = max(min_bid, reserve floor is separate); leader = bidder.
--   * Challenger max beats leader max  -> challenger leads; price = min(challenger max,
--     leader max + increment).
--   * Challenger max does NOT beat leader -> leader stays; price rises to
--     min(leader max, challenger max + increment); challenger is outbid.
--   * Anti-snipe: a successful bid inside the window pushes closes_at out.
-- ---------------------------------------------------------------------------
create or replace function place_bid(p_item uuid, p_bidder uuid, p_max bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  it            auction_item%rowtype;
  v_new_price   bigint;
  v_leader      uuid;
  v_leader_max  bigint;
  v_extended    boolean := false;
begin
  -- Serialize concurrent bids on this lot.
  select * into it from auction_item where id = p_item for update;
  if it.id is null then raise exception 'item % not found', p_item; end if;
  if it.state <> 'open' then return jsonb_build_object('accepted', false, 'reason', 'closed'); end if;
  if it.closes_at is not null and it.closes_at <= now() then
    return jsonb_build_object('accepted', false, 'reason', 'ended');
  end if;

  -- First bid on the lot.
  if it.current_bidder is null then
    if p_max < it.min_bid_cents then
      return jsonb_build_object('accepted', false, 'reason', 'below_min', 'min_cents', it.min_bid_cents);
    end if;
    v_new_price  := greatest(it.min_bid_cents, it.reserve_cents);
    v_new_price  := least(v_new_price, p_max);       -- never charge above the bidder's ceiling
    v_leader     := p_bidder;
    v_leader_max := p_max;
  else
    -- Must beat the current price by at least one increment.
    if p_max < it.current_bid_cents + it.increment_cents then
      return jsonb_build_object('accepted', false, 'reason', 'below_increment',
                                'need_cents', it.current_bid_cents + it.increment_cents);
    end if;

    if p_bidder = it.current_bidder then
      -- Same leader raising their own ceiling; price unchanged.
      v_leader := p_bidder; v_leader_max := greatest(p_max, it.current_max_cents);
      v_new_price := it.current_bid_cents;
    elsif p_max > it.current_max_cents then
      -- Challenger outbids the leader's proxy.
      v_leader := p_bidder; v_leader_max := p_max;
      v_new_price := least(p_max, it.current_max_cents + it.increment_cents);
    else
      -- Leader's proxy holds; challenger only pushes the price up.
      v_leader := it.current_bidder; v_leader_max := it.current_max_cents;
      v_new_price := least(it.current_max_cents, p_max + it.increment_cents);
    end if;
  end if;

  insert into bid (item_id, bidder_id, amount_cents, max_cents)
  values (p_item, p_bidder, v_new_price, p_max);

  -- Anti-snipe: extend the close if the bid landed inside the window.
  if it.closes_at is not null and it.auction_id is not null then
    if it.closes_at - now() < make_interval(secs => (
         select anti_snipe_seconds from auction where id = it.auction_id))
       and (select anti_snipe_seconds from auction where id = it.auction_id) > 0 then
      it.closes_at := now() + make_interval(secs => (
        select anti_snipe_seconds from auction where id = it.auction_id));
      v_extended := true;
    end if;
  end if;

  update auction_item
    set current_bid_cents = v_new_price,
        current_max_cents  = v_leader_max,
        current_bidder     = v_leader,
        closes_at          = it.closes_at
    where id = p_item;

  return jsonb_build_object(
    'accepted', true,
    'price_cents', v_new_price,
    'leader', v_leader,
    'you_are_winning', (v_leader = p_bidder),
    'extended', v_extended
  );
end $$;

-- Close a lot: sold if the price cleared the reserve, else unsold.
create or replace function auction_close_item(p_item uuid)
returns auction_item_state language plpgsql security definer set search_path = public as $$
declare it auction_item%rowtype; v_state auction_item_state;
begin
  select * into it from auction_item where id = p_item for update;
  if it.id is null then raise exception 'item % not found', p_item; end if;
  if not is_org_member(it.org_id) and not is_platform_admin() then
    raise exception 'not authorized';
  end if;

  if it.current_bidder is not null and it.current_bid_cents >= it.reserve_cents then
    v_state := 'sold';
  else
    v_state := 'unsold';
  end if;

  update auction_item set state = v_state where id = p_item;

  insert into audit_log (org_id, actor_user, action, object_type, object_id, new_state)
  values (it.org_id, auth.uid(), 'auction.close', 'auction_item', p_item,
          jsonb_build_object('state', v_state, 'price_cents', it.current_bid_cents,
                             'winner', it.current_bidder));
  return v_state;
end $$;
