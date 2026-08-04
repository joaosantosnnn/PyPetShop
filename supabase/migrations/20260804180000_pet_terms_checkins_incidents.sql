create table public.liability_terms (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  title text not null, term_type text not null default 'atendimento', content text not null,
  version integer not null default 1 check(version > 0), is_required boolean not null default true,
  is_active boolean not null default true, valid_days integer check(valid_days is null or valid_days > 0),
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  unique(company_id, title, version)
);
create table public.term_acceptances (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  term_id uuid not null references public.liability_terms(id), customer_id uuid not null references public.customers(id),
  pet_id uuid references public.pets(id), appointment_id uuid references public.appointments(id),
  term_title text not null, term_content text not null, term_version integer not null,
  accepted_by_name text not null, accepted_at timestamptz not null default now(), expires_at timestamptz,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.pet_checkins (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  appointment_id uuid references public.appointments(id), customer_id uuid not null references public.customers(id),
  pet_id uuid not null references public.pets(id), responsible_name text not null, weight numeric(7,2) check(weight is null or weight > 0),
  pre_existing_conditions text, belongings text, observations text, photo_urls text[] not null default '{}',
  status text not null default 'entrada' check(status in ('entrada','em_atendimento','finalizado','entregue')),
  checked_in_at timestamptz not null default now(), checked_out_at timestamptz, created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.pet_incidents (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  appointment_id uuid references public.appointments(id), checkin_id uuid references public.pet_checkins(id),
  customer_id uuid not null references public.customers(id), pet_id uuid not null references public.pets(id),
  incident_type text not null, severity text not null check(severity in ('leve','moderado','grave','critico')),
  description text not null, actions_taken text, photo_urls text[] not null default '{}', tutor_notified boolean not null default false,
  tutor_notified_at timestamptz, occurred_at timestamptz not null default now(), created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index liability_terms_company_active_idx on public.liability_terms(company_id,is_active);
create index term_acceptances_lookup_idx on public.term_acceptances(company_id,customer_id,pet_id,term_id,expires_at);
create index term_acceptances_appointment_idx on public.term_acceptances(appointment_id) where appointment_id is not null;
create index pet_checkins_company_pet_idx on public.pet_checkins(company_id,pet_id,checked_in_at desc);
create index pet_checkins_appointment_idx on public.pet_checkins(appointment_id) where appointment_id is not null;
create index pet_incidents_company_pet_idx on public.pet_incidents(company_id,pet_id,occurred_at desc);
create index pet_incidents_appointment_idx on public.pet_incidents(appointment_id) where appointment_id is not null;
create index pet_incidents_checkin_idx on public.pet_incidents(checkin_id) where checkin_id is not null;

alter table public.liability_terms enable row level security;
alter table public.term_acceptances enable row level security;
alter table public.pet_checkins enable row level security;
alter table public.pet_incidents enable row level security;
grant select,insert,update on public.liability_terms to authenticated;
grant select,insert on public.term_acceptances to authenticated;
grant select,insert,update on public.pet_checkins to authenticated;
grant select,insert on public.pet_incidents to authenticated;

create policy terms_select on public.liability_terms for select to authenticated using((select private.is_company_member(company_id)));
create policy terms_insert on public.liability_terms for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente'])));
create policy terms_update on public.liability_terms for update to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente']))) with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente'])));
create policy acceptances_select on public.term_acceptances for select to authenticated using((select private.is_company_member(company_id)));
create policy acceptances_insert on public.term_acceptances for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente'])));
create policy checkins_select on public.pet_checkins for select to authenticated using((select private.is_company_member(company_id)));
create policy checkins_insert on public.pet_checkins for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','banhista','tosador'])));
create policy checkins_update on public.pet_checkins for update to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','banhista','tosador']))) with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','banhista','tosador'])));
create policy incidents_select on public.pet_incidents for select to authenticated using((select private.is_company_member(company_id)));
create policy incidents_insert on public.pet_incidents for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','banhista','tosador'])));

create function public.accept_liability_term(p_term_id uuid,p_customer_id uuid,p_pet_id uuid default null,p_appointment_id uuid default null,p_accepted_by_name text default null)
returns public.term_acceptances language plpgsql security invoker set search_path='' as $$
declare t public.liability_terms; result public.term_acceptances; actor uuid := (select auth.uid());
begin
  select * into t from public.liability_terms where id=p_term_id and is_active;
  if t.id is null or not (select private.has_company_role(t.company_id,array['proprietario','administrador','gerente','atendente'])) then raise exception 'Termo inválido ou acesso negado'; end if;
  if not exists(select 1 from public.customers where id=p_customer_id and company_id=t.company_id) then raise exception 'Cliente inválido'; end if;
  if p_pet_id is not null and not exists(select 1 from public.pets where id=p_pet_id and customer_id=p_customer_id and company_id=t.company_id) then raise exception 'Pet inválido'; end if;
  insert into public.term_acceptances(company_id,term_id,customer_id,pet_id,appointment_id,term_title,term_content,term_version,accepted_by_name,expires_at,created_by)
  values(t.company_id,t.id,p_customer_id,p_pet_id,p_appointment_id,t.title,t.content,t.version,coalesce(nullif(trim(p_accepted_by_name),''),'Tutor responsável'),case when t.valid_days is null then null else now()+make_interval(days=>t.valid_days) end,actor)
  returning * into result; return result;
end $$;
revoke all on function public.accept_liability_term(uuid,uuid,uuid,uuid,text) from public,anon;
grant execute on function public.accept_liability_term(uuid,uuid,uuid,uuid,text) to authenticated;

create function private.require_valid_pet_terms() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('recebido','aguardando','em_banho','em_secagem','em_tosa','finalizando','pronto','entregue') and old.status is distinct from new.status
     and exists(select 1 from public.liability_terms t where t.company_id=new.company_id and t.is_active and t.is_required and not exists(
       select 1 from public.term_acceptances a where a.term_id=t.id and a.customer_id=new.customer_id and (a.pet_id is null or a.pet_id=new.pet_id) and (a.expires_at is null or a.expires_at>now())))
  then raise exception 'Aceite de termo obrigatório pendente para este atendimento'; end if;
  return new;
end $$;
revoke all on function private.require_valid_pet_terms() from public,anon,authenticated;
create trigger require_terms_before_service before update of status on public.appointments for each row execute function private.require_valid_pet_terms();

create trigger audit_liability_terms after insert or update or delete on public.liability_terms for each row execute function private.capture_audit_log();
create trigger audit_term_acceptances after insert or update or delete on public.term_acceptances for each row execute function private.capture_audit_log();
create trigger audit_pet_checkins after insert or update or delete on public.pet_checkins for each row execute function private.capture_audit_log();
create trigger audit_pet_incidents after insert or update or delete on public.pet_incidents for each row execute function private.capture_audit_log();
