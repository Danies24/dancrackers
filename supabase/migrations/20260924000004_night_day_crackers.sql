-- "Night Crackers" / "Morning Crackers" home tiles (user request) — each
-- existing category_group is tagged with when it's conventionally used
-- (visual/light effects best seen after dark vs. loud sound crackers set
-- off in daylight), then two new *virtual* category_groups aggregate every
-- real group matching a tag, reusing the existing /category/[categorySlug]
-- page and getCrossShopProducts machinery rather than building a new page
-- type. A category never moves out of its real group (Flower Pots stays
-- Flower Pots) — time_of_day is a second, independent tag alongside the
-- existing group_id, and collects_time_of_day is only ever set on these two
-- new rows to mark them as an aggregator rather than a real category home.
--
-- Classification follows common retail convention, not a precise rule —
-- gift-box and kids-collections are genuinely mixed (a gift box can contain
-- both sound and light items) and are deliberately left untagged rather
-- than guessed. Adjust with a plain `update category_groups set
-- time_of_day = ...` if any of these don't match how you actually sell them.

alter table category_groups
  add column time_of_day text check (time_of_day in ('night', 'day')),
  add column collects_time_of_day text check (collects_time_of_day in ('night', 'day'));

update category_groups set time_of_day = 'night'
where slug in ('sparklers', 'ground-chakkars', 'flower-pots', 'twinkling-star', 'rocket', 'sky-shots', 'multi-shot', 'fountain-fancy-novelties', 'matches');

update category_groups set time_of_day = 'day'
where slug in ('sound-crackers', 'bombs', 'bijili', 'gun-and-caps', 'thunder-crackers');

insert into category_groups (slug, name_en, name_ta, is_featured, display_order, collects_time_of_day)
values
  ('night-crackers', 'Night Crackers', 'இரவு பட்டாசுகள்', true, 10, 'night'),
  ('morning-crackers', 'Morning Crackers', 'காலை பட்டாசுகள்', true, 11, 'day');

do $$
declare
  v_night int;
  v_day int;
begin
  select count(*) into v_night from category_groups where time_of_day = 'night';
  select count(*) into v_day from category_groups where time_of_day = 'day';
  if v_night <> 9 then
    raise exception 'Expected 9 night-tagged groups, found %', v_night;
  end if;
  if v_day <> 5 then
    raise exception 'Expected 5 day-tagged groups, found %', v_day;
  end if;
  raise notice 'OK: % night groups, % day groups, 2 collection rows added.', v_night, v_day;
end $$;
