-- Sree Sai Ram commission-pricing model + supplier-payable order tracking.
--
-- Business model: Kolagalam takes the enquiry, pays the supplier (Sree Sai
-- Ram Crackers, trading also as Kids Crackers Park) their rate, the supplier
-- ships directly to the customer, and Kolagalam keeps the difference as
-- commission. This migration adds per-product MRP/discount/markup, a
-- private supplier-discount setting, a public-safe read surface, and the
-- order-time supplier/commission snapshot + fulfilment tracking needed to
-- know exactly what to pay the supplier and what was kept.

-- ── products: MRP + per-product discount/markup ─────────────────────
alter table products
  add column if not exists mrp numeric(10, 2),
  add column if not exists discount_percent numeric(5, 2) not null default 80
    check (discount_percent between 0 and 100),
  add column if not exists net_markup_percent numeric(5, 2) not null default 10
    check (net_markup_percent between 0 and 100);

-- `price` (the customer-facing price) is trigger-maintained from mrp,
-- is_discountable, discount_percent and net_markup_percent — all per-row,
-- so no cross-table lookup is needed and no cascade is triggered when the
-- global supplier discount changes (that only affects supplier_price /
-- commission, computed at read time, never stored on this table).
create or replace function compute_product_customer_price()
returns trigger
language plpgsql
as $$
begin
  if new.mrp is null then
    new.price := null;
  elsif new.is_discountable then
    new.price := round(new.mrp * (100 - new.discount_percent) / 100);
  else
    new.price := round(new.mrp * (100 + new.net_markup_percent) / 100);
  end if;
  return new;
end;
$$;

drop trigger if exists products_compute_price on products;
create trigger products_compute_price
  before insert or update of mrp, is_discountable, discount_percent, net_markup_percent
  on products
  for each row execute function compute_product_customer_price();

-- ── pricing_settings: private, service-role only ────────────────────
-- Deliberately NOT the existing `settings` key-value table, which has an
-- anon-read RLS policy (20260909000004_settings_public_read.sql) — the
-- supplier discount is exactly the number that must never reach a client.
create table pricing_settings (
  id boolean primary key default true check (id),  -- singleton row
  supplier_discount_percent numeric(5, 2) not null default 90
    check (supplier_discount_percent between 0 and 100),
  default_discount_percent numeric(5, 2) not null default 80
    check (default_discount_percent between 0 and 100),
  default_net_markup_percent numeric(5, 2) not null default 10
    check (default_net_markup_percent between 0 and 100),
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into pricing_settings (id) values (true);

alter table pricing_settings enable row level security;
-- No anon/authenticated policies at all — service role only, by design.

-- ── public_products: the only thing the storefront reads ────────────
-- The category is embedded directly as jsonb rather than left as a plain
-- category_id for PostgREST to resolve — a view has no real foreign key for
-- PostgREST's embedding/relationship detection to key off, so `.select("*,
-- category:categories(...)")` against this view cannot be relied on. This
-- way the view is self-contained and the client-side shape never depends on
-- how PostgREST happens to introspect a view's lineage.
create view public_products as
select
  p.id,
  p.sku,
  p.slug,
  p.name_en,
  p.name_ta,
  p.category_id,
  p.unit,
  p.status,
  p.is_bestseller,
  p.is_featured,
  p.min_qty,
  p.image_url,
  p.image_urls,
  p.video_url,
  p.description,
  p.display_order,
  p.price,
  -- Whether an item is discountable vs net-rate is fine to expose (it's a
  -- category-level fact, not a number) — only the MRP/discount-% themselves
  -- are withheld for net-rate items, since is_discountable=false means mrp
  -- IS the supplier's real net rate.
  p.is_discountable,
  case when p.is_discountable then p.mrp end as mrp,
  case when p.is_discountable then p.discount_percent end as discount_percent,
  jsonb_build_object('id', c.id, 'slug', c.slug, 'name_en', c.name_en, 'name_ta', c.name_ta) as category
from products p
join categories c on c.id = p.category_id
-- Row-existence filtering (active-only for listings) stays the caller's job,
-- same as it is against the base table today — this view's job is column
-- redaction. Archived (retired-catalogue) products are the one row-level
-- exclusion made here, since nothing customer-facing should ever see them.
where p.status <> 'archived';

grant select on public_products to anon, authenticated;

-- Storefront now reads exclusively through the view above — remove the
-- base table's anon/authenticated policy so a client can no longer select
-- supplier-facing columns (mrp of net-rate items, discount/markup %, etc.)
-- directly off `products`.
drop policy if exists "public can read active priced products" on products;

-- ── orders: supplier-payable + fulfilment tracking ──────────────────
alter table orders
  add column if not exists state text,
  add column if not exists supplier_total numeric(12, 2),
  add column if not exists commission_total numeric(12, 2),
  add column if not exists mrp_total numeric(12, 2),
  add column if not exists you_save numeric(12, 2),
  add column if not exists pricing_estimated boolean not null default false,
  add column if not exists supplier_payment_status text not null default 'pending'
    check (supplier_payment_status in ('pending', 'paid')),
  add column if not exists supplier_paid_amount numeric(12, 2),
  add column if not exists supplier_paid_at timestamptz,
  add column if not exists supplier_payment_ref text,
  add column if not exists lr_number text,
  add column if not exists transport_name text,
  add column if not exists tracking_url text,
  add column if not exists dispatched_at timestamptz;

-- ── order_items: per-line supplier/commission snapshot ──────────────
alter table order_items
  add column if not exists unit_mrp numeric(10, 2),
  add column if not exists discount_percent numeric(5, 2),
  add column if not exists net_markup_percent numeric(5, 2),
  add column if not exists unit_supplier_price numeric(10, 2),
  add column if not exists line_supplier_total numeric(12, 2),
  add column if not exists line_commission numeric(12, 2);

-- ── Backfill existing orders (a handful, all placed this week, none of
-- them under the new pricing model) with an ESTIMATE from today's default
-- 80%/90% split, flagged pricing_estimated so the admin UI never presents
-- it as real historical fact.
update order_items
set
  unit_mrp = case when is_discountable then round(unit_price / 0.2) else null end,
  discount_percent = case when is_discountable then 80 else null end,
  net_markup_percent = case when not is_discountable then 10 else null end,
  unit_supplier_price = case when is_discountable then round(unit_price * 0.5) else round(unit_price / 1.1) end,
  line_supplier_total = case when is_discountable then round(unit_price * 0.5) else round(unit_price / 1.1) end * quantity
where unit_supplier_price is null;

update order_items
set line_commission = line_total - line_supplier_total
where line_commission is null and line_supplier_total is not null;

update orders o
set
  pricing_estimated = true,
  supplier_total = sub.supplier_total,
  commission_total = o.grand_total - sub.supplier_total,
  mrp_total = sub.mrp_total,
  you_save = sub.mrp_total - sub.discountable_total
from (
  select
    order_id,
    sum(line_supplier_total) as supplier_total,
    sum(case when is_discountable then coalesce(unit_mrp, 0) * quantity else 0 end) as mrp_total,
    sum(case when is_discountable then line_total else 0 end) as discountable_total
  from order_items
  group by order_id
) sub
where sub.order_id = o.id and o.supplier_total is null;
