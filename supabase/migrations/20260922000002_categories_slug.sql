-- Categories become unique per shop, not globally (Bullet's category names
-- can collide with Sri Ram's, e.g. both may have a "Sparklers" category).
-- See the note in 20260922000001_multi_shop.sql — this backfills a
-- migration already applied on production, recovered verbatim from
-- archive/multi-shop-958e94e.

alter table categories drop constraint if exists categories_slug_key;
alter table categories add constraint categories_shop_id_slug_key unique (shop_id, slug);
