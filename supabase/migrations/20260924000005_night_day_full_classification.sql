-- Extends the night/day classification (20260924000004) to every remaining
-- category on both shops, per the user's explicit list. Categories with no
-- existing cross-shop group get a new single-purpose group here — purely to
-- carry a time_of_day tag so they aggregate into the Night/Morning
-- collection pages; none of these are individually featured on the home
-- grid (is_featured defaults false).
--
-- User's rule: anything not explicitly called out as Night defaults to Day.
-- Sri Ram's separate "Colour Matches" category joins the existing `matches`
-- group (Night) — it was previously ungrouped, unlike Gurusamy's own
-- "Colour Matches" which the 20260924000003 backfill already mapped there.

-- ── New single-purpose groups ────────────────────────────────────────
insert into category_groups (slug, name_en, is_featured, time_of_day) values
  ('chotaa-fancy', 'Chotaa Fancy', false, 'night'),
  ('combo-aerial-shot', 'Combo Aerial Shot', false, 'night'),
  ('elite-series', 'Elite Series', false, 'night'),
  ('aerial-novelties', 'Aerial Novelties', false, 'night'),
  ('wheel-chakkar', 'Wheel Chakkar', false, 'night'),
  ('childrens-torch', 'Children''s Torch', false, 'night'),
  ('colour-paper-money-show', 'Colour Paper & Money Show', false, 'night'),
  ('new-version', 'New Version', false, 'day'),
  ('ring-cap-serpent-eggs', 'Ring Cap & Serpent Eggs', false, 'day'),
  ('gurusamys-aerials', 'Gurusamy''s Aerials', false, 'day'),
  ('gurusamys-mines-party', 'Gurusamy''s Mines Party', false, 'day'),
  ('gurusamys-special', 'Gurusamy''s Special', false, 'day'),
  ('peacock-dance', 'Peacock Dance', false, 'day'),
  ('premium-tin-series', 'Premium Tin Series', false, 'day'),
  ('paper-bombs', 'Paper Bombs', false, 'day');

-- ── Default the two existing untagged groups to Day ──────────────────
update category_groups set time_of_day = 'day' where slug in ('gift-box', 'kids-collections');

-- ── Re-point specific categories onto the right group ────────────────
-- Sri Ram
update categories set group_id = (select id from category_groups where slug = 'matches') where id = 'f133b249-0b42-46b3-8aa9-831e90fbd53d'; -- Colour Matches
update categories set group_id = (select id from category_groups where slug = 'chotaa-fancy') where id = 'd2dbe02e-e6e6-46e4-822a-1f9eb0315879'; -- Chotaa Fancy
update categories set group_id = (select id from category_groups where slug = 'combo-aerial-shot') where id = '5fc0ce62-60a5-4e32-9348-eac3cd4f378e'; -- Combo Aerial Shot
update categories set group_id = (select id from category_groups where slug = 'elite-series') where id = 'dbee3dd8-b14f-44b8-9a26-9639f7ee0bb6'; -- Elite Series
update categories set group_id = (select id from category_groups where slug = 'new-version') where id = '3f506d88-fbcf-4a3a-9dc4-19cbb7906ae3'; -- New Version
update categories set group_id = (select id from category_groups where slug = 'ring-cap-serpent-eggs') where id = 'c8048713-2050-4a5c-844f-ab0606d0e3b1'; -- Ring Cap & Serpent Eggs

-- Gurusamy
update categories set group_id = (select id from category_groups where slug = 'aerial-novelties') where id in (
  'a10d02b4-d3e1-456c-83bd-5712e3f61976', -- 2 Inch Aerial Novelties
  '1f08a9f0-ac45-43aa-9b8a-fb20f934e046', -- 3.5 Inch Aerial Novelties
  '6f003497-03bf-4c34-9ca3-a29706cee190', -- 4 Inch Aerial Novelties
  '1216beda-7bf1-42e0-a862-5609f7304dc8'  -- 5 Inch Aerial Novelties
);
update categories set group_id = (select id from category_groups where slug = 'wheel-chakkar') where id = '6a5feba4-a21d-4ea4-9737-963de4a14ef9'; -- Wheel Chakkar
update categories set group_id = (select id from category_groups where slug = 'childrens-torch') where id = '26010ece-7c3c-4869-9bf2-97e96f3d7b81'; -- Children's Torch
update categories set group_id = (select id from category_groups where slug = 'colour-paper-money-show') where id = '0ea92608-048e-4ae0-81b5-358fb99224ae'; -- Colour Paper & Money Show
update categories set group_id = (select id from category_groups where slug = 'gurusamys-aerials') where id = '7e32b5c9-2915-40e0-94af-3498be99f66f'; -- Gurusamy's Aerials
update categories set group_id = (select id from category_groups where slug = 'gurusamys-mines-party') where id = '565132b6-3b55-4177-b08c-2b93c28ab477'; -- Gurusamy's Mines Party
update categories set group_id = (select id from category_groups where slug = 'gurusamys-special') where id = 'b9220330-3a63-41eb-98ba-1bbd2b608be0'; -- Gurusamy's Special
update categories set group_id = (select id from category_groups where slug = 'peacock-dance') where id = '487089c5-e12a-4606-b6ac-889e1952ee47'; -- Peacock Dance
update categories set group_id = (select id from category_groups where slug = 'premium-tin-series') where id = '76acb8f4-4836-40c6-a4a0-99591e6328fe'; -- Premium Tin Series
update categories set group_id = (select id from category_groups where slug = 'paper-bombs') where id = '0aae331d-1108-484f-8d84-5572d50a28e7'; -- Paper Bombs (split out of "bombs" so Paper Bomb/Bomb are distinct tiles, per the user's list)

-- The two "collects_time_of_day" virtual pages from 20260924000004 are no
-- longer linked from anywhere — the user wants "Night Crackers"/"Morning
-- Crackers" to be plain section titles on the home page, not a real
-- browsable category. Removing them so they don't show up as stray pills in
-- every category page's switcher row.
delete from category_groups where slug in ('night-crackers', 'morning-crackers');

do $$
declare
  v_night int;
  v_day int;
  v_ungrouped int;
begin
  select count(*) into v_night from category_groups where time_of_day = 'night';
  select count(*) into v_day from category_groups where time_of_day = 'day';
  select count(*) into v_ungrouped
  from categories c join shops s on s.id = c.shop_id
  where s.slug in ('sri-ram-crackers', 'gurusamy-fireworks') and c.group_id is null;

  raise notice 'OK: % night groups, % day groups, % Sri Ram/Gurusamy categories still ungrouped.', v_night, v_day, v_ungrouped;
end $$;
