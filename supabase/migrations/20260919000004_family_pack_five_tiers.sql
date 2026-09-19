-- Family Pack 5-Tier Restructuring: Mini, Small, Medium, Big, Mega (Dan, 2026-09-19)
-- Introduces a 37-item Mini tier at display_order 1 and shifts existing tiers:
--   family-pack-mini    NEW      -> 'Mini'    (display_order 1, 37 items / 40 units)
--   family-pack-small   EXISTING -> 'Small'   (display_order 2, 40 items / 52 units)
--   family-pack-medium  EXISTING -> 'Medium'  (display_order 3, 48 items / 60 units)
--   family-pack-big     EXISTING -> 'Big'     (display_order 4, 57 items / 79 units)
--   family-pack-large   EXISTING -> 'Mega'    (display_order 5, 97 items / 115 units)
--
-- Idempotent: safe to re-run.

-- 1. Free up tier labels to prevent unique constraint collisions
update combo_pack_varieties
set tier_label = 'Temp_Small'
where slug = 'family-pack-small';

update combo_pack_varieties
set tier_label = 'Medium', display_order = 3
where slug = 'family-pack-medium';

update combo_pack_varieties
set tier_label = 'Small', display_order = 2
where slug = 'family-pack-small';

update combo_pack_varieties
set tier_label = 'Big', display_order = 4
where slug = 'family-pack-big';

update combo_pack_varieties
set tier_label = 'Mega', display_order = 5
where slug = 'family-pack-large';

-- 2. Upsert family-pack-mini
insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select id, 'family-pack-mini', 'Mini', 1
from combo_packs
where slug = 'family-pack'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

-- 3. Populate 37 items for family-pack-mini
delete from combo_pack_items
where variety_id = (select id from combo_pack_varieties where slug = 'family-pack-mini');

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-001', 2, 1),
  ('SSR-002', 2, 2),
  ('SSR-006', 1, 3),
  ('SSR-013', 1, 4),
  ('SSR-049', 1, 5),
  ('SSR-042', 1, 6),
  ('SSR-043', 1, 7),
  ('SSR-176', 1, 8),
  ('SSR-177', 1, 9),
  ('SSR-182', 1, 10),
  ('SSR-051', 1, 11),
  ('SSR-052', 1, 12),
  ('SSR-061', 1, 13),
  ('SSR-058', 1, 14),
  ('SSR-170', 1, 15),
  ('SSR-173', 2, 16),
  ('SSR-167', 1, 17),
  ('SSR-142', 1, 18),
  ('SSR-143', 1, 19),
  ('SSR-149', 1, 20),
  ('SSR-150', 1, 21),
  ('SSR-151', 1, 22),
  ('SSR-033', 1, 23),
  ('SSR-034', 1, 24),
  ('SSR-014', 1, 25),
  ('SSR-015', 1, 26),
  ('SSR-021', 1, 27),
  ('SSR-022', 1, 28),
  ('SSR-023', 1, 29),
  ('SSR-072', 1, 30),
  ('SSR-079', 1, 31),
  ('SSR-086', 1, 32),
  ('SSR-076', 1, 33),
  ('SSR-036', 1, 34),
  ('SSR-124', 1, 35),
  ('SSR-122', 1, 36),
  ('SSR-103', 1, 37)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'family-pack-mini'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- 4. Sanity check
do $$
declare
  v_family_count int;
  v_labels text[];
begin
  select count(*) into v_family_count
  from combo_pack_varieties v
  join combo_packs p on p.id = v.combo_pack_id
  where p.slug = 'family-pack';

  if v_family_count <> 5 then
    raise exception 'Expected family-pack to have exactly 5 varieties, found %', v_family_count;
  end if;

  select array_agg(tier_label order by display_order) into v_labels
  from combo_pack_varieties v
  join combo_packs p on p.id = v.combo_pack_id
  where p.slug = 'family-pack';

  if v_labels <> array['Mini', 'Small', 'Medium', 'Big', 'Mega'] then
    raise exception 'Expected family-pack tier_labels [Mini, Small, Medium, Big, Mega] in display_order, found %', v_labels;
  end if;

  raise notice 'OK: family-pack now has 5 varieties [Mini, Small, Medium, Big, Mega], all priced.';
end $$;
