-- BiasharaPilot AI on Neon
-- Migration 001: Core business infrastructure
-- Prerequisites: Neon Auth (Managed Better Auth) and the Neon Data API are enabled,
-- which creates the "authenticated" role and the auth.user_id() function.

create extension if not exists pgcrypto;

-- Current signed-in user id, read from the Data API JWT (sub claim).
-- Kept in one place so it can be adjusted if the auth user id type ever changes.
create or replace function public.app_user_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.user_id(), '')::uuid;
$$;

create table public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  avatar_url text,
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'sw')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  business_type text,
  description text,
  phone text,
  email text,
  address text,
  county text,
  country text not null default 'Kenya',
  currency text not null default 'KES',
  timezone text not null default 'Africa/Nairobi',
  owner_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'staff'
    check (role in ('owner', 'admin', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  sku text,
  description text,
  cost_price numeric(14,2) not null default 0 check (cost_price >= 0),
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  stock_quantity numeric(14,3) not null default 0,
  low_stock_threshold numeric(14,3) not null default 5,
  unit text not null default 'piece',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  receipt_number text,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  payment_method text default 'cash',
  status text not null default 'completed'
    check (status in ('completed', 'pending', 'cancelled', 'refunded')),
  notes text,
  sold_at timestamptz not null default now(),
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  unit_cost numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null,
  description text,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text,
  expense_date date not null default current_date,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id),
  movement_type text not null
    check (movement_type in ('opening', 'purchase', 'sale', 'return', 'adjustment', 'damage')),
  quantity_change numeric(14,3) not null,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index idx_members_user on public.business_members(user_id);
create index idx_products_business on public.products(business_id);
create index idx_customers_business on public.customers(business_id);
create index idx_sales_business_date on public.sales(business_id, sold_at desc);
create index idx_expenses_business_date on public.expenses(business_id, expense_date desc);
create index idx_stock_business_product on public.stock_movements(business_id, product_id);

create or replace function public.is_business_member(target_business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business
      and bm.user_id = (select public.app_user_id())
  );
$$;

-- Table privileges for the Data API role. Row level security below decides which rows.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
grant execute on function public.app_user_id() to authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.stock_movements enable row level security;

create policy "Users read own profile" on public.profiles for select to authenticated
  using (id = (select public.app_user_id()));

create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = (select public.app_user_id()))
  with check (id = (select public.app_user_id()));

create policy "Members read businesses" on public.businesses for select to authenticated
  using (public.is_business_member(id));

create policy "Owners update businesses" on public.businesses for update to authenticated
  using (owner_id = (select public.app_user_id()))
  with check (owner_id = (select public.app_user_id()));

create policy "Members read membership" on public.business_members for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members read categories" on public.categories for select to authenticated
  using (public.is_business_member(business_id));

create policy "Owners manage categories" on public.categories for all to authenticated
  using (exists (select 1 from public.businesses b
                 where b.id = business_id and b.owner_id = (select public.app_user_id())))
  with check (exists (select 1 from public.businesses b
                      where b.id = business_id and b.owner_id = (select public.app_user_id())));

create policy "Members read products" on public.products for select to authenticated
  using (public.is_business_member(business_id));
create policy "Members read customers" on public.customers for select to authenticated
  using (public.is_business_member(business_id));
create policy "Members read sales" on public.sales for select to authenticated
  using (public.is_business_member(business_id));
create policy "Members read sale items" on public.sale_items for select to authenticated
  using (public.is_business_member(business_id));
create policy "Members read expenses" on public.expenses for select to authenticated
  using (public.is_business_member(business_id));
create policy "Members read stock movements" on public.stock_movements for select to authenticated
  using (public.is_business_member(business_id));
