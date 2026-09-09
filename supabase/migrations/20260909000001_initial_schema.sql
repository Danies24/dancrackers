-- Dan Crackers — initial schema
-- PRD §21. Every table, column, default and index below is specified there.
-- Do not edit a shipped migration; add a new one instead (§21.11).

create extension if not exists "pgcrypto";

-- ── categories (§21.2) ──────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ta text,
  description text,
  image_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── products (§21.3) ────────────────────────────────────────────────
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name_en text not null,
  name_ta text,
  category_id uuid not null references categories(id) on delete restrict,
  price numeric(10, 2),
  unit text not null default 'pcs' check (unit in ('pkt', 'pcs', 'box', 'bundle')),
  is_discountable boolean not null default true,
  min_qty int not null default 1,
  image_url text,
  image_urls text[] not null default '{}',
  description text,
  status text not null default 'active' check (status in ('active', 'unavailable', 'archived')),
  is_bestseller boolean not null default false,
  is_featured boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_display_idx on products (category_id, display_order);
create index products_status_idx on products (status);

-- ── price_history (§21.4) ───────────────────────────────────────────
create table price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  old_price numeric(10, 2),
  new_price numeric(10, 2),
  changed_by text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index price_history_product_idx on price_history (product_id, created_at desc);

-- ── customers (§21.5) ───────────────────────────────────────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text not null,
  whatsapp text,
  email text,
  address text,
  city text,
  pincode text,
  landmark text,
  total_orders int not null default 0,
  total_value numeric(12, 2) not null default 0,
  first_order_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── captains (§21.6) ────────────────────────────────────────────────
create table captains (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{3}[0-9]{2}$'),
  token text not null unique,
  name text not null,
  phone text not null,
  city text,
  area text,
  source text,
  upi_id text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now()
);

-- ── orders (§21.7) ──────────────────────────────────────────────────
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  customer_id uuid not null references customers(id),
  captain_id uuid references captains(id),
  captain_code text,
  name text not null,
  phone text not null,
  whatsapp text,
  email text,
  address text not null,
  city text not null,
  pincode text not null,
  landmark text,
  preferred_call_time text,
  notes text,
  subtotal numeric(12, 2) not null,
  discountable_subtotal numeric(12, 2) not null,
  net_rate_subtotal numeric(12, 2) not null,
  discount_percent numeric(5, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null,
  total_quantity int not null,
  status text not null default 'NEW' check (
    status in (
      'NEW', 'CONTACTED', 'UNREACHABLE', 'CONFIRMED', 'PAID',
      'DESPATCHED', 'DELIVERED', 'LOST', 'SPAM'
    )
  ),
  lost_reason text,
  needs_review boolean not null default false,
  internal_notes jsonb not null default '[]',
  first_contacted_at timestamptz,
  confirmed_at timestamptz,
  delivered_at timestamptz,
  commission_rate numeric(5, 2),
  commission_amount numeric(12, 2),
  commission_paid_at timestamptz,
  source_url text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_created_idx on orders (status, created_at desc);
create index orders_captain_idx on orders (captain_id);
create index orders_customer_idx on orders (customer_id);
create index orders_created_idx on orders (created_at desc);

-- ── order_items — the snapshot (§21.8) ─────────────────────────────
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  sku text not null,
  name_en text not null,
  name_ta text,
  unit text not null,
  unit_price numeric(10, 2) not null,
  quantity int not null,
  line_total numeric(12, 2) not null,
  is_discountable boolean not null
);

create index order_items_order_idx on order_items (order_id);

-- ── captain_clicks (§21.9) ──────────────────────────────────────────
create table captain_clicks (
  id uuid primary key default gen_random_uuid(),
  captain_code text not null,
  captain_id uuid references captains(id),
  referrer text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index captain_clicks_code_idx on captain_clicks (captain_code);

-- ── admin_users (§21.10) ────────────────────────────────────────────
-- Auth identity lives in Supabase Auth; this row carries the app-level profile.
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── settings (§21.10) ───────────────────────────────────────────────
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- ── updated_at triggers ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();
