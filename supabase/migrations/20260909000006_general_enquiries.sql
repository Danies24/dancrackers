-- A lightweight top-of-funnel lead form (homepage "quick enquiry" section),
-- deliberately separate from `orders`. It carries no priced items and must
-- never be presented to a customer as a confirmed or priced order — it is
-- a request for a callback, nothing more (§16.1: an enquiry that isn't
-- backed by a cart cannot honestly claim a total).

create table general_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  category text,
  message text,
  status text not null default 'NEW' check (status in ('NEW', 'CONTACTED', 'CLOSED')),
  created_at timestamptz not null default now()
);

create index general_enquiries_created_idx on general_enquiries (created_at desc);

alter table general_enquiries enable row level security;
-- No anon/authenticated policies: writes go through the server route
-- handler with the service role key; reads are admin-only (future
-- /admin/leads screen), same pattern as `orders` (§30.2).
