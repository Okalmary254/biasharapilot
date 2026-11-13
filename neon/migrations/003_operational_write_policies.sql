-- BiasharaPilot AI
-- Migration 003: allow business members to create operational records.
-- Existing SELECT policies remain in place. These policies add the writes
-- required by the inventory, customer and expense screens.

create policy "Members insert products" on public.products
  for insert to authenticated
  with check (public.is_business_member(business_id));

create policy "Members update products" on public.products
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "Members insert customers" on public.customers
  for insert to authenticated
  with check (public.is_business_member(business_id));

create policy "Members update customers" on public.customers
  for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "Members insert expenses" on public.expenses
  for insert to authenticated
  with check (public.is_business_member(business_id));
