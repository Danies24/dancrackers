-- Combo Packs seed — 4 packs x 3 varieties, real catalogue items.
-- selling_price/supplier_cost/commission/total_items are NOT seeded here —
-- they're computed by the recompute_combo_variety() trigger the instant
-- these item rows are inserted. Idempotent: safe to re-run.

-- ── Kids Special Pack ──
insert into combo_packs (slug, name, tagline, badge_text, display_order, is_active)
values ('kids-special-pack', 'Kids Special Pack', 'For the little ones — sparklers, twinkling stars & safe fun', 'COMBO DEAL', 1, true)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, badge_text = excluded.badge_text, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'kids-special-pack-small', 'Small', 1
from combo_packs where slug = 'kids-special-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-143', 4, 1),
  ('SSR-148', 3, 2),
  ('SSR-033', 4, 3),
  ('SSR-051', 6, 4),
  ('SSR-052', 4, 5),
  ('SSR-061', 3, 6),
  ('SSR-058', 6, 7),
  ('SSR-070', 3, 8),
  ('SSR-014', 2, 9)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'kids-special-pack-small'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'kids-special-pack-medium', 'Medium', 2
from combo_packs where slug = 'kids-special-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-143', 6, 1),
  ('SSR-148', 5, 2),
  ('SSR-033', 6, 3),
  ('SSR-051', 9, 4),
  ('SSR-052', 6, 5),
  ('SSR-061', 5, 6),
  ('SSR-058', 9, 7),
  ('SSR-070', 5, 8),
  ('SSR-014', 3, 9),
  ('SSR-071', 2, 10),
  ('SSR-066', 1, 11)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'kids-special-pack-medium'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'kids-special-pack-large', 'Large', 3
from combo_packs where slug = 'kids-special-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-143', 8, 1),
  ('SSR-148', 6, 2),
  ('SSR-033', 8, 3),
  ('SSR-051', 12, 4),
  ('SSR-052', 8, 5),
  ('SSR-061', 6, 6),
  ('SSR-058', 12, 7),
  ('SSR-070', 6, 8),
  ('SSR-014', 4, 9),
  ('SSR-071', 4, 10),
  ('SSR-066', 3, 11)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'kids-special-pack-large'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- ── Family Pack ──
insert into combo_packs (slug, name, tagline, badge_text, display_order, is_active)
values ('family-pack', 'Family Pack', 'A little bit of everything — sparklers, ground chakkars, flower pots & rockets for the whole family', 'BEST VALUE', 2, true)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, badge_text = excluded.badge_text, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'family-pack-small', 'Small', 1
from combo_packs where slug = 'family-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-143', 4, 1),
  ('SSR-151', 2, 2),
  ('SSR-014', 4, 3),
  ('SSR-015', 4, 4),
  ('SSR-021', 3, 5),
  ('SSR-033', 3, 6),
  ('SSR-001', 10, 7),
  ('SSR-002', 14, 8),
  ('SSR-003', 4, 9),
  ('SSR-036', 3, 10),
  ('SSR-022', 1, 11)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'family-pack-small'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'family-pack-medium', 'Medium', 2
from combo_packs where slug = 'family-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-143', 6, 1),
  ('SSR-151', 3, 2),
  ('SSR-014', 6, 3),
  ('SSR-015', 6, 4),
  ('SSR-021', 5, 5),
  ('SSR-033', 5, 6),
  ('SSR-001', 15, 7),
  ('SSR-002', 21, 8),
  ('SSR-003', 6, 9),
  ('SSR-036', 5, 10),
  ('SSR-022', 2, 11),
  ('SSR-076', 2, 12),
  ('SSR-037', 2, 13)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'family-pack-medium'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'family-pack-large', 'Large', 3
from combo_packs where slug = 'family-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-143', 8, 1),
  ('SSR-151', 4, 2),
  ('SSR-014', 8, 3),
  ('SSR-015', 8, 4),
  ('SSR-021', 6, 5),
  ('SSR-033', 6, 6),
  ('SSR-001', 19, 7),
  ('SSR-002', 27, 8),
  ('SSR-003', 8, 9),
  ('SSR-036', 6, 10),
  ('SSR-022', 2, 11),
  ('SSR-016', 2, 12),
  ('SSR-023', 2, 13),
  ('SSR-039', 2, 14)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'family-pack-large'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- ── Night Pack ──
insert into combo_packs (slug, name, tagline, badge_text, display_order, is_active)
values ('night-pack', 'Night Pack', 'Sky shots and fountains to light up the night', 'COMBO DEAL', 3, true)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, badge_text = excluded.badge_text, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'night-pack-small', 'Small', 1
from combo_packs where slug = 'night-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-127', 4, 1),
  ('SSR-124', 5, 2),
  ('SSR-125', 4, 3),
  ('SSR-072', 3, 4),
  ('SSR-078', 1, 5),
  ('SSR-076', 1, 6),
  ('SSR-089', 1, 7)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'night-pack-small'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'night-pack-medium', 'Medium', 2
from combo_packs where slug = 'night-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-127', 6, 1),
  ('SSR-124', 8, 2),
  ('SSR-125', 6, 3),
  ('SSR-072', 5, 4),
  ('SSR-078', 2, 5),
  ('SSR-076', 2, 6),
  ('SSR-089', 2, 7),
  ('SSR-077', 2, 8),
  ('SSR-080', 2, 9)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'night-pack-medium'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'night-pack-large', 'Large', 3
from combo_packs where slug = 'night-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-127', 8, 1),
  ('SSR-124', 10, 2),
  ('SSR-125', 8, 3),
  ('SSR-072', 6, 4),
  ('SSR-078', 2, 5),
  ('SSR-076', 2, 6),
  ('SSR-089', 2, 7),
  ('SSR-077', 4, 8),
  ('SSR-080', 3, 9),
  ('SSR-081', 2, 10),
  ('SSR-130', 1, 11)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'night-pack-large'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- ── Morning Blast Pack ──
insert into combo_packs (slug, name, tagline, badge_text, display_order, is_active)
values ('morning-blast-pack', 'Morning Blast Pack', 'Wake the neighbourhood — sound crackers for the traditional morning burst', 'COMBO DEAL', 4, true)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, badge_text = excluded.badge_text, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'morning-blast-pack-small', 'Small', 1
from combo_packs where slug = 'morning-blast-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-001', 32, 1),
  ('SSR-002', 25, 2),
  ('SSR-003', 16, 3),
  ('SSR-006', 10, 4),
  ('SSR-013', 10, 5)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'morning-blast-pack-small'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'morning-blast-pack-medium', 'Medium', 2
from combo_packs where slug = 'morning-blast-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-001', 48, 1),
  ('SSR-002', 38, 2),
  ('SSR-003', 24, 3),
  ('SSR-006', 15, 4),
  ('SSR-013', 15, 5),
  ('SSR-004', 6, 6),
  ('SSR-042', 2, 7)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'morning-blast-pack-medium'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'morning-blast-pack-large', 'Large', 3
from combo_packs where slug = 'morning-blast-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-001', 61, 1),
  ('SSR-002', 48, 2),
  ('SSR-003', 31, 3),
  ('SSR-006', 19, 4),
  ('SSR-013', 19, 5),
  ('SSR-004', 10, 6),
  ('SSR-008', 6, 7),
  ('SSR-009', 4, 8)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'morning-blast-pack-large'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- Sanity check: every variety should now have a non-zero selling_price.
do $$
declare
  v_zero_count int;
begin
  select count(*) into v_zero_count from combo_pack_varieties where selling_price = 0;
  if v_zero_count > 0 then
    raise exception 'Expected every combo variety to have selling_price > 0, found % at 0', v_zero_count;
  end if;
  raise notice 'OK: all combo pack varieties priced.';
end $$;

