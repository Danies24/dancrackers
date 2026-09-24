-- products.slug is still globally unique from the pre-multi-shop schema
-- (20260909000001) — only sku was fixed to be shop-scoped when multi-shop
-- landed (20260922000001). Surfaced by the first real bulk import into a
-- second shop: any Gurusamy product whose slugified name collides with an
-- existing Sri Ram/Bullet product (e.g. "Atom Bomb", "Drone", "Rocket Bomb")
-- silently failed to insert. Same fix already applied to categories.slug in
-- 20260922000002.

alter table products drop constraint if exists products_slug_key;
alter table products add constraint products_shop_id_slug_key unique (shop_id, slug);
