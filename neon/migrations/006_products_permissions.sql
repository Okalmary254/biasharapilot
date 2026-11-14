-- BiasharaPilot AI
-- Migration 006: repair product Data API grants and membership-based write policies.
-- Safe to re-run. Existing product rows remain protected by business membership RLS.

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.products to authenticated;

alter table public.products enable row level security;

drop policy if exists "Members read products" on public.products;
create policy "Members read products" on public.products
  for select to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "Members insert products" on public.products;
create policy "Members insert products" on public.products
  for insert to authenticated
  with check (public.is_business_member(business_id));

drop policy if exists "Members update products" on public.products;
create policy "Members update products" on public.products
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- Keep the identity helper callable by authenticated Data API requests.
grant execute on function public.app_user_id() to authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
