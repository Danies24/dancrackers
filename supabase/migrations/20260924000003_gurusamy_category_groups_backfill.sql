-- Gurusamy's categories were created by the CSV importer, which has never
-- set group_id (see the code fix in the same commit) — so none of its
-- categories appeared on any /category/[groupSlug] page even after the shop
-- went active. Backfills the confident name matches onto the existing 16
-- groups from 20260922000003, same case-insensitive "contains" pattern used
-- there for Bullet. Ambiguous categories (Wheel Chakkar, Peacock Dance,
-- Colour Paper & Money Show, Premium Tin Series, Gurusamy's Aerials/Mines
-- Party/Special, the 2"-5" Aerial Novelties tiers) are deliberately left
-- ungrouped — same precedent as Sri Ram's own six ungrouped categories:
-- they stay visible on Gurusamy's own shop page, just not in cross-shop
-- browsing, rather than guess a wrong mapping.

with gurusamy_categories as (
  select c.id, c.name_en
  from categories c
  join shops s on s.id = c.shop_id
  where s.slug = 'gurusamy-fireworks'
),
mapping (group_slug, name_pattern) as (
  values
    ('flower-pots', 'flower pots'),
    ('ground-chakkars', 'ground chakkar'),
    ('bombs', 'bomb'),
    ('twinkling-star', 'twinkling star'),
    ('sound-crackers', 'sound crackers'),
    ('kids-collections', 'children'),
    ('rocket', 'rocket'),
    ('matches', 'colour matches'),
    ('fountain-fancy-novelties', 'fountain'),
    ('multi-shot', 'colour shots'),
    ('bijili', 'bijili'),
    ('gift-box', 'gift box'),
    ('sparklers', 'sparklers')
)
update categories c
set group_id = g.id
from gurusamy_categories gc
join mapping m on lower(gc.name_en) like '%' || m.name_pattern || '%'
join category_groups g on g.slug = m.group_slug
where c.id = gc.id;

do $$
declare
  v_mapped int;
  v_total int;
begin
  select count(*) filter (where c.group_id is not null), count(*)
  into v_mapped, v_total
  from categories c join shops s on s.id = c.shop_id
  where s.slug = 'gurusamy-fireworks';

  raise notice 'OK: %/% Gurusamy categories mapped to a cross-shop group.', v_mapped, v_total;
end $$;
