begin;
create table public.delivery_requests(
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  customer_id uuid not null,
  pet_id uuid not null,
  type text not null check(type in('busca','entrega','ambos')),
  address text not null,
  scheduled_at timestamptz not null,
  driver_id uuid,
  delivery_fee numeric(12,2) not null default 0 check(delivery_fee>=0),
  status text not null default 'pendente' check(status in('pendente','em_transito','concluido','cancelado')),
  notes text,
  delivered_to_person text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_customer_company_fkey foreign key(customer_id,company_id) references public.customers(id,company_id),
  constraint delivery_pet_company_fkey foreign key(pet_id,company_id) references public.pets(id,company_id),
  constraint delivery_driver_company_fkey foreign key(driver_id,company_id) references public.profiles(id,company_id),
  constraint delivery_creator_company_fkey foreign key(created_by,company_id) references public.profiles(id,company_id)
);
create index delivery_company_schedule_idx on public.delivery_requests(company_id,scheduled_at desc);
create index delivery_customer_company_idx on public.delivery_requests(customer_id,company_id);
create index delivery_pet_company_idx on public.delivery_requests(pet_id,company_id);
create index delivery_driver_company_idx on public.delivery_requests(driver_id,company_id) where driver_id is not null;
create index delivery_creator_company_idx on public.delivery_requests(created_by,company_id);
alter table public.delivery_requests enable row level security;
create policy delivery_select on public.delivery_requests for select to authenticated using((select private.is_company_member(company_id)));
create policy delivery_insert on public.delivery_requests for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente'])));
create policy delivery_update on public.delivery_requests for update to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente']))) with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente'])));
revoke all on public.delivery_requests from public,anon,authenticated;
grant select,insert,update on public.delivery_requests to authenticated;
create trigger delivery_updated_at before update on public.delivery_requests for each row execute function private.set_updated_at();
create trigger audit_delivery_requests after insert or update or delete on public.delivery_requests for each row execute function private.capture_audit_log();
commit;
