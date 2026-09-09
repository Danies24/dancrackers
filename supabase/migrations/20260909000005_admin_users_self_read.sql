-- An authenticated admin may read their own admin_users profile row (for
-- display — name, role). All other admin data continues to go through
-- server-side route handlers using the service role key (§30.2).

create policy "admin can read own profile"
  on admin_users for select
  to authenticated
  using (auth_user_id = auth.uid());
