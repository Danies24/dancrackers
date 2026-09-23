-- Cross-shop category groups (Kolagalam Multi-Shop v2.0, §2.3). Each shop
-- keeps its own categories (see 20260922000001), but every category can now
-- map to a shared group so a customer can browse one category (e.g.
-- Sparklers) across every active shop at /products/[groupSlug].
--
-- Group slugs below reuse Sri Ram's real category slugs, NOT the spec
-- document's assumed list verbatim — the spec's §2.3 table names some
-- slugs ("matches", "gift-box", "kids-collections", "fountain-fancy-
-- novelties", "gun-and-caps", "thunder-crackers") that already exist as
-- placeholder Sri Ram categories (display_order 100+, no products, no
-- Tamil name yet) seeded ahead of this feature, and omits six real Sri Ram
-- categories that have actual products (elite-series, colour-matches,
-- ring-cap-serpent-eggs, chotaa-fancy, combo-aerial-shot, new-version).
-- Those six are left ungrouped by design — they stay visible on Sri Ram's
-- own shop page but simply don't appear in cross-shop browsing, exactly as
-- the spec says an unmapped category should behave.

create table category_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ta text,
  icon_url text,
  is_featured boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index category_groups_display_idx on category_groups (display_order);

alter table categories add column group_id uuid references category_groups(id) on delete set null;

alter table category_groups enable row level security;

create policy "public can read category groups" on category_groups
  for select to anon, authenticated
  using (true);

-- ── Seed groups from Sri Ram's own categories (name_en/name_ta come from
-- the real row, so no Tamil is invented for categories that already carry
-- it) ────────────────────────────────────────────────────────────────
insert into category_groups (slug, name_en, name_ta, is_featured, display_order)
select c.slug, c.name_en, c.name_ta, false, 0
from categories c
join shops s on s.id = c.shop_id
where s.slug = 'sri-ram-crackers'
  and c.slug in (
    'sparklers', 'ground-chakkars', 'flower-pots', 'twinkling-star', 'bijili',
    'sound-crackers', 'rocket', 'bombs', 'sky-shots', 'multi-shot', 'gift-box',
    'kids-collections', 'fountain-fancy-novelties', 'matches', 'gun-and-caps',
    'thunder-crackers'
  );

-- The five placeholder categories were seeded with no Tamil name — fill
-- them in now, transliterated in the same style as the site's existing
-- category names (e.g. "Bijili" -> "பிஜிலி", "Rocket" -> "ராக்கெட்").
update category_groups set name_ta = 'குழந்தைகள் தொகுப்பு' where slug = 'kids-collections' and name_ta is null;
update category_groups set name_ta = 'ஃபவுண்டன் & ஃபேன்சி' where slug = 'fountain-fancy-novelties' and name_ta is null;
update category_groups set name_ta = 'மேட்சஸ்' where slug = 'matches' and name_ta is null;
update category_groups set name_ta = 'கன் & கேப்ஸ்' where slug = 'gun-and-caps' and name_ta is null;
update category_groups set name_ta = 'தண்டர் கிராக்கர்ஸ்' where slug = 'thunder-crackers' and name_ta is null;

-- Featured tile strip on home (§5.2): Sparklers, Ground Chakkars, Flower
-- Pots, Bombs, Sound Crackers, Rockets, Sky Shots, Kids Collections, Gift Box.
update category_groups set is_featured = true, display_order = ord
from (values
  ('sparklers', 1), ('ground-chakkars', 2), ('flower-pots', 3), ('bombs', 4),
  ('sound-crackers', 5), ('rocket', 6), ('sky-shots', 7), ('kids-collections', 8),
  ('gift-box', 9)
) as featured(slug, ord)
where category_groups.slug = featured.slug;

-- Remaining (non-featured) groups keep a stable display_order after the
-- featured ones, alphabetical by slug for determinism.
update category_groups set display_order = sub.rn
from (
  select slug, 100 + row_number() over (order by slug) as rn
  from category_groups
  where is_featured = false
) sub
where category_groups.slug = sub.slug;

-- ── Backfill Sri Ram's own categories 1:1 onto the groups with matching
-- slugs (this covers all 16 mapped groups above) ─────────────────────
update categories c
set group_id = g.id
from category_groups g, shops s
where s.id = c.shop_id and s.slug = 'sri-ram-crackers' and c.slug = g.slug;

-- ── Map Bullet's categories onto groups, per Kolagalam_MultiShop_Build_
-- Prompt_v2.0 §2.3. Matched by name (case-insensitive), not slug — Bullet's
-- real category slugs are auto-generated from the import and don't always
-- match the group slug (e.g. "rockets" not "rocket").
with bullet_categories as (
  select c.id, c.name_en
  from categories c
  join shops s on s.id = c.shop_id
  where s.slug = 'bullet-crackers'
),
mapping (group_slug, name_pattern) as (
  values
    ('sparklers', 'sparklers'),
    ('flower-pots', 'flower pots'),
    ('ground-chakkars', 'ground chakkar'),
    ('fountain-fancy-novelties', 'pencil'),
    ('fountain-fancy-novelties', 'special fancy items'),
    ('fountain-fancy-novelties', 'top 10 items'),
    ('fountain-fancy-novelties', 'damo items'),
    ('fountain-fancy-novelties', 'rajkala''s fancy fireworks'),
    ('fountain-fancy-novelties', 'the jet fireworks'),
    ('twinkling-star', 'twinkling star'),
    ('rocket', 'rockets'),
    ('sound-crackers', 'sound crackers'),
    ('sound-crackers', 'deluxe crackers'),
    ('bombs', 'bombs'),
    ('bombs', 'adult blast'),
    ('thunder-crackers', 'wala garlands'),
    ('sky-shots', 'sky shot & raiders'),
    ('sky-shots', 'pipe fancy'),
    ('sky-shots', 'fancy pipe'), -- word order varies, e.g. "Chotta Fancy Pipe" vs "Pipe Fancy (1 Pc)"
    ('sky-shots', 'mega size special comet'),
    ('sky-shots', 'double ball'),
    ('sky-shots', '7 step 7 colour comet'),
    ('multi-shot', 'repeating multi colour shots'),
    ('multi-shot', 'set outs repeating shots'),
    ('kids-collections', 'childrens special'),
    ('gift-box', 'combo packs (net rate)'),
    ('gift-box', 'gift boxes')
)
update categories c
set group_id = g.id
from bullet_categories bc
join mapping m on lower(bc.name_en) like '%' || m.name_pattern || '%'
join category_groups g on g.slug = m.group_slug
where c.id = bc.id;

-- ── Sanity check ─────────────────────────────────────────────────────
do $$
declare
  v_group_count int;
  v_sri_ram_mapped int;
  v_bullet_mapped int;
  v_bullet_total int;
begin
  select count(*) into v_group_count from category_groups;
  if v_group_count <> 16 then
    raise exception 'Expected 16 category groups, found %', v_group_count;
  end if;

  select count(*) into v_sri_ram_mapped
  from categories c join shops s on s.id = c.shop_id
  where s.slug = 'sri-ram-crackers' and c.group_id is not null;
  if v_sri_ram_mapped <> 16 then
    raise exception 'Expected 16 mapped Sri Ram categories, found %', v_sri_ram_mapped;
  end if;

  select count(*) filter (where c.group_id is not null), count(*)
  into v_bullet_mapped, v_bullet_total
  from categories c join shops s on s.id = c.shop_id
  where s.slug = 'bullet-crackers';

  raise notice 'OK: % category groups, % Sri Ram categories mapped, %/% Bullet categories mapped.',
    v_group_count, v_sri_ram_mapped, v_bullet_mapped, v_bullet_total;
end $$;
