begin;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete restrict,
  actor_id uuid,
  actor_name text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_company_created_idx on public.audit_logs(company_id, created_at desc);
create index audit_logs_company_entity_created_idx on public.audit_logs(company_id, entity_type, created_at desc);

alter table public.audit_logs enable row level security;
create policy audit_logs_select on public.audit_logs for select to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador'])));

revoke all on public.audit_logs from public, anon, authenticated;
grant select on public.audit_logs to authenticated;

create function private.capture_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_company_id uuid;
  v_entity_id uuid;
  v_actor_name text;
begin
  if tg_op = 'INSERT' then
    v_after := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after := to_jsonb(new);
    if v_before = v_after then return new; end if;
  else
    v_before := to_jsonb(old);
  end if;

  if tg_table_name = 'companies' then
    v_company_id := coalesce((v_after->>'id')::uuid, (v_before->>'id')::uuid);
  else
    v_company_id := coalesce((v_after->>'company_id')::uuid, (v_before->>'company_id')::uuid);
  end if;
  v_entity_id := coalesce((v_after->>'id')::uuid, (v_before->>'id')::uuid);

  select p.full_name into v_actor_name from public.profiles p where p.id = (select auth.uid());
  v_actor_name := coalesce(v_actor_name, (select auth.uid())::text, current_user);

  insert into public.audit_logs(company_id, actor_id, actor_name, action, entity_type, entity_id, before_data, after_data)
  values(v_company_id, (select auth.uid()), v_actor_name, tg_op, tg_table_name, v_entity_id, v_before, v_after);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.capture_audit_log() from public, anon, authenticated;

create trigger audit_companies after insert or update or delete on public.companies for each row execute function private.capture_audit_log();
create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function private.capture_audit_log();
create trigger audit_customers after insert or update or delete on public.customers for each row execute function private.capture_audit_log();
create trigger audit_pets after insert or update or delete on public.pets for each row execute function private.capture_audit_log();
create trigger audit_services after insert or update or delete on public.services for each row execute function private.capture_audit_log();
create trigger audit_appointments after insert or update or delete on public.appointments for each row execute function private.capture_audit_log();
create trigger audit_products after insert or update or delete on public.products for each row execute function private.capture_audit_log();
create trigger audit_stock_movements after insert or update or delete on public.stock_movements for each row execute function private.capture_audit_log();
create trigger audit_sales after insert or update or delete on public.sales for each row execute function private.capture_audit_log();
create trigger audit_service_orders after insert or update or delete on public.service_orders for each row execute function private.capture_audit_log();
create trigger audit_financial_transactions after insert or update or delete on public.financial_transactions for each row execute function private.capture_audit_log();
create trigger audit_cash_registers after insert or update or delete on public.cash_registers for each row execute function private.capture_audit_log();
create trigger audit_cash_movements after insert or update or delete on public.cash_movements for each row execute function private.capture_audit_log();
create trigger audit_employee_invites after insert or update or delete on public.employee_invites for each row execute function private.capture_audit_log();
create trigger audit_blocked_times after insert or update or delete on public.blocked_times for each row execute function private.capture_audit_log();

commit;
