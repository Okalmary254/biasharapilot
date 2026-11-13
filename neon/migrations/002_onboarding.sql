-- BiasharaPilot AI on Neon
-- Migration 002: Secure business creation (also creates the user's profile)
--
-- Neon Auth stores users in neon_auth."user". We avoid triggers on that table and
-- create the profile row here, when the user sets up their first business.

create or replace function public.create_business(
  p_name text,
  p_type text,
  p_county text,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.app_user_id();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Business name is required';
  end if;

  insert into public.profiles (id, full_name, phone)
  select u.id, u.name, p_phone
  from neon_auth."user" u
  where u.id = v_uid
  on conflict (id) do update
    set phone = coalesce(excluded.phone, public.profiles.phone),
        updated_at = now();

  insert into public.businesses (name, business_type, county, phone, owner_id)
  values (trim(p_name), p_type, p_county, p_phone, v_uid)
  returning id into v_id;

  insert into public.business_members (business_id, user_id, role)
  values (v_id, v_uid, 'owner');

  return v_id;
end
$$;

revoke execute on function public.create_business(text, text, text, text) from public;
grant execute on function public.create_business(text, text, text, text) to authenticated;
