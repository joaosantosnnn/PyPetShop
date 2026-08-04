begin;
create table public.service_packages(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),service_id uuid not null,name text not null,total_uses integer not null check(total_uses>0),validity_days integer not null check(validity_days>0),price numeric(12,2) not null check(price>0),is_active boolean not null default true,created_by uuid not null,created_at timestamptz not null default now(),unique(id,company_id),constraint package_service_company_fkey foreign key(service_id,company_id) references public.services(id,company_id),constraint package_creator_company_fkey foreign key(created_by,company_id) references public.profiles(id,company_id)
);
create table public.customer_packages(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),service_package_id uuid not null,customer_id uuid not null,pet_id uuid not null,service_id uuid not null,package_name text not null,total_uses integer not null check(total_uses>0),used_uses integer not null default 0 check(used_uses>=0 and used_uses<=total_uses),price_paid numeric(12,2) not null check(price_paid>0),starts_at date not null default current_date,expires_at date not null,status text not null default 'ativo' check(status in('ativo','concluido','expirado','cancelado')),created_by uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,company_id),constraint customer_package_template_company_fkey foreign key(service_package_id,company_id) references public.service_packages(id,company_id),constraint customer_package_customer_company_fkey foreign key(customer_id,company_id) references public.customers(id,company_id),constraint customer_package_pet_company_fkey foreign key(pet_id,company_id) references public.pets(id,company_id),constraint customer_package_service_company_fkey foreign key(service_id,company_id) references public.services(id,company_id),constraint customer_package_creator_company_fkey foreign key(created_by,company_id) references public.profiles(id,company_id),check(expires_at>=starts_at)
);
create table public.package_usages(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),customer_package_id uuid not null,appointment_id uuid not null,used_at timestamptz not null default now(),created_by uuid,unique(appointment_id),constraint usage_package_company_fkey foreign key(customer_package_id,company_id) references public.customer_packages(id,company_id),constraint usage_appointment_company_fkey foreign key(appointment_id,company_id) references public.appointments(id,company_id),constraint usage_creator_company_fkey foreign key(created_by,company_id) references public.profiles(id,company_id)
);
create index service_packages_company_idx on public.service_packages(company_id,is_active);
create index customer_packages_company_pet_idx on public.customer_packages(company_id,pet_id,status,expires_at);
create index customer_packages_customer_company_idx on public.customer_packages(customer_id,company_id);
create index customer_packages_template_company_idx on public.customer_packages(service_package_id,company_id);
create index customer_packages_service_company_idx on public.customer_packages(service_id,company_id);
create index customer_packages_creator_company_idx on public.customer_packages(created_by,company_id);
create index package_usages_package_company_idx on public.package_usages(customer_package_id,company_id);
create index package_usages_company_date_idx on public.package_usages(company_id,used_at desc);
create index package_usages_creator_company_idx on public.package_usages(created_by,company_id) where created_by is not null;
alter table public.service_packages enable row level security;alter table public.customer_packages enable row level security;alter table public.package_usages enable row level security;
create policy service_packages_select on public.service_packages for select to authenticated using((select private.is_company_member(company_id)));
create policy service_packages_insert on public.service_packages for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
create policy customer_packages_select on public.customer_packages for select to authenticated using((select private.is_company_member(company_id)));
create policy customer_packages_insert on public.customer_packages for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
create policy package_usages_select on public.package_usages for select to authenticated using((select private.is_company_member(company_id)));
revoke all on public.service_packages,public.customer_packages,public.package_usages from public,anon,authenticated;
grant select,insert on public.service_packages,public.customer_packages to authenticated;grant select on public.package_usages to authenticated;
create trigger customer_packages_updated_at before update on public.customer_packages for each row execute function private.set_updated_at();
create trigger audit_service_packages after insert or update or delete on public.service_packages for each row execute function private.capture_audit_log();
create trigger audit_customer_packages after insert or update or delete on public.customer_packages for each row execute function private.capture_audit_log();
create trigger audit_package_usages after insert or update or delete on public.package_usages for each row execute function private.capture_audit_log();

create function public.sell_service_package(p_customer_id uuid,p_pet_id uuid,p_service_id uuid,p_name text,p_total_uses integer,p_validity_days integer,p_price numeric,p_payment_method text)
returns public.customer_packages language plpgsql security invoker set search_path='' as $$
declare v_company uuid;v_template public.service_packages;v_package public.customer_packages;
begin
 select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active and role in('proprietario','administrador','gerente','caixa');
 if v_company is null then raise exception 'Sem permissão para vender pacotes';end if;
 if p_total_uses<=0 or p_validity_days<=0 or p_price<=0 then raise exception 'Dados do pacote inválidos';end if;
 if p_payment_method not in('dinheiro','pix','cartao_debito','cartao_credito') then raise exception 'Forma de pagamento inválida';end if;
 if not exists(select 1 from public.customers where id=p_customer_id and company_id=v_company and is_active) or not exists(select 1 from public.pets where id=p_pet_id and customer_id=p_customer_id and company_id=v_company and is_active) or not exists(select 1 from public.services where id=p_service_id and company_id=v_company and is_active) then raise exception 'Cliente, pet ou serviço inválido';end if;
 insert into public.service_packages(company_id,service_id,name,total_uses,validity_days,price,created_by) values(v_company,p_service_id,trim(p_name),p_total_uses,p_validity_days,p_price,(select auth.uid())) returning * into v_template;
 insert into public.customer_packages(company_id,service_package_id,customer_id,pet_id,service_id,package_name,total_uses,price_paid,expires_at,created_by) values(v_company,v_template.id,p_customer_id,p_pet_id,p_service_id,v_template.name,p_total_uses,p_price,current_date+p_validity_days,(select auth.uid())) returning * into v_package;
 insert into public.financial_transactions(company_id,type,category,description,amount,due_date,payment_date,status,payment_method,customer_id,created_by) values(v_company,'receita','Pacote de serviços','Venda do pacote '||v_template.name,p_price,current_date,current_date,'pago',p_payment_method,p_customer_id,(select auth.uid()));
 return v_package;
end;$$;
revoke all on function public.sell_service_package(uuid,uuid,uuid,text,integer,integer,numeric,text) from public,anon;grant execute on function public.sell_service_package(uuid,uuid,uuid,text,integer,integer,numeric,text) to authenticated;

create function private.consume_package_on_delivery() returns trigger language plpgsql security definer set search_path='' as $$
declare v_package public.customer_packages;
begin
 if new.status<>'entregue' or old.status='entregue' then return new;end if;
 select * into v_package from public.customer_packages where company_id=new.company_id and pet_id=new.pet_id and service_id=new.service_id and status='ativo' and expires_at>=current_date and used_uses<total_uses order by expires_at,id for update limit 1;
 if not found then return new;end if;
 insert into public.package_usages(company_id,customer_package_id,appointment_id,created_by) values(new.company_id,v_package.id,new.id,(select auth.uid())) on conflict(appointment_id) do nothing;
 if found then update public.customer_packages set used_uses=used_uses+1,status=case when used_uses+1>=total_uses then 'concluido' else status end where id=v_package.id;end if;
 return new;
end;$$;
revoke all on function private.consume_package_on_delivery() from public,anon,authenticated;
create trigger appointments_consume_package after update of status on public.appointments for each row execute function private.consume_package_on_delivery();
commit;
