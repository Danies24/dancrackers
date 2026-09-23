-- Multi-shop foundation: shops, shop_agents, and shop_id scoping on
-- categories/products/combo_packs/orders, plus a pricing-mode-aware rewrite
-- of compute_product_customer_price() (list_discount for Sri Ram, unchanged
-- behaviour; net_markup for shops like Bullet, priced from supplier_price).
--
-- NOTE: this file's timestamp matches what is ALREADY applied on the linked
-- production project (confirmed via `supabase migration list`, which shows
-- 20260922000001/20260922000002 as remote-applied with no local file). This
-- backfills the local migration history to match reality so `supabase db
-- reset` and fresh dev environments reproduce production. Content below is
-- the verbatim SQL that ran, recovered from the dangling commit that
-- authored it (tagged `archive/multi-shop-958e94e`) — do not edit.

-- 1. Create shops and shop_agents tables

create table shops (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name_en text not null,
    name_ta text,
    tagline text,
    logo_url text,
    banner_url text,
    status text not null default 'coming_soon' check (status in ('active', 'coming_soon', 'hidden')),
    pricing_mode text not null default 'list_discount' check (pricing_mode in ('list_discount', 'net_markup')),
    customer_discount_percent numeric(5, 2),
    supplier_discount_percent numeric(5, 2),
    markup_percent numeric(5, 2),
    agent_markup_percent numeric(5, 2),
    default_agent_id uuid, -- FK added after shop_agents creation
    preview_token text unique,
    min_order_value numeric(10, 2),
    display_order int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table shop_agents (
    id uuid primary key default gen_random_uuid(),
    shop_id uuid not null references shops(id) on delete cascade,
    name text not null,
    phone text not null,
    code text not null unique check (code ~ '^[A-Z]{3}[0-9]{2}$'),
    token text not null unique,
    status text not null default 'active' check (status in ('active', 'inactive')),
    created_at timestamptz not null default now()
);

alter table shops add constraint shops_default_agent_id_fkey foreign key (default_agent_id) references shop_agents(id) on delete set null;

-- 2. Insert initial shops
insert into shops (id, slug, name_en, name_ta, status, pricing_mode, customer_discount_percent, supplier_discount_percent, markup_percent, agent_markup_percent, display_order)
values
('00000000-0000-0000-0000-000000000001', 'sri-ram-crackers', 'Sri Ram Crackers', 'ஸ்ரீ ராம் பட்டாசு', 'active', 'list_discount', 80, 90, null, null, 1),
('00000000-0000-0000-0000-000000000002', 'gurusamy-fireworks', 'Gurusamy Fireworks', 'குருசாமி பட்டாசு', 'coming_soon', 'list_discount', 0, 0, null, null, 2),
('00000000-0000-0000-0000-000000000003', 'bullet-crackers', 'The Bullet Crackers', 'தி புல்லட் பட்டாசு', 'hidden', 'net_markup', null, null, 2.00, 0.00, 3);

update shops set preview_token = '0123456789abcdef' where slug = 'bullet-crackers';

-- 3. Modify categories, products, combo_packs, orders

-- Categories
alter table categories add column shop_id uuid references shops(id) on delete restrict;
update categories set shop_id = '00000000-0000-0000-0000-000000000001';
alter table categories alter column shop_id set not null;

-- Products
alter table products add column shop_id uuid references shops(id) on delete restrict;
update products set shop_id = '00000000-0000-0000-0000-000000000001';
alter table products alter column shop_id set not null;

alter table products add column supplier_price numeric(10, 2);
alter table products add column pack text;
alter table products add column price_agent numeric(10, 2);

-- Change sku unique constraint to (shop_id, sku)
alter table products drop constraint products_sku_key;
alter table products add constraint products_shop_id_sku_key unique (shop_id, sku);

-- Combo Packs
alter table combo_packs add column shop_id uuid references shops(id) on delete restrict;
update combo_packs set shop_id = '00000000-0000-0000-0000-000000000001';
alter table combo_packs alter column shop_id set not null;

-- Orders
alter table orders add column shop_id uuid references shops(id) on delete restrict;
update orders set shop_id = '00000000-0000-0000-0000-000000000001';
alter table orders alter column shop_id set not null;

alter table orders add column agent_id uuid references shop_agents(id) on delete set null;
alter table orders add column agent_code text;
alter table orders add column agent_credit_source text check (agent_credit_source in ('link', 'default'));
alter table orders add column price_context text check (price_context in ('standard', 'agent'));
alter table orders add column is_preview boolean not null default false;

-- 4. Create bullet agent
insert into shop_agents (id, shop_id, name, phone, code, token, status)
values ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Bullet Agent', '9876543210', 'BUL01', 'fedcba9876543210', 'active');

update shops set default_agent_id = '00000000-0000-0000-0000-000000000004' where slug = 'bullet-crackers';

create or replace function check_combo_shop() returns trigger as $$
declare
    v_combo_shop_id uuid;
    v_product_shop_id uuid;
begin
    select shop_id into v_combo_shop_id from combo_packs cp
      join combo_pack_varieties cpv on cp.id = cpv.combo_pack_id
      where cpv.id = NEW.combo_pack_variety_id;

    select shop_id into v_product_shop_id from products where id = NEW.product_id;

    if v_combo_shop_id != v_product_shop_id then
        raise exception 'Product must belong to the same shop as the combo pack';
    end if;

    return NEW;
end;
$$ language plpgsql;

create trigger tr_check_combo_shop
before insert or update on combo_pack_items
for each row execute function check_combo_shop();

-- Note: In this codebase, if there are views like public_products, they will need to be dropped and recreated to include the new columns.
-- I will run this to check if there are any views that break.
drop view if exists public_products cascade;
create view public_products as
select
  p.id,
  p.shop_id,
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
where p.status <> 'archived';

grant select on public_products to anon, authenticated;
drop view if exists public_combo_pack_items cascade;
drop view if exists public_combo_pack_varieties cascade;

create view public_combo_pack_varieties as
select
  v.id,
  p.shop_id,
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
-- Add shop_slug to public_products
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

-- 5. Trigger for computing prices
create or replace function compute_product_customer_price()
returns trigger
language plpgsql
as $$
declare
    v_pricing_mode text;
    v_markup_percent numeric;
    v_agent_markup_percent numeric;
begin
    -- Get shop pricing mode
    select pricing_mode, markup_percent, agent_markup_percent
    into v_pricing_mode, v_markup_percent, v_agent_markup_percent
    from shops where id = new.shop_id;

    if v_pricing_mode = 'list_discount' then
        -- Sri Ram mode
        if new.mrp is null then
            new.price := null;
            new.price_agent := null;
        elsif new.is_discountable then
            new.price := round(new.mrp * (100 - new.discount_percent) / 100);
            new.price_agent := new.price;
        else
            new.price := round(new.mrp * (100 + new.net_markup_percent) / 100);
            new.price_agent := new.price;
        end if;
    elsif v_pricing_mode = 'net_markup' then
        -- Bullet mode
        if new.supplier_price is null then
            new.price := null;
            new.price_agent := null;
        else
            new.price := ceil(new.supplier_price * (1 + v_markup_percent / 100.0));
            new.price_agent := ceil(new.supplier_price * (1 + coalesce(v_agent_markup_percent, 0) / 100.0));
            new.is_discountable := false;
        end if;
    end if;

    return new;
end;
$$;

-- Trigger to recompute all prices when shop markup changes
create or replace function shop_markup_changed() returns trigger as $$
begin
    if NEW.pricing_mode = 'net_markup' and (OLD.markup_percent is distinct from NEW.markup_percent or OLD.agent_markup_percent is distinct from NEW.agent_markup_percent) then
        -- update all products for this shop to fire the trigger
        update products set updated_at = now() where shop_id = NEW.id;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger tr_shop_markup_changed
after update on shops
for each row execute function shop_markup_changed();

create or replace function log_price_history() returns trigger as $$
begin
    if OLD.price is distinct from NEW.price or OLD.price_agent is distinct from NEW.price_agent then
        insert into price_history (product_id, old_price, new_price, changed_by, reason)
        values (NEW.id, OLD.price, NEW.price, 'system', 'markup change');
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger tr_log_price_history
after update on products
for each row execute function log_price_history();

alter table shops enable row level security;
alter table shop_agents enable row level security;

create policy "public can read shops" on shops for select to anon, authenticated using (status != 'hidden');
-- Hidden shops can be read if preview_token matches, but maybe it's better to enforce this logic in application layer
create policy "admin can do anything on shops" on shops to service_role using (true) with check (true);
create policy "admin can do anything on shop_agents" on shop_agents to service_role using (true) with check (true);
