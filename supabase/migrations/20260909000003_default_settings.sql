-- Default settings (§21.10, §15.4, §15.5).
-- These are production-safe defaults, not sample data — unlike
-- supabase/seed.sql, this migration runs in every environment.
--
-- discount_percent and min_order_value are [BLOCKED] in the PRD pending
-- written supplier confirmation (§15.4, §15.5, §42.1 items 2-3). They start
-- at 0, which hides the discount UI and the minimum-order mechanism
-- entirely (§15.4: "Until confirmed, it is 0 and the discount rows are
-- hidden entirely"). Do not raise either value without a written figure
-- from the supplier.

insert into settings (key, value) values
  ('discount_percent', '0'),
  ('min_order_value', '0'),
  ('whatsapp_business_number', '""'),
  ('supplier_whatsapp_number', '""'),
  ('served_pincodes', '[]'),
  ('home_banner_text', '""'),
  ('season_last_booking_date', 'null')
on conflict (key) do nothing;
