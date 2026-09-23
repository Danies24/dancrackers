-- Fixes to the multi-shop pricing engine landed by 20260922000001, found
-- while building the rest of the Kolagalam Multi-Shop v2.0 spec against the
-- live schema:
--
-- 1. products_compute_price's watched-column list never included
--    supplier_price. INSERTs still priced correctly (a trigger fires
--    unconditionally on INSERT), which is why Bullet's 265-product import
--    priced fine — but an UPDATE that only touches supplier_price (e.g. a
--    future admin edit) silently leaves price/price_agent stale.
--
-- 2. shop_markup_changed's cascade touches products.updated_at to force a
--    recompute, but updated_at was never a watched column either — so
--    changing a shop's markup_percent/agent_markup_percent currently does
--    nothing. This breaks the multi-shop spec's acceptance criterion #4
--    outright (changing Bullet's markup should update every product's
--    standard price).
--
-- 3. tr_log_price_history auto-inserts a price_history row on every price
--    change, duplicating the manual inserts already done by
--    app/api/admin/products/[id]/route.ts and the CSV importer for direct
--    edits (which carry a real admin email + reason the trigger can't see).
--    Narrowed so the trigger only logs price changes that are a *side
--    effect* of something else changing (the shop-markup cascade) — the
--    one case no app-layer code observes per-product.

-- ── Fix 1 + set-up for fix 2: extend the watched-column list ──────────
drop trigger if exists products_compute_price on products;
create trigger products_compute_price
  before insert or update of mrp, is_discountable, discount_percent, net_markup_percent, supplier_price
  on products
  for each row execute function compute_product_customer_price();

-- ── Fix 2: touch a column the trigger above actually watches ──────────
create or replace function shop_markup_changed() returns trigger as $$
begin
    if NEW.pricing_mode = 'net_markup' and (OLD.markup_percent is distinct from NEW.markup_percent or OLD.agent_markup_percent is distinct from NEW.agent_markup_percent) then
        -- Re-assigning supplier_price to itself is a no-op value-wise, but
        -- it IS in products_compute_price's watched-column list, so this
        -- actually fires a recompute for every product in the shop (unlike
        -- touching updated_at, which the trigger never watched).
        update products set supplier_price = supplier_price where shop_id = NEW.id;
    end if;
    return NEW;
end;
$$ language plpgsql;

-- ── Fix 3: only auto-log price_history for the cascade case ───────────
create or replace function log_price_history() returns trigger as $$
begin
  if new.price is distinct from old.price or new.price_agent is distinct from old.price_agent then
    if new.mrp is not distinct from old.mrp
       and new.discount_percent is not distinct from old.discount_percent
       and new.net_markup_percent is not distinct from old.net_markup_percent
       and new.is_discountable is not distinct from old.is_discountable
       and new.supplier_price is not distinct from old.supplier_price
    then
      -- None of this row's own pricing inputs changed, so the price move
      -- must have cascaded from its shop's markup changing — the app layer
      -- has no per-product hook for that, so this is the only place it
      -- gets logged.
      insert into price_history (product_id, old_price, new_price, changed_by, reason)
      values (new.id, old.price, new.price, 'system', 'markup change');
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- ── Missing range checks from the spec (§2.1) that never made it into the
-- original migration ───────────────────────────────────────────────────
alter table shops
  add constraint shops_markup_percent_check check (markup_percent is null or markup_percent between 0 and 3),
  add constraint shops_agent_markup_percent_check check (agent_markup_percent is null or agent_markup_percent between 0 and 3),
  add constraint shops_agent_markup_le_markup_check check (
    agent_markup_percent is null or markup_percent is null or agent_markup_percent <= markup_percent
  ),
  add constraint shops_customer_discount_percent_check check (customer_discount_percent is null or customer_discount_percent between 0 and 100),
  add constraint shops_supplier_discount_percent_check check (supplier_discount_percent is null or supplier_discount_percent between 0 and 100),
  add constraint shops_preview_token_format_check check (preview_token is null or preview_token ~ '^[0-9a-f]{16}$');
