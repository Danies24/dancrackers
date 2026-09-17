-- Combo Packs: fixed curated baskets (Kids Special Pack, Family Pack, Night
-- Pack, Morning Blast Pack), each in Small/Medium/Large varieties. A
-- variety's selling_price/supplier_cost/commission/total_items are NEVER
-- typed in by an admin — always derived by summing real catalogue items,
-- the same non-negotiable rule as customer prices elsewhere in this schema
-- (products.price is trigger-maintained, never hand-entered either).
--
-- Deliberately three tables, not a bolt-on to `products` — a combo pack's
-- rich structure (varieties, curated item lists) doesn't fit a single-row
-- product shape. But a combo variety still needs to be addressable exactly
-- like a product (its own slug, resolvable by /product/[slug], addable to
-- the cart, tap-to-navigate from a cart line) without teaching the cart's
-- client-side code — local storage schema, use-validated-cart, the cart
-- page's rendering — a new item type. So each variety gets its own `slug`,
-- and the few server-side read paths that resolve a slug or a cart
-- productId (getProductBySlug, /api/products/validate, /api/enquiry) gain
-- a small fallback to these tables when a plain `products` lookup misses.
-- No physical rows are duplicated into `products` — always computed live,
-- so there is exactly one source of truth for a combo's price, never two
-- representations that could disagree.

create table combo_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  hero_image_url text,
  badge_text text not null default 'COMBO DEAL',
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index combo_packs_display_idx on combo_packs (display_order);

create table combo_pack_varieties (
  id uuid primary key default gen_random_uuid(),
  combo_pack_id uuid not null references combo_packs(id) on delete cascade,
  -- Independently addressable at /product/[slug] (§ above) — auto-derived
  -- as "<combo-slug>-<tier-label>" by the admin API on create, but a real
  -- editable column since tier_label itself is editable.
  slug text not null unique,
  tier_label text not null default 'Small',
  display_order int not null default 1,
  -- Every column below is trigger-maintained by recompute_combo_variety()
  -- (see the function further down) — never accept these as direct input
  -- from any admin form or API request body.
  selling_price numeric(10, 2) not null default 0,
  supplier_cost numeric(10, 2) not null default 0,
  commission numeric(10, 2) not null default 0,
  commission_pct numeric(6, 2) not null default 0,
  total_items int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (combo_pack_id, tier_label)
);

create index combo_pack_varieties_pack_idx on combo_pack_varieties (combo_pack_id, display_order);

create table combo_pack_items (
  id uuid primary key default gen_random_uuid(),
  variety_id uuid not null references combo_pack_varieties(id) on delete cascade,
  -- Always a real catalogue product — never a free-text line (§5.3 MUST NOT).
  -- restrict, not cascade: retiring a product must not silently delete it
  -- out of a combo pack's basket — that has to be a deliberate admin edit.
  product_id uuid not null references products(id) on delete restrict,
  quantity int not null check (quantity >= 1),
  display_order int not null default 1,
  created_at timestamptz not null default now(),
  unique (variety_id, product_id)
);

create index combo_pack_items_variety_idx on combo_pack_items (variety_id, display_order);
create index combo_pack_items_product_idx on combo_pack_items (product_id);

-- order_items.product_id is a real FK to products(id) — a combo variety's
-- id would violate it. A combo line instead leaves product_id null and
-- records which variety it was here; every other order_items column
-- (sku/name_en/unit/prices) is still populated from the variety's own
-- synthetic identity, so nothing downstream that reads order_items needs
-- to know combo lines exist at all.
alter table order_items
  add column if not exists combo_variety_id uuid references combo_pack_varieties(id) on delete set null;

create trigger combo_packs_set_updated_at
  before update on combo_packs
  for each row execute function set_updated_at();

create trigger combo_pack_varieties_set_updated_at
  before update on combo_pack_varieties
  for each row execute function set_updated_at();

-- ── Live recomputation — the actual "never typed in" enforcement ────

create or replace function recompute_combo_variety(p_variety_id uuid)
returns void
language plpgsql
as $$
declare
  v_supplier_discount_percent numeric(5, 2);
begin
  select supplier_discount_percent into v_supplier_discount_percent from pricing_settings limit 1;
  v_supplier_discount_percent := coalesce(v_supplier_discount_percent, 90);

  update combo_pack_varieties v
  set
    selling_price = coalesce(agg.selling_price, 0),
    supplier_cost = coalesce(agg.supplier_cost, 0),
    commission = coalesce(agg.selling_price, 0) - coalesce(agg.supplier_cost, 0),
    commission_pct = case
      when coalesce(agg.supplier_cost, 0) = 0 then 0
      else round((coalesce(agg.selling_price, 0) - coalesce(agg.supplier_cost, 0)) / agg.supplier_cost * 100, 2)
    end,
    total_items = coalesce(agg.total_items, 0)
  from (
    select
      ci.variety_id,
      sum(ci.quantity * coalesce(p.price, 0)) as selling_price,
      sum(
        ci.quantity * case
          when p.is_discountable then round(coalesce(p.mrp, 0) * (100 - v_supplier_discount_percent) / 100)
          else coalesce(p.mrp, 0)
        end
      ) as supplier_cost,
      sum(ci.quantity) as total_items
    from combo_pack_items ci
    join products p on p.id = ci.product_id
    where ci.variety_id = p_variety_id
    group by ci.variety_id
  ) agg
  where v.id = p_variety_id and agg.variety_id = p_variety_id;

  -- The join above produces no row (and so no UPDATE) once a variety's
  -- last item is removed — handle that zero-item case explicitly so the
  -- variety doesn't keep showing its last-known price after going empty.
  if not found then
    update combo_pack_varieties
    set selling_price = 0, supplier_cost = 0, commission = 0, commission_pct = 0, total_items = 0
    where id = p_variety_id;
  end if;
end;
$$;

create or replace function combo_pack_items_recompute()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform recompute_combo_variety(old.variety_id);
    return old;
  end if;
  perform recompute_combo_variety(new.variety_id);
  if tg_op = 'UPDATE' and old.variety_id <> new.variety_id then
    perform recompute_combo_variety(old.variety_id);
  end if;
  return new;
end;
$$;

create trigger combo_pack_items_recompute_trigger
  after insert or update of product_id, quantity, variety_id or delete
  on combo_pack_items
  for each row execute function combo_pack_items_recompute();

-- A catalogue product's own price changing (admin edits mrp/discount on
-- /admin/products) must not silently leave every combo containing it
-- showing a stale price — recompute every variety that references it.
create or replace function combo_pack_items_recompute_on_product_change()
returns trigger
language plpgsql
as $$
declare
  v_variety_id uuid;
begin
  if new.price is distinct from old.price or new.mrp is distinct from old.mrp
     or new.is_discountable is distinct from old.is_discountable then
    for v_variety_id in select distinct variety_id from combo_pack_items where product_id = new.id loop
      perform recompute_combo_variety(v_variety_id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger products_recompute_combo_packs
  after update of price, mrp, is_discountable on products
  for each row execute function combo_pack_items_recompute_on_product_change();

-- A supplier_discount_percent change (admin edits the global setting)
-- affects supplier_cost/commission on every combo variety at once.
create or replace function combo_pack_items_recompute_on_settings_change()
returns trigger
language plpgsql
as $$
declare
  v_variety_id uuid;
begin
  if new.supplier_discount_percent is distinct from old.supplier_discount_percent then
    for v_variety_id in select id from combo_pack_varieties loop
      perform recompute_combo_variety(v_variety_id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger pricing_settings_recompute_combo_packs
  after update of supplier_discount_percent on pricing_settings
  for each row execute function combo_pack_items_recompute_on_settings_change();

-- ── RLS ───────────────────────────────────────────────────────────
alter table combo_packs enable row level security;
alter table combo_pack_varieties enable row level security;
alter table combo_pack_items enable row level security;

-- combo_packs itself holds nothing price-sensitive (name/tagline/image/
-- badge) — safe to read directly, same as `categories`.
create policy combo_packs_public_read on combo_packs
  for select to anon, authenticated
  using (is_active = true);

-- combo_pack_varieties and combo_pack_items DO hold supplier_cost/
-- commission/commission_pct — no anon/authenticated policy on the base
-- tables at all (service role only), matching the products/pricing_settings
-- split (§2 of the SSR migration). Public reads go through the views below.

create view public_combo_pack_varieties as
select
  v.id,
  v.combo_pack_id,
  v.slug,
  v.tier_label,
  v.display_order,
  v.selling_price,
  v.total_items
from combo_pack_varieties v
join combo_packs p on p.id = v.combo_pack_id
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
