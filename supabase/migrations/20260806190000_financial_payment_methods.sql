-- Formas de recebimento configuráveis por empresa.
begin;

create table public.financial_payment_methods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null check (code ~ '^[a-z0-9_]+$'),
  name text not null check (length(trim(name)) between 2 and 50),
  is_active boolean not null default true,
  fee_percentage numeric(6,3) not null default 0 check (fee_percentage between 0 and 100),
  settlement_days integer not null default 0 check (settlement_days between 0 and 365),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create index financial_payment_methods_company_idx on public.financial_payment_methods (company_id, display_order);
create trigger financial_payment_methods_updated_at before update on public.financial_payment_methods
for each row execute function private.set_updated_at();
alter table public.financial_payment_methods enable row level security;

create policy financial_payment_methods_select on public.financial_payment_methods for select to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','caixa'])));
create policy financial_payment_methods_insert on public.financial_payment_methods for insert to authenticated
with check ((select private.has_company_role(company_id, array['proprietario','administrador'])));
create policy financial_payment_methods_update on public.financial_payment_methods for update to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador'])))
with check ((select private.has_company_role(company_id, array['proprietario','administrador'])));

grant select, insert, update on public.financial_payment_methods to authenticated;
revoke all on public.financial_payment_methods from anon;

insert into public.financial_payment_methods (company_id, code, name, is_active, fee_percentage, settlement_days, display_order)
select c.id, method.code, method.name, true, method.fee, method.days, method.position
from public.companies c
cross join (values
  ('dinheiro', 'Dinheiro', 0::numeric, 0, 1), ('pix', 'Pix', 0::numeric, 0, 2),
  ('cartao_debito', 'Cartão de débito', 0::numeric, 1, 3), ('cartao_credito', 'Cartão de crédito', 0::numeric, 30, 4),
  ('fiado', 'Fiado', 0::numeric, 0, 5), ('saldo_credito', 'Saldo de crédito', 0::numeric, 0, 6)
) as method(code, name, fee, days, position)
on conflict (company_id, code) do nothing;

commit;
