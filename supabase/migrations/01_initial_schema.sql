-- PetGestor: fundação segura para Supabase PostgreSQL 17
-- Bloco 2: limpeza do projeto anterior, autenticação, multiempresa e RLS.

begin;

-- Estruturas do projeto anterior, removidas com autorização do proprietário.
drop table if exists public.permissoes cascade;
drop table if exists public.membros cascade;
drop table if exists public.visitantes cascade;
drop table if exists public.usuarios cascade;

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  trade_name text,
  cnpj text,
  phone text,
  whatsapp text,
  email text,
  postal_code text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text check (state is null or char_length(state) = 2),
  logo_url text,
  opening_time time not null default '08:00',
  closing_time time not null default '18:00',
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes between 5 and 240),
  capacity_per_slot integer not null default 3 check (capacity_per_slot between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete restrict,
  full_name text not null default 'Novo usuário',
  email text not null,
  phone text,
  role text not null default 'atendente' check (role in (
    'proprietario', 'administrador', 'gerente', 'atendente',
    'caixa', 'banhista', 'tosador', 'estoquista'
  )),
  is_active boolean not null default false,
  commission_rate numeric(5,2) not null default 0 check (commission_rate between 0 and 100),
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

create index profiles_company_id_idx on public.profiles(company_id);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  cpf text,
  phone text,
  whatsapp text,
  email text,
  birth_date date,
  postal_code text,
  address text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text check (state is null or char_length(state) = 2),
  notes text,
  contact_preference text not null default 'whatsapp' check (contact_preference in ('whatsapp','telefone','email')),
  communication_consent boolean not null default false,
  is_active boolean not null default true,
  total_spent numeric(12,2) not null default 0 check (total_spent >= 0),
  outstanding_balance numeric(12,2) not null default 0 check (outstanding_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_company_id_idx on public.customers(company_id);
create index customers_company_name_idx on public.customers(company_id, lower(name));
create unique index customers_company_cpf_uidx on public.customers(company_id, cpf) where cpf is not null and cpf <> '';

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  photo_url text,
  species text not null check (species in ('cao','gato','ave','roedor','outro')),
  breed text,
  gender text check (gender is null or gender in ('macho','femea')),
  birth_date date,
  approximate_age text,
  weight numeric(7,2) check (weight is null or weight >= 0),
  size_category text not null default 'medio' check (size_category in ('pequeno','medio','grande','gigante')),
  color text,
  is_neutered boolean not null default false,
  allergies text,
  diseases text,
  medications text,
  restrictions text,
  temperament text not null default 'calmo' check (temperament in ('docil','calmo','agitado','medroso','agressivo')),
  aggression_level integer not null default 1 check (aggression_level between 1 and 5),
  special_cares text,
  vet_name text,
  vet_phone text,
  notes text,
  is_active boolean not null default true,
  last_visit_at timestamptz,
  next_suggested_visit date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pets_company_id_idx on public.pets(company_id);
create index pets_customer_id_idx on public.pets(customer_id);
create index pets_company_name_idx on public.pets(company_id, lower(name));

create table public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null,
  description text,
  category text not null default 'Banho e Tosa',
  estimated_duration_minutes integer not null default 45 check (estimated_duration_minutes between 5 and 1440),
  base_price numeric(12,2) not null check (base_price >= 0),
  price_small numeric(12,2) check (price_small is null or price_small >= 0),
  price_medium numeric(12,2) check (price_medium is null or price_medium >= 0),
  price_large numeric(12,2) check (price_large is null or price_large >= 0),
  commission_percentage numeric(5,2) not null default 0 check (commission_percentage between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create index services_company_id_idx on public.services(company_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  pet_id uuid not null references public.pets(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  employee_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz not null,
  estimated_duration_minutes integer not null default 45 check (estimated_duration_minutes between 5 and 1440),
  expected_price numeric(12,2) not null check (expected_price >= 0),
  status text not null default 'agendado' check (status in (
    'pendente','agendado','confirmado','recebido','aguardando','em_banho',
    'em_secagem','em_tosa','finalizando','pronto','entregue','cancelado','faltou'
  )),
  needs_pickup_delivery boolean not null default false,
  pickup_address text,
  cancellation_reason text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_company_schedule_idx on public.appointments(company_id, scheduled_at);
create index appointments_employee_schedule_idx on public.appointments(employee_id, scheduled_at);
create index appointments_customer_id_idx on public.appointments(customer_id);
create index appointments_pet_id_idx on public.appointments(pet_id);
create index appointments_service_id_idx on public.appointments(service_id);

create table public.appointment_status_history (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete restrict,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  previous_status text,
  new_status text not null,
  reason text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index appointment_status_history_company_idx on public.appointment_status_history(company_id);
create index appointment_status_history_appointment_idx on public.appointment_status_history(appointment_id, changed_at);

-- Helpers privados: sempre derivam empresa e função do usuário autenticado.
create or replace function private.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.company_id
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;

create or replace function private.is_company_member(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.company_id = target_company
      and p.is_active
  )
$$;

create or replace function private.has_company_role(target_company uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.company_id = target_company
      and p.is_active
      and p.role = any(allowed_roles)
  )
$$;

revoke all on all functions in schema private from public, anon;
grant execute on function private.current_company_id() to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_company_member(uuid) to authenticated;
grant execute on function private.has_company_role(uuid, text[]) to authenticated;

-- Primeiro cadastro: cria a empresa e o proprietário. Cadastros posteriores aguardam ativação.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_company uuid;
  first_user boolean;
begin
  perform pg_advisory_xact_lock(8172401);
  select not exists (select 1 from public.profiles) into first_user;

  if first_user then
    insert into public.companies(name, trade_name, email)
    values ('Meu Pet Shop', 'Meu Pet Shop', new.email)
    returning id into target_company;

    insert into public.profiles(id, company_id, full_name, email, role, is_active)
    values (
      new.id,
      target_company,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      new.email,
      'proprietario',
      true
    );
  else
    insert into public.profiles(id, company_id, full_name, email, role, is_active)
    values (
      new.id,
      null,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      new.email,
      'atendente',
      false
    );
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger companies_updated_at before update on public.companies
for each row execute function private.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger customers_updated_at before update on public.customers
for each row execute function private.set_updated_at();
create trigger pets_updated_at before update on public.pets
for each row execute function private.set_updated_at();
create trigger services_updated_at before update on public.services
for each row execute function private.set_updated_at();
create trigger appointments_updated_at before update on public.appointments
for each row execute function private.set_updated_at();

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.pets enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_status_history enable row level security;

create policy companies_select on public.companies for select to authenticated
using (private.is_company_member(id));
create policy companies_update on public.companies for update to authenticated
using (private.has_company_role(id, array['proprietario','administrador']))
with check (private.has_company_role(id, array['proprietario','administrador']));

create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.is_company_member(company_id));
create policy profiles_update_admin on public.profiles for update to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador']))
with check (private.has_company_role(company_id, array['proprietario','administrador']));

create policy customers_select on public.customers for select to authenticated
using (private.is_company_member(company_id));
create policy customers_insert on public.customers for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa']));
create policy customers_update on public.customers for update to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa']));

create policy pets_select on public.pets for select to authenticated
using (private.is_company_member(company_id));
create policy pets_insert on public.pets for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','banhista','tosador']));
create policy pets_update on public.pets for update to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','banhista','tosador']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','banhista','tosador']));

create policy services_select on public.services for select to authenticated
using (private.is_company_member(company_id));
create policy services_insert on public.services for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente']));
create policy services_update on public.services for update to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente']));

create policy appointments_select on public.appointments for select to authenticated
using (private.is_company_member(company_id));
create policy appointments_insert on public.appointments for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']));
create policy appointments_update on public.appointments for update to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']));

create policy appointment_history_select on public.appointment_status_history for select to authenticated
using (private.is_company_member(company_id));
create policy appointment_history_insert on public.appointment_status_history for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']));

revoke all on all tables in schema public from anon;
grant select, update on public.companies to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.pets to authenticated;
grant select, insert, update on public.services to authenticated;
grant select, insert, update on public.appointments to authenticated;
grant select, insert on public.appointment_status_history to authenticated;
grant usage, select on all sequences in schema public to authenticated;

commit;
