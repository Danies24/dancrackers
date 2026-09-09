-- The `settings` table holds non-secret operational config (discount %,
-- minimum order value, WhatsApp numbers, banner text) that both the public
-- cart calculation (§15.4-15.5) and server-rendered pages need to read.
-- None of it is sensitive — writes still require the service role, since no
-- write policy exists for anon/authenticated.

create policy "public can read settings"
  on settings for select
  to anon, authenticated
  using (true);
