-- Order reference generation (§16.2) + Row Level Security (§30.2)

-- ── order reference: DC-YYMM-NNNN, zero-padded, resets each month ──
create table order_ref_counters (
  yymm text primary key,
  next_val int not null default 1
);

create or replace function generate_order_ref()
returns text
language plpgsql
as $$
declare
  v_yymm text := to_char(now() at time zone 'Asia/Kolkata', 'YYMM');
  v_seq int;
begin
  insert into order_ref_counters (yymm, next_val)
  values (v_yymm, 2)
  on conflict (yymm) do update set next_val = order_ref_counters.next_val + 1
  returning (next_val - 1) into v_seq;

  return 'DC-' || v_yymm || '-' || lpad(v_seq::text, 4, '0');
end;
$$;

alter table orders alter column order_ref set default generate_order_ref();

-- ── Row Level Security ──────────────────────────────────────────────
-- Public (anon) reads are limited to active catalogue data. Every write —
-- and every read of orders/customers/captains/admin data — goes through a
-- server-side route handler using the service role key, which bypasses RLS
-- by design. RLS here is the backstop if a client ever queries Postgres
-- directly (§30.2).

alter table categories enable row level security;
alter table products enable row level security;
alter table price_history enable row level security;
alter table customers enable row level security;
alter table captains enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table captain_clicks enable row level security;
alter table admin_users enable row level security;
alter table settings enable row level security;
alter table order_ref_counters enable row level security;

create policy "public can read active categories"
  on categories for select
  to anon, authenticated
  using (is_active = true);

create policy "public can read active priced products"
  on products for select
  to anon, authenticated
  using (status = 'active');

-- No policies are created granting anon/authenticated access to
-- price_history, customers, captains, orders, order_items, captain_clicks,
-- admin_users, settings or order_ref_counters. Absence of a policy means
-- access is denied by default once RLS is enabled — this is deliberate.
