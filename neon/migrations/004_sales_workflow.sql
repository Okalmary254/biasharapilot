-- BiasharaPilot AI
-- Migration 004: atomic sales recording with stock deduction.
create or replace function public.create_sale(
  p_business_id uuid,
  p_items jsonb,
  p_customer_id uuid default null,
  p_payment_method text default 'cash',
  p_amount_paid numeric default 0,
  p_discount numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.app_user_id();
  v_sale_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(14,3);
  v_price numeric(14,2);
  v_subtotal numeric(14,2) := 0;
  v_total numeric(14,2);
  v_receipt text;
begin
  if v_uid is null or not public.is_business_member(p_business_id) then
    raise exception 'Not authorised for this business';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item to the sale';
  end if;
  if coalesce(p_discount, 0) < 0 or coalesce(p_amount_paid, 0) < 0 then
    raise exception 'Discount and amount paid cannot be negative';
  end if;
  if p_customer_id is not null and not exists (
    select 1 from public.customers c
    where c.id = p_customer_id and c.business_id = p_business_id
  ) then
    raise exception 'Customer does not belong to this business';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    if v_qty <= 0 then raise exception 'Quantity must be greater than zero'; end if;
    select * into v_product
    from public.products p
    where p.id = (v_item->>'product_id')::uuid
      and p.business_id = p_business_id and p.is_active = true
    for update;
    if not found then raise exception 'A selected product is unavailable'; end if;
    if v_product.stock_quantity < v_qty then
      raise exception 'Insufficient stock for % (available: %)', v_product.name, v_product.stock_quantity;
    end if;
    v_price := coalesce(nullif(v_item->>'unit_price', '')::numeric, v_product.selling_price);
    if v_price < 0 then raise exception 'Unit price cannot be negative'; end if;
    v_subtotal := v_subtotal + (v_qty * v_price);
  end loop;

  v_total := v_subtotal - coalesce(p_discount, 0);
  if v_total < 0 then raise exception 'Discount cannot exceed the sale subtotal'; end if;

  v_receipt := 'BP-' || to_char(now() at time zone 'Africa/Nairobi', 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.sales (
    business_id, customer_id, receipt_number, subtotal, discount, total,
    amount_paid, payment_method, status, created_by
  ) values (
    p_business_id, p_customer_id, v_receipt, v_subtotal, coalesce(p_discount, 0),
    v_total, coalesce(p_amount_paid, 0), coalesce(p_payment_method, 'cash'),
    case when coalesce(p_amount_paid, 0) >= v_total then 'completed' else 'pending' end,
    v_uid
  ) returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    select * into v_product from public.products
    where id = (v_item->>'product_id')::uuid and business_id = p_business_id
    for update;
    v_price := coalesce(nullif(v_item->>'unit_price', '')::numeric, v_product.selling_price);

    insert into public.sale_items (
      sale_id, business_id, product_id, product_name, quantity,
      unit_price, unit_cost, line_total
    ) values (
      v_sale_id, p_business_id, v_product.id, v_product.name, v_qty,
      v_price, v_product.cost_price, v_qty * v_price
    );

    update public.products
      set stock_quantity = stock_quantity - v_qty, updated_at = now()
      where id = v_product.id and business_id = p_business_id;

    insert into public.stock_movements (
      business_id, product_id, movement_type, quantity_change, reference_id, created_by
    ) values (
      p_business_id, v_product.id, 'sale', -v_qty, v_sale_id, v_uid
    );
  end loop;

  return v_sale_id;
end;
$$;

revoke execute on function public.create_sale(uuid, jsonb, uuid, text, numeric, numeric) from public;
grant execute on function public.create_sale(uuid, jsonb, uuid, text, numeric, numeric) to authenticated;
