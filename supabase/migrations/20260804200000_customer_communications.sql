create table public.customer_communications(
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 customer_id uuid not null references public.customers(id), pet_id uuid references public.pets(id), appointment_id uuid references public.appointments(id), customer_package_id uuid references public.customer_packages(id),
 communication_type text not null check(communication_type in('confirmacao','lembrete','pet_pronto','retorno','aniversario','pacote_vencendo','manual')),
 channel text not null default 'whatsapp' check(channel in('whatsapp','telefone','email')), recipient text not null, message text not null,
 scheduled_at timestamptz not null default now(), status text not null default 'pendente' check(status in('pendente','enviado','cancelado','falhou')),
 sent_at timestamptz, sent_by uuid references public.profiles(id), created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index communications_company_status_idx on public.customer_communications(company_id,status,scheduled_at);
create index communications_customer_idx on public.customer_communications(customer_id);
create index communications_pet_idx on public.customer_communications(pet_id) where pet_id is not null;
create index communications_appointment_idx on public.customer_communications(appointment_id) where appointment_id is not null;
create index communications_package_idx on public.customer_communications(customer_package_id) where customer_package_id is not null;
create index communications_sent_by_idx on public.customer_communications(sent_by) where sent_by is not null;
create index communications_created_by_idx on public.customer_communications(created_by) where created_by is not null;
create unique index communications_unique_event_idx on public.customer_communications(communication_type,coalesce(appointment_id,customer_package_id,pet_id),scheduled_at) where communication_type<>'manual';
alter table public.customer_communications enable row level security;
grant select,insert,update on public.customer_communications to authenticated; revoke all on public.customer_communications from anon;
create policy communications_select on public.customer_communications for select to authenticated using((select private.is_company_member(company_id)));
create policy communications_insert on public.customer_communications for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente'])));
create policy communications_update on public.customer_communications for update to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente']))) with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente'])));

create function public.generate_customer_communications(p_company_id uuid) returns integer language plpgsql security invoker set search_path='' as $$
declare total integer:=0; affected integer:=0;
begin
 if not (select private.has_company_role(p_company_id,array['proprietario','administrador','gerente','atendente'])) then raise exception 'Acesso negado'; end if;
 insert into public.customer_communications(company_id,customer_id,pet_id,appointment_id,communication_type,recipient,message,scheduled_at,created_by)
 select a.company_id,a.customer_id,a.pet_id,a.id,'lembrete',coalesce(c.whatsapp,c.phone),format('Olá %s! Lembramos do agendamento de %s para %s em %s. Podemos confirmar sua presença?',c.name,coalesce(a.service_name,'atendimento'),p.name,to_char(a.scheduled_at at time zone 'America/Sao_Paulo','DD/MM/YYYY às HH24:MI')),now(),(select auth.uid())
 from public.appointments a join public.customers c on c.id=a.customer_id join public.pets p on p.id=a.pet_id
 where a.company_id=p_company_id and a.status in('agendado','confirmado') and a.scheduled_at between now() and now()+interval '24 hours' and c.communication_consent and coalesce(c.whatsapp,c.phone) is not null
 on conflict do nothing; get diagnostics affected=row_count; total:=total+affected;
 insert into public.customer_communications(company_id,customer_id,pet_id,communication_type,recipient,message,scheduled_at,created_by)
 select p.company_id,p.customer_id,p.id,'aniversario',coalesce(c.whatsapp,c.phone),format('Olá %s! Hoje é aniversário de %s. Desejamos muita saúde e momentos felizes!',c.name,p.name),date_trunc('day',now()),(select auth.uid()) from public.pets p join public.customers c on c.id=p.customer_id
 where p.company_id=p_company_id and extract(month from p.birth_date)=extract(month from current_date) and extract(day from p.birth_date)=extract(day from current_date) and c.communication_consent and coalesce(c.whatsapp,c.phone) is not null on conflict do nothing; get diagnostics affected=row_count; total:=total+affected;
 insert into public.customer_communications(company_id,customer_id,pet_id,customer_package_id,communication_type,recipient,message,scheduled_at,created_by)
 select cp.company_id,cp.customer_id,cp.pet_id,cp.id,'pacote_vencendo',coalesce(c.whatsapp,c.phone),format('Olá %s! O pacote %s de %s vence em %s e ainda possui %s utilização(ões).',c.name,cp.package_name,p.name,to_char(cp.expires_at,'DD/MM/YYYY'),cp.total_uses-cp.used_uses),cp.expires_at::timestamptz,(select auth.uid()) from public.customer_packages cp join public.customers c on c.id=cp.customer_id join public.pets p on p.id=cp.pet_id
 where cp.company_id=p_company_id and cp.status='ativo' and cp.expires_at between current_date and current_date+7 and c.communication_consent and coalesce(c.whatsapp,c.phone) is not null on conflict do nothing; get diagnostics affected=row_count; total:=total+affected;
 insert into public.customer_communications(company_id,customer_id,pet_id,communication_type,recipient,message,scheduled_at,created_by)
 select p.company_id,p.customer_id,p.id,'retorno',coalesce(c.whatsapp,c.phone),format('Olá %s! Está na hora de programar o próximo cuidado de %s. Podemos ajudar com o agendamento?',c.name,p.name),p.next_suggested_visit::timestamptz,(select auth.uid()) from public.pets p join public.customers c on c.id=p.customer_id
 where p.company_id=p_company_id and p.next_suggested_visit<=current_date and c.communication_consent and coalesce(c.whatsapp,c.phone) is not null on conflict do nothing; get diagnostics affected=row_count; total:=total+affected;
 return total;
end $$;
revoke all on function public.generate_customer_communications(uuid) from public,anon; grant execute on function public.generate_customer_communications(uuid) to authenticated;

create function private.enqueue_pet_ready() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.status='pronto' and old.status is distinct from new.status then insert into public.customer_communications(company_id,customer_id,pet_id,appointment_id,communication_type,recipient,message,scheduled_at)
 select new.company_id,new.customer_id,new.pet_id,new.id,'pet_pronto',coalesce(c.whatsapp,c.phone),format('Olá %s! %s já está pronto e aguardando para voltar para casa.',c.name,p.name),now() from public.customers c join public.pets p on p.id=new.pet_id where c.id=new.customer_id and c.communication_consent and coalesce(c.whatsapp,c.phone) is not null on conflict do nothing; end if; return new; end $$;
revoke all on function private.enqueue_pet_ready() from public,anon,authenticated;
create trigger enqueue_pet_ready after update of status on public.appointments for each row execute function private.enqueue_pet_ready();
create trigger audit_customer_communications after insert or update or delete on public.customer_communications for each row execute function private.capture_audit_log();
