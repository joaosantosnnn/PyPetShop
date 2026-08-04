-- PetGestor: catálogo, fornecedores, estoque e vendas atômicas.
begin;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  company_name text not null,
  trade_name text,
  cnpj text,
  contact_person text,
  phone text,
  whatsapp text,
  email text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  supplier_id uuid,
  name text not null check (char_length(trim(name)) between 2 and 180),
  description text,
  category text not null default 'Alimentação',
  brand text,
  internal_code text,
  barcode text,
  unit text not null default 'UN',
  sell_by_weight boolean not null default false,
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  profit_margin_percent numeric(8,2) not null default 0,
  current_stock numeric(12,3) not null default 0 check (current_stock >= 0),
  min_stock numeric(12,3) not null default 0 check (min_stock >= 0),
  max_stock numeric(12,3) not null default 0 check (max_stock >= 0),
  location_in_store text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id),
  constraint products_supplier_company_fkey foreign key (supplier_id, company_id)
    references public.suppliers(id, company_id) on delete restrict
);

create unique index products_company_barcode_uidx on public.products(company_id, barcode)
  where barcode is not null and barcode <> '';
create index products_company_name_idx on public.products(company_id, lower(name));
create index products_supplier_company_idx on public.products(supplier_id, company_id);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  product_id uuid not null,
  movement_type text not null check (movement_type in (
    'compra','entrada_manual','venda','consumo_servico','devolucao','perda',
    'avaria','vencimento','ajuste_positivo','ajuste_negativo','inventario'
  )),
  quantity numeric(12,3) not null check (quantity > 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  batch_number text,
  expiration_date date,
  reason text,
  previous_stock numeric(12,3) not null,
  new_stock numeric(12,3) not null check (new_stock >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint stock_product_company_fkey foreign key (product_id, company_id)
    references public.products(id, company_id) on delete restrict
);
create index stock_movements_product_date_idx on public.stock_movements(product_id, created_at desc);
create index stock_movements_company_date_idx on public.stock_movements(company_id, created_at desc);
create index stock_movements_created_by_idx on public.stock_movements(created_by);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number bigint generated always as identity,
  company_id uuid not null references public.companies(id) on delete restrict,
  customer_id uuid,
  seller_id uuid,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('dinheiro','pix','cartao_debito','cartao_credito','fiado')),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  change_amount numeric(12,2) not null default 0 check (change_amount >= 0),
  status text not null default 'concluida' check (status in ('concluida','cancelada','devolvida')),
  notes text,
  created_at timestamptz not null default now(),
  unique (id, company_id),
  constraint sales_customer_company_fkey foreign key (customer_id, company_id)
    references public.customers(id, company_id) on delete restrict,
  constraint sales_seller_company_fkey foreign key (seller_id, company_id)
    references public.profiles(id, company_id) on delete restrict
);
create index sales_company_date_idx on public.sales(company_id, created_at desc);
create index sales_customer_company_idx on public.sales(customer_id, company_id);
create index sales_seller_company_idx on public.sales(seller_id, company_id);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  sale_id uuid not null,
  product_id uuid not null,
  product_name text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  constraint sale_items_sale_company_fkey foreign key (sale_id, company_id)
    references public.sales(id, company_id) on delete cascade,
  constraint sale_items_product_company_fkey foreign key (product_id, company_id)
    references public.products(id, company_id) on delete restrict
);
create index sale_items_sale_company_idx on public.sale_items(sale_id, company_id);
create index sale_items_product_company_idx on public.sale_items(product_id, company_id);

create trigger suppliers_updated_at before update on public.suppliers
for each row execute function private.set_updated_at();
create trigger products_updated_at before update on public.products
for each row execute function private.set_updated_at();

alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

create policy suppliers_select on public.suppliers for select to authenticated
using (private.is_company_member(company_id));
create policy suppliers_write on public.suppliers for all to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista']));
create policy products_select on public.products for select to authenticated
using (private.is_company_member(company_id));
create policy products_write on public.products for all to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista']));
create policy stock_select on public.stock_movements for select to authenticated
using (private.is_company_member(company_id));
create policy stock_insert on public.stock_movements for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista','caixa']));
create policy sales_select on public.sales for select to authenticated
using (private.is_company_member(company_id));
create policy sales_insert on public.sales for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','caixa']));
create policy sales_update on public.sales for update to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente']));
create policy sale_items_select on public.sale_items for select to authenticated
using (private.is_company_member(company_id));
create policy sale_items_insert on public.sale_items for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','caixa']));

grant select, insert, update on public.suppliers, public.products to authenticated;
grant select, insert on public.stock_movements, public.sale_items to authenticated;
grant select, insert, update on public.sales to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace function public.adjust_product_stock(
  p_product_id uuid, p_quantity numeric, p_movement_type text, p_reason text default null
)
returns public.products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid;
  v_product public.products;
  v_new_stock numeric;
begin
  select p.company_id into v_company from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
    and p.role = any(array['proprietario','administrador','gerente','estoquista']);
  if v_company is null then raise exception 'Acesso não autorizado'; end if;
  if p_quantity = 0 then raise exception 'A quantidade não pode ser zero'; end if;

  select * into v_product from public.products
  where id = p_product_id and company_id = v_company for update;
  if not found then raise exception 'Produto não encontrado'; end if;

  v_new_stock := v_product.current_stock + p_quantity;
  if v_new_stock < 0 then raise exception 'Estoque insuficiente'; end if;

  update public.products set current_stock = v_new_stock where id = v_product.id
  returning * into v_product;
  insert into public.stock_movements(
    company_id, product_id, movement_type, quantity, unit_cost, reason,
    previous_stock, new_stock, created_by
  ) values (
    v_company, v_product.id, p_movement_type, abs(p_quantity), v_product.cost_price, p_reason,
    v_new_stock - p_quantity, v_new_stock, (select auth.uid())
  );
  return v_product;
end;
$$;

create or replace function public.complete_product_sale(
  p_customer_id uuid, p_items jsonb, p_discount numeric,
  p_payment_method text, p_amount_paid numeric, p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid;
  v_sale public.sales;
  v_item jsonb;
  v_product public.products;
  v_quantity numeric;
  v_subtotal numeric := 0;
  v_total numeric;
begin
  select p.company_id into v_company from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
    and p.role = any(array['proprietario','administrador','gerente','caixa']);
  if v_company is null then raise exception 'Acesso não autorizado'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A venda precisa ter produtos';
  end if;
  if p_payment_method not in ('dinheiro','pix','cartao_debito','cartao_credito','fiado') then
    raise exception 'Forma de pagamento inválida';
  end if;
  if p_customer_id is not null and not exists (
    select 1 from public.customers where id = p_customer_id and company_id = v_company
  ) then raise exception 'Cliente inválido'; end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::numeric;
    if v_quantity <= 0 then raise exception 'Quantidade inválida'; end if;
    select * into v_product from public.products
    where id = (v_item ->> 'product_id')::uuid and company_id = v_company and is_active for update;
    if not found then raise exception 'Produto não encontrado'; end if;
    if v_product.current_stock < v_quantity then raise exception 'Estoque insuficiente para %', v_product.name; end if;
    v_subtotal := v_subtotal + (v_product.sale_price * v_quantity);
  end loop;

  if coalesce(p_discount, 0) < 0 or coalesce(p_discount, 0) > v_subtotal then
    raise exception 'Desconto inválido';
  end if;
  v_total := v_subtotal - coalesce(p_discount, 0);
  if p_payment_method = 'dinheiro' and coalesce(p_amount_paid, 0) < v_total then
    raise exception 'Valor recebido é menor que o total';
  end if;

  insert into public.sales(
    company_id, customer_id, seller_id, subtotal, discount, total_amount,
    payment_method, amount_paid, change_amount, notes
  ) values (
    v_company, p_customer_id, (select auth.uid()), v_subtotal, coalesce(p_discount, 0), v_total,
    p_payment_method, coalesce(p_amount_paid, v_total),
    case when p_payment_method = 'dinheiro' then greatest(coalesce(p_amount_paid, 0) - v_total, 0) else 0 end,
    p_notes
  ) returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::numeric;
    select * into v_product from public.products
    where id = (v_item ->> 'product_id')::uuid and company_id = v_company for update;

    insert into public.sale_items(company_id, sale_id, product_id, product_name, quantity, unit_price, total_price)
    values (v_company, v_sale.id, v_product.id, v_product.name, v_quantity, v_product.sale_price, v_quantity * v_product.sale_price);
    insert into public.stock_movements(
      company_id, product_id, movement_type, quantity, unit_cost, reason,
      previous_stock, new_stock, created_by
    ) values (
      v_company, v_product.id, 'venda', v_quantity, v_product.cost_price,
      'Venda PDV #' || v_sale.sale_number, v_product.current_stock,
      v_product.current_stock - v_quantity, (select auth.uid())
    );
    update public.products set current_stock = current_stock - v_quantity where id = v_product.id;
  end loop;

  if p_customer_id is not null then
    update public.customers set total_spent = total_spent + v_total
    where id = p_customer_id and company_id = v_company;
  end if;

  return jsonb_build_object('id', v_sale.id, 'sale_number', v_sale.sale_number, 'subtotal', v_subtotal,
    'total_amount', v_total, 'change_amount', v_sale.change_amount, 'created_at', v_sale.created_at);
end;
$$;

revoke all on function public.adjust_product_stock(uuid,numeric,text,text) from public, anon;
revoke all on function public.complete_product_sale(uuid,jsonb,numeric,text,numeric,text) from public, anon;
grant execute on function public.adjust_product_stock(uuid,numeric,text,text) to authenticated;
grant execute on function public.complete_product_sale(uuid,jsonb,numeric,text,numeric,text) to authenticated;

commit;
