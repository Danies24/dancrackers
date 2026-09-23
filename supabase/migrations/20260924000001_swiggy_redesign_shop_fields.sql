-- Swiggy-style storefront redesign (plan: users-admin-downloads-kolagalam-
-- swiggy-graceful-taco) — new shop-marketing and product-merchandising
-- fields for the shop PLP header/offer-pager and the Top Picks/Recommended/
-- filter-chip sections. Deliberately does NOT add the redesign doc's
-- `shop_offer_tiers` table — the cart-value-milestone concept it describes
-- already exists as lib/cart-progress.ts's 3-tier system and is extended
-- into these new surfaces in app code, not duplicated in the DB. Also does
-- NOT store a "max discount" badge value on shops — discounts change too
-- often (per-product, admin-editable) for a stored column to stay honest;
-- app code computes it live via getShopMaxActiveDiscountPercent().
--
-- `is_featured` below also serves the companion "Shop by Category" page
-- spec (Kolagalam_Shop_By_Category_Prompt_v1.0, /category/[categorySlug])
-- — its FEATURED SHOPS / ALL SHOPS grouping. Added now (while this file is
-- still unapplied) rather than a follow-up migration; with only 2 live
-- shops today it's a no-op default until an admin flips one.

alter table shops
  add column specialties text[] not null default '{}',
  add column hero_images text[] not null default '{}',
  add column location_label text,
  add column dispatch_label text,
  add column is_featured boolean not null default false;

-- Per-shop rotating marketing copy for the offer pager (e.g. "Upto 80% off
-- MRP", "Free sparklers on ₹999+"). Same public-read/service-write RLS
-- shape as category_groups (20260922000003).
create table shop_offers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  label text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index shop_offers_shop_id_idx on shop_offers (shop_id, display_order);

alter table shop_offers enable row level security;

create policy "public can read shop offers" on shop_offers
  for select to anon, authenticated
  using (true);

-- Product merchandising flags for the shop PLP's Top Picks / Recommended
-- carousels and filter chips (No-sound, Kids-safe). All default to a safe
-- "not flagged" / unknown state — existing rows are unaffected until an
-- admin sets them.
alter table products
  add column is_top_pick boolean not null default false,
  add column is_recommended boolean not null default false,
  add column noise_type text check (noise_type is null or noise_type in ('sound', 'no_sound')),
  add column kids_safe boolean not null default false;

-- ── Recreate public_products / public_combo_pack_* to expose the four new
-- product columns, same drop-cascade-then-recreate-in-dependency-order
-- pattern as 20260922000001. Column list is byte-identical to the current
-- view otherwise. ──────────────────────────────────────────────────────
drop view if exists public_combo_pack_items cascade;
drop view if exists public_combo_pack_varieties cascade;
drop view if exists public_products cascade;

create view public_products as
select
  p.id,
  p.shop_id,
  s.slug as shop_slug,
  p.sku,
  p.slug,
  p.name_en,
  p.name_ta,
  p.category_id,
  p.pack,
  p.unit,
  p.status,
  p.is_bestseller,
  p.is_featured,
  p.is_top_pick,
  p.is_recommended,
  p.noise_type,
  p.kids_safe,
  p.min_qty,
  p.image_url,
  p.image_urls,
  p.video_url,
  p.description,
  p.display_order,
  p.price,
  p.price_agent,
  p.is_discountable,
  case when p.is_discountable then p.mrp end as mrp,
  case when p.is_discountable then p.discount_percent end as discount_percent,
  jsonb_build_object('id', c.id, 'slug', c.slug, 'name_en', c.name_en, 'name_ta', c.name_ta) as category
from products p
join categories c on c.id = p.category_id
join shops s on s.id = p.shop_id
where p.status <> 'archived';

grant select on public_products to anon, authenticated;

create view public_combo_pack_varieties as
select
  v.id,
  p.shop_id,
  s.slug as shop_slug,
  v.combo_pack_id,
  v.slug,
  v.tier_label,
  v.display_order,
  v.selling_price,
  v.total_items
from combo_pack_varieties v
join combo_packs p on p.id = v.combo_pack_id
join shops s on s.id = p.shop_id
where p.is_active = true;

grant select on public_combo_pack_varieties to anon, authenticated;

create view public_combo_pack_items as
select
  ci.id,
  ci.variety_id,
  ci.quantity,
  ci.display_order,
  pp.name_en,
  pp.name_ta,
  pp.unit,
  pp.category
from combo_pack_items ci
join combo_pack_varieties v on v.id = ci.variety_id
join combo_packs p on p.id = v.combo_pack_id
join public_products pp on pp.id = ci.product_id
where p.is_active = true;

grant select on public_combo_pack_items to anon, authenticated;

-- ── Sanity check ─────────────────────────────────────────────────────
do $$
declare
  v_shop_cols int;
  v_product_cols int;
  v_view_cols int;
begin
  select count(*) into v_shop_cols
  from information_schema.columns
  where table_name = 'shops' and column_name in ('specialties', 'hero_images', 'location_label', 'dispatch_label', 'is_featured');
  if v_shop_cols <> 5 then
    raise exception 'Expected 5 new shops columns, found %', v_shop_cols;
  end if;

  select count(*) into v_product_cols
  from information_schema.columns
  where table_name = 'products' and column_name in ('is_top_pick', 'is_recommended', 'noise_type', 'kids_safe');
  if v_product_cols <> 4 then
    raise exception 'Expected 4 new products columns, found %', v_product_cols;
  end if;

  select count(*) into v_view_cols
  from information_schema.columns
  where table_name = 'public_products' and column_name in ('is_top_pick', 'is_recommended', 'noise_type', 'kids_safe');
  if v_view_cols <> 4 then
    raise exception 'Expected 4 new public_products view columns, found %', v_view_cols;
  end if;

  raise notice 'OK: shops +5 columns, products +4 columns, public_products view exposes all 4.';
end $$;
