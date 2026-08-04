-- PetGestor: comandas, pagamentos, comissões e financeiro.
begin;

alter table public.appointments
  add constraint appointments_id_company_unique unique (id, company_id);

create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  company_id uuid not null references public.companies(id) on delete restrict,
  appointment_id uuid,
  customer_id uuid not null,
  pet_id uuid not null,
  status text not null default 'aberta' check (status in ('aberta','em_atendimento','aguardando_pagamento','paga','parcialmente_paga','cancelada')),
  photo_before_url text,
  photo_after_url text,
  tutor_signature_accepted boolean not null default false,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id),
  unique (appointment_id),
  constraint orders_appointment_company_fkey foreign key (appointment_id, company_id) references public.appointments(id, company_id) on delete restrict,
  constraint orders_customer_company_fkey foreign key (customer_id, company_id) references public.customers(id, company_id) on delete restrict,
  constraint orders_pet_company_fkey foreign key (pet_id, company_id) references public.pets(id, company_id) on delete restrict
);

create table public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  service_order_id uuid not null,
  item_type text not null check (item_type in ('service','product','internal_consumption')),
  service_id uuid,
  product_id uuid,
  name text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  total_price numeric(12,2) not null default 0 check (total_price >= 0),
  assigned_employee_id uuid,
  commission_amount numeric(12,2) not null default 0 check (commission_amount >= 0),
  created_at timestamptz not null default now(),
  constraint order_items_order_company_fkey foreign key (service_order_id, company_id) references public.service_orders(id, company_id) on delete cascade,
  constraint order_items_service_company_fkey foreign key (service_id, company_id) references public.services(id, company_id) on delete restrict,
  constraint order_items_product_company_fkey foreign key (product_id, company_id) references public.products(id, company_id) on delete restrict,
  constraint order_items_employee_company_fkey foreign key (assigned_employee_id, company_id) references public.profiles(id, company_id) on delete restrict,
  check ((item_type = 'service' and service_id is not null and product_id is null) or (item_type <> 'service' and product_id is not null and service_id is null))
);

create table public.service_order_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  service_order_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('dinheiro','pix','cartao_debito','cartao_credito','fiado')),
  received_by uuid,
  paid_at timestamptz not null default now(),
  notes text,
  constraint order_payments_order_company_fkey foreign key (service_order_id, company_id) references public.service_orders(id, company_id) on delete restrict,
  constraint order_payments_receiver_company_fkey foreign key (received_by, company_id) references public.profiles(id, company_id) on delete restrict
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  type text not null check (type in ('receita','despesa','sangria','suprimento')),
  category text not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  payment_date date,
  status text not null default 'pendente' check (status in ('pendente','pago','atrasado','cancelado')),
  payment_method text,
  customer_id uuid,
  supplier_id uuid,
  service_order_id uuid,
  sale_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_customer_company_fkey foreign key (customer_id, company_id) references public.customers(id, company_id) on delete restrict,
  constraint financial_supplier_company_fkey foreign key (supplier_id, company_id) references public.suppliers(id, company_id) on delete restrict,
  constraint financial_order_company_fkey foreign key (service_order_id, company_id) references public.service_orders(id, company_id) on delete restrict,
  constraint financial_sale_company_fkey foreign key (sale_id, company_id) references public.sales(id, company_id) on delete restrict,
  constraint financial_creator_company_fkey foreign key (created_by, company_id) references public.profiles(id, company_id) on delete restrict
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  service_order_item_id uuid not null references public.service_order_items(id) on delete restrict,
  employee_id uuid not null,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pendente' check (status in ('pendente','paga','cancelada')),
  created_at timestamptz not null default now(),
  constraint commissions_employee_company_fkey foreign key (employee_id, company_id) references public.profiles(id, company_id) on delete restrict
);

create index orders_company_date_idx on public.service_orders(company_id, created_at desc);
create index orders_appointment_company_idx on public.service_orders(appointment_id, company_id);
create index orders_customer_company_idx on public.service_orders(customer_id, company_id);
create index orders_pet_company_idx on public.service_orders(pet_id, company_id);
create index order_items_order_company_idx on public.service_order_items(service_order_id, company_id);
create index order_items_service_company_idx on public.service_order_items(service_id, company_id);
create index order_items_product_company_idx on public.service_order_items(product_id, company_id);
create index order_items_employee_company_idx on public.service_order_items(assigned_employee_id, company_id);
create index order_payments_order_company_idx on public.service_order_payments(service_order_id, company_id);
create index order_payments_receiver_company_idx on public.service_order_payments(received_by, company_id);
create index financial_company_date_idx on public.financial_transactions(company_id, due_date desc);
create index financial_customer_company_idx on public.financial_transactions(customer_id, company_id);
create index financial_supplier_company_idx on public.financial_transactions(supplier_id, company_id);
create index financial_order_company_idx on public.financial_transactions(service_order_id, company_id);
create index financial_sale_company_idx on public.financial_transactions(sale_id, company_id);
create index financial_creator_company_idx on public.financial_transactions(created_by, company_id);
create index commissions_employee_company_idx on public.commissions(employee_id, company_id);

create trigger service_orders_updated_at before update on public.service_orders for each row execute function private.set_updated_at();
create trigger financial_transactions_updated_at before update on public.financial_transactions for each row execute function private.set_updated_at();

alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;
alter table public.service_order_payments enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.commissions enable row level security;

create policy orders_select on public.service_orders for select to authenticated using (private.is_company_member(company_id));
create policy orders_insert on public.service_orders for insert to authenticated with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']));
create policy orders_update on public.service_orders for update to authenticated using (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador'])) with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']));
create policy order_items_select on public.service_order_items for select to authenticated using (private.is_company_member(company_id));
create policy order_items_insert on public.service_order_items for insert to authenticated with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']));
create policy order_payments_select on public.service_order_payments for select to authenticated using (private.is_company_member(company_id));
create policy order_payments_insert on public.service_order_payments for insert to authenticated with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','caixa']));
create policy financial_select on public.financial_transactions for select to authenticated using (private.is_company_member(company_id));
create policy financial_insert on public.financial_transactions for insert to authenticated with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','caixa']));
create policy financial_update on public.financial_transactions for update to authenticated using (private.has_company_role(company_id, array['proprietario','administrador','gerente','caixa'])) with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','caixa']));
create policy commissions_select on public.commissions for select to authenticated using (private.is_company_member(company_id));
create policy commissions_insert on public.commissions for insert to authenticated with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','caixa']));

grant select, insert, update on public.service_orders, public.financial_transactions to authenticated;
grant select, insert on public.service_order_items, public.service_order_payments, public.commissions to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on public.service_orders, public.service_order_items, public.service_order_payments, public.financial_transactions, public.commissions from anon;

commit;
