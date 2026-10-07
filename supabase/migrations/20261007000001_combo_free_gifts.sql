-- Free gift boxes inside Sri Ram combo packs.
--
-- A gift is a normal combo_pack_items row flagged is_gift. It counts toward
-- the pack's supplier_cost (the owner really packs it, so margin/commission
-- stay honest) but NOT toward the pack's selling_price or total_items (it is
-- free to the customer and is shown separately as a "FREE GIFT").
-- The customer-facing price is unaffected: it comes from
-- COMBO_UI_PRICE_OVERRIDES in lib/combo-packs.ts.

-- 1. tr_check_combo_shop referenced a column that doesn't exist
--    (NEW.combo_pack_variety_id), so inserting ANY combo_pack_items row failed.
create or replace function check_combo_shop() returns trigger as $$
declare
  v_combo_shop_id uuid;
  v_product_shop_id uuid;
begin
  select cp.shop_id into v_combo_shop_id
    from combo_packs cp
    join combo_pack_varieties cpv on cp.id = cpv.combo_pack_id
    where cpv.id = NEW.variety_id;

  select shop_id into v_product_shop_id from products where id = NEW.product_id;

  if v_combo_shop_id is distinct from v_product_shop_id then
    raise exception 'Product must belong to the same shop as the combo pack';
  end if;

  return NEW;
end;
$$ language plpgsql;

-- 2. Gift flag
alter table combo_pack_items add column if not exists is_gift boolean not null default false;

-- 3. Expose it to the public view (new column appended last, so CREATE OR REPLACE is valid)
create or replace view public_combo_pack_items as
select
  ci.id,
  ci.variety_id,
  ci.quantity,
  ci.display_order,
  pp.name_en,
  pp.name_ta,
  pp.unit,
  pp.category,
  ci.is_gift
from combo_pack_items ci
join combo_pack_varieties v on v.id = ci.variety_id
join combo_packs p on p.id = v.combo_pack_id
join public_products pp on pp.id = ci.product_id
where p.is_active = true;

grant select on public_combo_pack_items to anon, authenticated;

-- 4. Recompute: gifts add cost, but not selling price or item count
create or replace function recompute_combo_variety(p_variety_id uuid)
returns void
language plpgsql
as $$
declare
  v_supplier_discount_percent numeric(5, 2);
begin
  select supplier_discount_percent into v_supplier_discount_percent from pricing_settings limit 1;
  v_supplier_discount_percent := coalesce(v_supplier_discount_percent, 90);

  update combo_pack_varieties v
  set
    selling_price = coalesce(agg.selling_price, 0),
    supplier_cost = coalesce(agg.supplier_cost, 0),
    commission = coalesce(agg.selling_price, 0) - coalesce(agg.supplier_cost, 0),
    commission_pct = case
      when coalesce(agg.supplier_cost, 0) = 0 then 0
      else round((coalesce(agg.selling_price, 0) - coalesce(agg.supplier_cost, 0)) / agg.supplier_cost * 100, 2)
    end,
    total_items = coalesce(agg.total_items, 0)
  from (
    select
      ci.variety_id,
      sum(case when ci.is_gift then 0 else ci.quantity * coalesce(p.price, 0) end) as selling_price,
      sum(
        ci.quantity * case
          when p.is_discountable then round(coalesce(p.mrp, 0) * (100 - v_supplier_discount_percent) / 100)
          else coalesce(p.mrp, 0)
        end
      ) as supplier_cost,
      sum(case when ci.is_gift then 0 else ci.quantity end) as total_items
    from combo_pack_items ci
    join products p on p.id = ci.product_id
    where ci.variety_id = p_variety_id
    group by ci.variety_id
  ) agg
  where v.id = p_variety_id and agg.variety_id = p_variety_id;

  if not found then
    update combo_pack_varieties
    set selling_price = 0, supplier_cost = 0, commission = 0, commission_pct = 0, total_items = 0
    where id = p_variety_id;
  end if;
end;
$$;

-- 5. The gifts: Mini gets none.
insert into combo_pack_items (variety_id, product_id, quantity, display_order, is_gift)
select v.id, p.id, 1, 999, true
from (values
  ('family-pack-small',          'cuckoo-20-item-194'),
  ('family-pack-medium',         'duck-25-item-195'),
  ('family-pack-big',            'dove-30-item-196'),
  ('family-pack-large',          'garuda-40-item-198'),  -- the "Mega" tier
  ('kids-special-pack-standard', 'duck-25-item-195'),
  ('morning-blast-pack-standard','cuckoo-20-item-194'),
  ('night-pack-standard',        'cuckoo-20-item-194')
) as g(variety_slug, product_slug)
join combo_pack_varieties v on v.slug = g.variety_slug
join combo_packs cp on cp.id = v.combo_pack_id
join products p on p.slug = g.product_slug and p.shop_id = cp.shop_id
on conflict (variety_id, product_id) do nothing;

-- Refresh every variety (the inserts above already fired the trigger; this also
-- re-derives packs that got no gift, under the new rules).
select recompute_combo_variety(id) from combo_pack_varieties;
