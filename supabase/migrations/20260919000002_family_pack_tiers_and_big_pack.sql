-- Family Pack tier rename + new "Big Pack" tier (Dan, 2026-09-19): renames
-- the 3 existing family-pack varieties into a family-size ladder and adds a
-- 4th tier between the old Medium and Large slots.
--
--   family-pack-small   'Small'  -> 'Mini Pack'  (display_order 1, unchanged)
--   family-pack-medium  'Medium' -> 'Small Pack'  (display_order 2, unchanged)
--   family-pack-big      NEW     -> 'Big Pack'    (display_order 3, new variety)
--   family-pack-large   'Large'  -> 'Mega Pack'   (display_order 3 -> 4)
--
-- Data-only change: no schema changes. Idempotent — safe to re-run.
--
-- All selling_price/supplier_cost/commission/commission_pct/total_items on
-- combo_pack_varieties are exclusively trigger-computed by
-- recompute_combo_variety() — never hand-set here, only insert/delete
-- combo_pack_items rows and let the trigger fill them in.

-- ── Rename the 3 existing tiers ──────────────────────────────────────
update combo_pack_varieties
set tier_label = 'Mini'
where slug = 'family-pack-small';

update combo_pack_varieties
set tier_label = 'Small'
where slug = 'family-pack-medium';

update combo_pack_varieties
set tier_label = 'Mega', display_order = 4
where slug = 'family-pack-large';

-- ── New "Big" (7k) variety, same combo_pack_id as the others ───
insert into combo_pack_varieties (combo_pack_id, slug, tier_label, display_order)
select combo_pack_id, 'family-pack-big', 'Big', 3
from combo_pack_varieties
where slug = 'family-pack-small'
on conflict (slug) do update set tier_label = excluded.tier_label, display_order = excluded.display_order;

delete from combo_pack_items
where variety_id = (select id from combo_pack_varieties where slug = 'family-pack-big');

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-001', 5, 1),
  ('SSR-002', 5, 2),
  ('SSR-006', 2, 3),
  ('SSR-003', 2, 4),
  ('SSR-011', 1, 5),
  ('SSR-043', 1, 6),
  ('SSR-010', 1, 7),
  ('SSR-184', 1, 8),
  ('SSR-191', 1, 9),
  ('SSR-192', 1, 10),
  ('SSR-016', 1, 11),
  ('SSR-074', 1, 12),
  ('SSR-027', 1, 13),
  ('SSR-024', 1, 14),
  ('SSR-025', 1, 15),
  ('SSR-063', 1, 16),
  ('SSR-029', 1, 17),
  ('SSR-055', 1, 18),
  ('SSR-036', 1, 20),
  ('SSR-034', 2, 21),
  ('SSR-033', 2, 22),
  ('SSR-094', 1, 23),
  ('SSR-105', 1, 24),
  ('SSR-110', 1, 25),
  ('SSR-130', 1, 26),
  ('SSR-067', 1, 27),
  ('SSR-081', 1, 28),
  ('SSR-080', 1, 29),
  ('SSR-087', 1, 31),
  ('SSR-128', 1, 32),
  ('SSR-142', 2, 33),
  ('SSR-143', 2, 34),
  ('SSR-151', 2, 35),
  ('SSR-152', 2, 36),
  ('SSR-153', 2, 37),
  ('SSR-154', 2, 38),
  ('SSR-158', 1, 39),
  ('SSR-157', 1, 40),
  ('SSR-164', 1, 41),
  ('SSR-103', 1, 42),
  ('SSR-048', 1, 43),
  ('SSR-089', 1, 44),
  ('SSR-075', 1, 45),
  ('SSR-126', 1, 46),
  ('SSR-070', 1, 47),
  ('SSR-167', 1, 48),
  ('SSR-125', 1, 49),
  ('SSR-078', 1, 50),
  ('SSR-042', 1, 51),
  ('SSR-051', 1, 52),
  ('SSR-052', 1, 53),
  ('SSR-059', 1, 54),
  ('SSR-058', 1, 55),
  ('SSR-061', 1, 56),
  ('SSR-170', 1, 57),
  ('SSR-173', 5, 58),
  ('SSR-044', 1, 59)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'family-pack-big'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- ── Sanity checks ────────────────────────────────────────────────────
do $$
declare
  v_family_count int;
  v_zero_count int;
  v_labels text[];
begin
  select count(*) into v_family_count
  from combo_pack_varieties v
  join combo_packs p on p.id = v.combo_pack_id
  where p.slug = 'family-pack';

  if v_family_count <> 4 then
    raise exception 'Expected family-pack to have exactly 4 varieties, found %', v_family_count;
  end if;

  select array_agg(tier_label order by display_order) into v_labels
  from combo_pack_varieties v
  join combo_packs p on p.id = v.combo_pack_id
  where p.slug = 'family-pack';

  if v_labels <> array['Mini', 'Small', 'Big', 'Mega'] then
    raise exception 'Expected family-pack tier_labels [Mini, Small, Big, Mega] in display_order, found %', v_labels;
  end if;

  select count(*) into v_zero_count
  from combo_pack_varieties v
  join combo_packs p on p.id = v.combo_pack_id
  where p.slug = 'family-pack' and v.selling_price = 0;

  if v_zero_count > 0 then
    raise exception 'Expected every family-pack variety to have selling_price > 0, found % at 0', v_zero_count;
  end if;

  raise notice 'OK: family-pack has 4 varieties [Mini, Small, Big, Mega], all priced.';
end $$;
