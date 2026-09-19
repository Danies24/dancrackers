-- Family Pack variety names rename: Mini, Small, Big, Mega (removing "Pack")
-- Idempotent: safe to re-run.

update combo_pack_varieties
set tier_label = 'Mini'
where slug = 'family-pack-small';

update combo_pack_varieties
set tier_label = 'Small'
where slug = 'family-pack-medium';

update combo_pack_varieties
set tier_label = 'Big'
where slug = 'family-pack-big';

update combo_pack_varieties
set tier_label = 'Mega'
where slug = 'family-pack-large';

-- Strip the word "Pack" from any other combo varieties if present
update combo_pack_varieties
set tier_label = trim(regexp_replace(tier_label, '\s*pack\s*$', '', 'i'))
where tier_label ~* '\s*pack\s*$';

-- Sanity check
do $$
declare
  v_labels text[];
begin
  select array_agg(tier_label order by display_order) into v_labels
  from combo_pack_varieties v
  join combo_packs p on p.id = v.combo_pack_id
  where p.slug = 'family-pack';

  if v_labels <> array['Mini', 'Small', 'Big', 'Mega'] then
    raise exception 'Expected family-pack tier_labels [Mini, Small, Big, Mega] in display_order, found %', v_labels;
  end if;

  raise notice 'OK: family-pack varieties renamed to [Mini, Small, Big, Mega].';
end $$;
