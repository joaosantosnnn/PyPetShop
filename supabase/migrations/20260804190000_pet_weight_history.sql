create table public.pet_weight_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  weight numeric(7,2) not null check(weight > 0),
  source text not null check(source in ('cadastro','atualizacao','checkin','manual')),
  source_id uuid,
  notes text,
  recorded_by uuid references public.profiles(id),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index pet_weight_history_pet_date_idx on public.pet_weight_history(company_id,pet_id,recorded_at desc);
create index pet_weight_history_recorded_by_idx on public.pet_weight_history(recorded_by) where recorded_by is not null;
create unique index pet_weight_history_source_idx on public.pet_weight_history(source,source_id) where source_id is not null;

alter table public.pet_weight_history enable row level security;
grant select,insert on public.pet_weight_history to authenticated;
revoke all on public.pet_weight_history from anon;
create policy pet_weight_select on public.pet_weight_history for select to authenticated using((select private.is_company_member(company_id)));
create policy pet_weight_insert on public.pet_weight_history for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','banhista','tosador'])));

create function private.capture_pet_weight() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='pets' and new.weight is not null and (tg_op='INSERT' or old.weight is distinct from new.weight) then
    insert into public.pet_weight_history(company_id,pet_id,weight,source,source_id,recorded_by,recorded_at)
    values(new.company_id,new.id,new.weight,case when tg_op='INSERT' then 'cadastro' else 'atualizacao' end,null,(select auth.uid()),now());
  elsif tg_table_name='pet_checkins' and new.weight is not null then
    insert into public.pet_weight_history(company_id,pet_id,weight,source,source_id,notes,recorded_by,recorded_at)
    values(new.company_id,new.pet_id,new.weight,'checkin',new.id,new.pre_existing_conditions,new.created_by,new.checked_in_at)
    on conflict(source,source_id) where source_id is not null do nothing;
  end if;
  return new;
end $$;
revoke all on function private.capture_pet_weight() from public,anon,authenticated;
create trigger capture_pet_weight_update after insert or update of weight on public.pets for each row execute function private.capture_pet_weight();
create trigger capture_checkin_weight after insert on public.pet_checkins for each row execute function private.capture_pet_weight();
create trigger audit_pet_weight_history after insert or update or delete on public.pet_weight_history for each row execute function private.capture_audit_log();

insert into public.pet_weight_history(company_id,pet_id,weight,source,notes,recorded_at)
select company_id,id,weight,'cadastro','Peso atual importado para iniciar o histórico',coalesce(created_at,now()) from public.pets where weight>0;
