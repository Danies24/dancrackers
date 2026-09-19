-- Combo pack restructure (Dan, 2026-09-19): collapse Kids Special Pack,
-- Night Pack, and Morning Blast Pack to a single variety each; keep Family
-- Pack at 3 varieties (Small/Medium/Large). Every basket's item list is
-- replaced to mirror Kids Crackers Park's real basket composition — priced
-- entirely from our own products table via the existing
-- recompute_combo_variety() trigger, never hand-set here.
--
-- Data-only change: no schema changes. Idempotent — safe to re-run.
--
-- NOTE (deviation from the spec handed to this migration): SSR-129
-- ("2" Pipe (3 Pcs)") is status='unavailable' with mrp/price both null in
-- our products table right now. It was originally listed under night-pack,
-- family-pack-small, family-pack-medium, and family-pack-large. Left in,
-- it would silently contribute ₹0 to both selling_price and supplier_cost
-- (coalesce(...,0) in recompute_combo_variety) while still inflating
-- total_items — i.e. the pack would claim to include an item that isn't
-- actually orderable anywhere else on the site, "for free". That's not a
-- pricing outcome to anchor/scale (which this migration must not do) so
-- much as an unpriceable input, so it's excluded here — same treatment as
-- the three KCP-only items (Sivakasi Special, 4" Sizzling Fountain, Power
-- Pot) already excluded from the lists below, and likewise with no
-- substitute added. If SSR-129 gets restocked/repriced later, add it back
-- with its own migration.

-- ── Kids Special Pack: collapse to a single "Standard" variety ──────
delete from combo_pack_varieties
where slug in ('kids-special-pack-small', 'kids-special-pack-large');

update combo_pack_varieties
set slug = 'kids-special-pack-standard', tier_label = 'Standard', display_order = 1
where slug = 'kids-special-pack-medium';

delete from combo_pack_items
where variety_id = (select id from combo_pack_varieties where slug = 'kids-special-pack-standard');

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-014', 1, 1),
  ('SSR-015', 1, 2),
  ('SSR-016', 1, 3),
  ('SSR-018', 1, 4),
  ('SSR-021', 1, 5),
  ('SSR-022', 1, 6),
  ('SSR-023', 1, 7),
  ('SSR-024', 1, 8),
  ('SSR-029', 1, 9),
  ('SSR-142', 3, 10),
  ('SSR-030', 1, 11),
  ('SSR-033', 1, 12),
  ('SSR-034', 1, 13),
  ('SSR-051', 1, 14),
  ('SSR-052', 1, 15),
  ('SSR-058', 1, 16),
  ('SSR-060', 1, 17),
  ('SSR-055', 1, 18),
  ('SSR-057', 1, 20),
  ('SSR-061', 1, 21),
  ('SSR-064', 1, 22),
  ('SSR-066', 1, 23),
  ('SSR-067', 1, 24),
  ('SSR-075', 1, 25),
  ('SSR-076', 1, 26),
  ('SSR-070', 1, 27),
  ('SSR-069', 1, 28),
  ('SSR-068', 1, 29),
  ('SSR-071', 1, 30),
  ('SSR-078', 1, 31),
  ('SSR-072', 1, 32),
  ('SSR-020', 1, 33),
  ('SSR-074', 1, 34),
  ('SSR-079', 1, 35),
  ('SSR-081', 1, 36),
  ('SSR-089', 1, 37),
  ('SSR-086', 1, 38),
  ('SSR-087', 1, 39),
  ('SSR-093', 1, 40),
  ('SSR-147', 2, 42),
  ('SSR-151', 2, 43),
  ('SSR-164', 1, 44),
  ('SSR-165', 1, 45),
  ('SSR-167', 1, 46),
  ('SSR-168', 1, 47),
  ('SSR-169', 1, 48),
  ('SSR-170', 1, 49),
  ('SSR-173', 5, 50),
  ('SSR-155', 1, 51),
  ('SSR-146', 1, 52),
  ('SSR-161', 1, 53)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'kids-special-pack-standard'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- ── Night Pack: collapse to a single "Standard" variety ─────────────
delete from combo_pack_varieties
where slug in ('night-pack-small', 'night-pack-large');

update combo_pack_varieties
set slug = 'night-pack-standard', tier_label = 'Standard', display_order = 1
where slug = 'night-pack-medium';

delete from combo_pack_items
where variety_id = (select id from combo_pack_varieties where slug = 'night-pack-standard');

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-014', 1, 1),
  ('SSR-015', 1, 2),
  ('SSR-016', 1, 3),
  ('SSR-021', 1, 4),
  ('SSR-022', 1, 5),
  ('SSR-023', 1, 6),
  ('SSR-029', 1, 7),
  ('SSR-083', 1, 8),
  ('SSR-124', 1, 9),
  -- SSR-129 excluded: unavailable, no mrp/price — see note at top of file.
  ('SSR-122', 1, 11),
  ('SSR-123', 1, 12),
  ('SSR-126', 1, 13),
  ('SSR-105', 1, 14),
  ('SSR-110', 1, 15),
  ('SSR-063', 1, 16),
  ('SSR-065', 1, 17),
  ('SSR-103', 1, 18),
  ('SSR-108', 1, 19),
  ('SSR-125', 1, 20),
  ('SSR-088', 1, 21),
  ('SSR-078', 1, 22),
  ('SSR-087', 1, 23),
  ('SSR-086', 1, 24),
  ('SSR-143', 2, 25),
  ('SSR-142', 2, 26),
  ('SSR-146', 1, 27),
  ('SSR-148', 1, 28),
  ('SSR-147', 1, 29),
  ('SSR-155', 1, 30),
  ('SSR-153', 1, 31),
  ('SSR-082', 1, 32),
  ('SSR-079', 1, 33)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'night-pack-standard'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- ── Morning Blast Pack: collapse to a single "Standard" variety ─────
-- Uses the "SUN LIGHT 3K COMBO" promo-graphic item list, not the generic
-- 41-item "COMBO 3000/-" list (that one is family-pack-small's).
delete from combo_pack_varieties
where slug in ('morning-blast-pack-small', 'morning-blast-pack-large');

update combo_pack_varieties
set slug = 'morning-blast-pack-standard', tier_label = 'Standard', display_order = 1
where slug = 'morning-blast-pack-medium';

delete from combo_pack_items
where variety_id = (select id from combo_pack_varieties where slug = 'morning-blast-pack-standard');

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-001', 5, 1),
  ('SSR-002', 5, 2),
  ('SSR-003', 2, 3),
  ('SSR-004', 2, 4),
  ('SSR-006', 2, 5),
  ('SSR-008', 1, 6),
  ('SSR-009', 1, 7),
  ('SSR-011', 1, 8),
  ('SSR-013', 1, 9),
  ('SSR-010', 1, 10),
  ('SSR-007', 1, 11),
  ('SSR-042', 1, 12),
  ('SSR-043', 1, 13),
  ('SSR-044', 1, 14),
  ('SSR-046', 1, 15),
  ('SSR-045', 1, 16),
  ('SSR-048', 1, 17),
  ('SSR-049', 1, 18),
  ('SSR-050', 1, 19),
  ('SSR-187', 1, 20),
  ('SSR-188', 1, 21),
  ('SSR-193', 1, 22),
  ('SSR-192', 1, 23),
  ('SSR-191', 1, 24),
  ('SSR-176', 1, 25),
  ('SSR-177', 1, 26),
  ('SSR-178', 1, 27),
  ('SSR-182', 1, 28),
  ('SSR-179', 1, 29),
  ('SSR-180', 1, 30),
  ('SSR-181', 1, 31)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'morning-blast-pack-standard'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- ── Family Pack: keep Small/Medium/Large, replace every item list ───

-- Small — generic 41-item "COMBO 3000/-" list (NOT the Sun Light list,
-- that one is morning-blast-pack's). SSR-129 excluded, see note above.
delete from combo_pack_items
where variety_id = (select id from combo_pack_varieties where slug = 'family-pack-small');

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-001', 5, 1),
  ('SSR-002', 5, 2),
  ('SSR-006', 2, 3),
  ('SSR-013', 2, 4),
  ('SSR-010', 1, 5),
  ('SSR-014', 1, 6),
  ('SSR-015', 1, 7),
  ('SSR-021', 1, 8),
  ('SSR-022', 1, 9),
  ('SSR-049', 1, 10),
  ('SSR-050', 1, 11),
  ('SSR-042', 1, 12),
  ('SSR-043', 1, 13),
  ('SSR-033', 1, 14),
  ('SSR-034', 1, 15),
  ('SSR-051', 1, 16),
  ('SSR-052', 1, 17),
  ('SSR-061', 1, 18),
  ('SSR-058', 1, 19),
  ('SSR-103', 1, 20),
  ('SSR-110', 1, 21),
  -- SSR-129 excluded: unavailable, no mrp/price — see note at top of file.
  ('SSR-086', 1, 23),
  ('SSR-143', 2, 24),
  ('SSR-142', 2, 25),
  ('SSR-149', 1, 26),
  ('SSR-150', 1, 27),
  ('SSR-167', 1, 28),
  ('SSR-183', 1, 29),
  ('SSR-191', 1, 30),
  ('SSR-182', 1, 31),
  ('SSR-087', 1, 32),
  ('SSR-072', 1, 33),
  ('SSR-076', 1, 34),
  ('SSR-079', 1, 35),
  ('SSR-122', 1, 36),
  ('SSR-148', 1, 37),
  ('SSR-066', 1, 38),
  ('SSR-147', 1, 39),
  ('SSR-177', 1, 40),
  ('SSR-179', 1, 41)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'family-pack-small'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- Medium — "Combo 5000" list. SSR-129 excluded, see note above.
delete from combo_pack_items
where variety_id = (select id from combo_pack_varieties where slug = 'family-pack-medium');

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-001', 5, 1),
  ('SSR-006', 5, 2),
  ('SSR-008', 1, 3),
  ('SSR-009', 1, 4),
  ('SSR-010', 1, 5),
  ('SSR-012', 1, 6),
  ('SSR-049', 1, 7),
  ('SSR-050', 1, 8),
  ('SSR-043', 1, 9),
  ('SSR-044', 1, 10),
  ('SSR-033', 1, 11),
  ('SSR-034', 1, 12),
  ('SSR-015', 1, 13),
  ('SSR-016', 1, 14),
  ('SSR-022', 1, 15),
  ('SSR-023', 1, 16),
  ('SSR-024', 1, 17),
  ('SSR-079', 1, 18),
  ('SSR-082', 1, 19),
  ('SSR-027', 1, 20),
  ('SSR-122', 1, 21),
  ('SSR-123', 1, 22),
  -- SSR-129 excluded: unavailable, no mrp/price — see note at top of file.
  ('SSR-183', 1, 24),
  ('SSR-191', 1, 25),
  ('SSR-192', 1, 26),
  ('SSR-075', 1, 27),
  ('SSR-076', 1, 28),
  ('SSR-072', 1, 29),
  ('SSR-104', 1, 30),
  ('SSR-110', 1, 31),
  ('SSR-051', 1, 32),
  ('SSR-061', 1, 33),
  ('SSR-058', 1, 34),
  ('SSR-059', 1, 35),
  ('SSR-103', 1, 36),
  ('SSR-067', 1, 37),
  ('SSR-087', 1, 38),
  ('SSR-168', 1, 39),
  ('SSR-142', 2, 41),
  ('SSR-143', 2, 42),
  ('SSR-149', 2, 43),
  ('SSR-150', 2, 44),
  ('SSR-151', 1, 45),
  ('SSR-152', 1, 46),
  ('SSR-157', 1, 47),
  ('SSR-158', 1, 48),
  ('SSR-052', 1, 49),
  ('SSR-078', 1, 50)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'family-pack-medium'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- Large — "Combo 10000" list. SSR-129 excluded, see note above.
delete from combo_pack_items
where variety_id = (select id from combo_pack_varieties where slug = 'family-pack-large');

insert into combo_pack_items (variety_id, product_id, quantity, display_order)
select v.id, p.id, x.qty, x.ord
from combo_pack_varieties v
join (values
  ('SSR-003', 1, 2),
  ('SSR-004', 1, 3),
  ('SSR-001', 5, 4),
  ('SSR-002', 5, 5),
  ('SSR-006', 2, 6),
  ('SSR-010', 1, 7),
  ('SSR-014', 1, 8),
  ('SSR-015', 1, 9),
  ('SSR-021', 1, 10),
  ('SSR-022', 1, 11),
  ('SSR-033', 2, 12),
  ('SSR-034', 1, 13),
  ('SSR-036', 1, 14),
  ('SSR-042', 1, 15),
  ('SSR-043', 1, 16),
  ('SSR-048', 1, 17),
  ('SSR-049', 1, 18),
  ('SSR-050', 1, 19),
  ('SSR-051', 1, 20),
  ('SSR-052', 1, 21),
  ('SSR-061', 1, 22),
  ('SSR-058', 1, 23),
  ('SSR-059', 1, 24),
  ('SSR-066', 1, 25),
  ('SSR-071', 1, 26),
  ('SSR-085', 1, 27),
  ('SSR-086', 1, 28),
  ('SSR-087', 1, 29),
  ('SSR-089', 1, 30),
  ('SSR-103', 1, 31),
  ('SSR-079', 1, 32),
  ('SSR-076', 1, 33),
  ('SSR-075', 1, 34),
  ('SSR-078', 1, 35),
  ('SSR-122', 1, 36),
  ('SSR-123', 1, 37),
  ('SSR-124', 2, 38),
  ('SSR-130', 1, 39),
  ('SSR-126', 1, 40),
  -- SSR-129 excluded: unavailable, no mrp/price — see note at top of file.
  ('SSR-143', 1, 42),
  ('SSR-142', 1, 43),
  ('SSR-144', 1, 44),
  ('SSR-145', 1, 45),
  ('SSR-148', 1, 46),
  ('SSR-147', 1, 47),
  ('SSR-149', 1, 48),
  ('SSR-150', 1, 49),
  ('SSR-164', 4, 50),
  ('SSR-167', 1, 51),
  ('SSR-173', 5, 52),
  ('SSR-170', 1, 53),
  ('SSR-174', 1, 54),
  ('SSR-176', 1, 55),
  ('SSR-178', 1, 56),
  ('SSR-182', 1, 57),
  ('SSR-179', 1, 58),
  ('SSR-183', 1, 59),
  ('SSR-110', 1, 60),
  ('SSR-192', 1, 61),
  ('SSR-191', 1, 62),
  ('SSR-132', 1, 63),
  ('SSR-131', 1, 64),
  ('SSR-125', 1, 65),
  ('SSR-104', 1, 66),
  ('SSR-093', 1, 68),
  ('SSR-094', 1, 69),
  ('SSR-070', 1, 70),
  ('SSR-084', 1, 71),
  ('SSR-057', 1, 72),
  ('SSR-013', 1, 73),
  ('SSR-008', 1, 74),
  ('SSR-007', 1, 75),
  ('SSR-009', 1, 76),
  ('SSR-016', 1, 77),
  ('SSR-083', 1, 78),
  ('SSR-019', 1, 79),
  ('SSR-023', 1, 80),
  ('SSR-024', 1, 81),
  ('SSR-012', 1, 82),
  ('SSR-030', 1, 83),
  ('SSR-026', 1, 84),
  ('SSR-035', 1, 85),
  ('SSR-037', 1, 86),
  ('SSR-044', 1, 87),
  ('SSR-055', 1, 88),
  ('SSR-062', 1, 89),
  ('SSR-073', 1, 90),
  ('SSR-108', 1, 91),
  ('SSR-027', 1, 92),
  ('SSR-166', 1, 93),
  ('SSR-097', 1, 94),
  ('SSR-153', 1, 95),
  ('SSR-154', 1, 96),
  ('SSR-151', 1, 97),
  ('SSR-158', 1, 98),
  ('SSR-157', 1, 99),
  ('SSR-152', 1, 100)
) as x(sku, qty, ord) on true
join products p on p.sku = x.sku
where v.slug = 'family-pack-large'
on conflict (variety_id, product_id) do update set quantity = excluded.quantity, display_order = excluded.display_order;

-- ── Sanity checks ────────────────────────────────────────────────────
do $$
declare
  v_zero_count int;
  v_kids_count int;
  v_night_count int;
  v_morning_count int;
  v_family_count int;
begin
  select count(*) into v_zero_count from combo_pack_varieties where selling_price = 0;
  if v_zero_count > 0 then
    raise exception 'Expected every combo variety to have selling_price > 0, found % at 0', v_zero_count;
  end if;

  select count(*) into v_kids_count from combo_pack_varieties v join combo_packs p on p.id = v.combo_pack_id where p.slug = 'kids-special-pack';
  select count(*) into v_night_count from combo_pack_varieties v join combo_packs p on p.id = v.combo_pack_id where p.slug = 'night-pack';
  select count(*) into v_morning_count from combo_pack_varieties v join combo_packs p on p.id = v.combo_pack_id where p.slug = 'morning-blast-pack';
  select count(*) into v_family_count from combo_pack_varieties v join combo_packs p on p.id = v.combo_pack_id where p.slug = 'family-pack';

  if v_kids_count <> 1 then raise exception 'Expected kids-special-pack to have exactly 1 variety, found %', v_kids_count; end if;
  if v_night_count <> 1 then raise exception 'Expected night-pack to have exactly 1 variety, found %', v_night_count; end if;
  if v_morning_count <> 1 then raise exception 'Expected morning-blast-pack to have exactly 1 variety, found %', v_morning_count; end if;
  if v_family_count <> 3 then raise exception 'Expected family-pack to have exactly 3 varieties, found %', v_family_count; end if;

  raise notice 'OK: kids-special-pack=1, night-pack=1, morning-blast-pack=1, family-pack=3 varieties, all priced.';
end $$;
