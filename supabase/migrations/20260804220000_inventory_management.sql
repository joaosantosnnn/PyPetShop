begin;

alter table public.products
  add column next_batch_number text,
  add column next_expiration_date date;

create table public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 120),
  status text not null default 'aberto' check (status in ('aberto','concluido','cancelado')),
  created_by uuid not null,
  completed_by uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, company_id),
  constraint inventory_count_creator_company_fkey foreign key (created_by, company_id) references public.profiles(id, company_id),
  constraint inventory_count_completer_company_fkey foreign key (completed_by, company_id) references public.profiles(id, company_id)
);

create table public.inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  inventory_count_id uuid not null,
  product_id uuid not null,
  product_name text not null,
  expected_quantity numeric(12,3) not null check (expected_quantity >= 0),
  counted_quantity numeric(12,3) check (counted_quantity >= 0),
  difference numeric(12,3) generated always as (counted_quantity - expected_quantity) stored,
  unique (inventory_count_id, product_id),
  constraint inventory_item_count_company_fkey foreign key (inventory_count_id, company_id) references public.inventory_counts(id, company_id) on delete cascade,
  constraint inventory_item_product_company_fkey foreign key (product_id, company_id) references public.products(id, company_id)
);

create index inventory_counts_company_created_idx on public.inventory_counts(company_id, created_at desc);
create index inventory_counts_creator_company_idx on public.inventory_counts(created_by, company_id);
create index inventory_counts_completer_company_idx on public.inventory_counts(completed_by, company_id) where completed_by is not null;
create index inventory_items_count_company_idx on public.inventory_count_items(inventory_count_id, company_id);
create index inventory_items_product_company_idx on public.inventory_count_items(product_id, company_id);

alter table public.inventory_counts enable row level security;
alter table public.inventory_count_items enable row level security;

create policy inventory_counts_select on public.inventory_counts for select to authenticated
using ((select private.is_company_member(company_id)));
create policy inventory_counts_write on public.inventory_counts for all to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])))
with check ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])));
create policy inventory_items_select on public.inventory_count_items for select to authenticated
using ((select private.is_company_member(company_id)));
create policy inventory_items_write on public.inventory_count_items for all to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])))
with check ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])));

revoke all on public.inventory_counts, public.inventory_count_items from public, anon, authenticated;
grant select, insert, update on public.inventory_counts, public.inventory_count_items to authenticated;

create or replace function public.create_inventory_count(p_name text)
returns public.inventory_counts language plpgsql security invoker set search_path = '' as $$
declare v_actor uuid := (select auth.uid()); v_company uuid; v_count public.inventory_counts;
begin
  select company_id into v_company from public.profiles where id=v_actor and is_active and role=any(array['proprietario','administrador','gerente','estoquista']);
  if v_company is null then raise exception 'Acesso negado'; end if;
  insert into public.inventory_counts(company_id,name,created_by) values(v_company,trim(p_name),v_actor) returning * into v_count;
  insert into public.inventory_count_items(company_id,inventory_count_id,product_id,product_name,expected_quantity)
    select v_company,v_count.id,p.id,p.name,p.current_stock from public.products p where p.company_id=v_company and p.is_active order by p.name;
  return v_count;
end $$;

create or replace function public.finalize_inventory_count(p_count_id uuid,p_items jsonb)
returns public.inventory_counts language plpgsql security invoker set search_path = '' as $$
declare v_actor uuid := (select auth.uid()); v_company uuid; v_count public.inventory_counts; v_entry jsonb; v_item public.inventory_count_items; v_product public.products; v_diff numeric;
begin
  select company_id into v_company from public.profiles where id=v_actor and is_active and role=any(array['proprietario','administrador','gerente','estoquista']);
  if v_company is null then raise exception 'Acesso negado'; end if;
  select * into v_count from public.inventory_counts where id=p_count_id and company_id=v_company for update;
  if not found or v_count.status<>'aberto' then raise exception 'Inventário indisponível'; end if;
  for v_entry in select * from jsonb_array_elements(p_items) loop
    update public.inventory_count_items set counted_quantity=(v_entry->>'counted_quantity')::numeric
      where id=(v_entry->>'item_id')::uuid and inventory_count_id=v_count.id and company_id=v_company;
    if not found then raise exception 'Item de inventário inválido'; end if;
  end loop;
  if exists(select 1 from public.inventory_count_items where inventory_count_id=v_count.id and counted_quantity is null) then raise exception 'Informe a contagem de todos os produtos'; end if;
  for v_item in select * from public.inventory_count_items where inventory_count_id=v_count.id order by id loop
    select * into v_product from public.products where id=v_item.product_id and company_id=v_company for update;
    v_diff:=v_item.counted_quantity-v_product.current_stock;
    if v_diff<>0 then
      update public.products set current_stock=v_item.counted_quantity where id=v_product.id;
      insert into public.stock_movements(company_id,product_id,movement_type,quantity,unit_cost,reason,previous_stock,new_stock,created_by)
      values(v_company,v_product.id,'inventario',abs(v_diff),v_product.cost_price,format('Inventário: %s (%s)',v_count.name,case when v_diff>0 then 'sobra' else 'falta' end),v_product.current_stock,v_item.counted_quantity,v_actor);
    end if;
  end loop;
  update public.inventory_counts set status='concluido',completed_by=v_actor,completed_at=now() where id=v_count.id returning * into v_count;
  return v_count;
end $$;

create or replace function public.record_stock_loss(p_product_id uuid,p_quantity numeric,p_reason text,p_kind text default 'perda',p_batch_number text default null,p_expiration_date date default null)
returns public.products language plpgsql security invoker set search_path = '' as $$
declare v_actor uuid := (select auth.uid()); v_company uuid; v_product public.products; v_new numeric;
begin
  select company_id into v_company from public.profiles where id=v_actor and is_active and role=any(array['proprietario','administrador','gerente','estoquista']);
  if v_company is null then raise exception 'Acesso negado'; end if;
  if p_quantity<=0 or p_kind not in ('perda','avaria','vencimento') or char_length(trim(p_reason))<3 then raise exception 'Dados da perda inválidos'; end if;
  select * into v_product from public.products where id=p_product_id and company_id=v_company for update;
  if not found or v_product.current_stock<p_quantity then raise exception 'Estoque insuficiente'; end if;
  v_new:=v_product.current_stock-p_quantity;
  update public.products set current_stock=v_new where id=v_product.id returning * into v_product;
  insert into public.stock_movements(company_id,product_id,movement_type,quantity,unit_cost,batch_number,expiration_date,reason,previous_stock,new_stock,created_by)
  values(v_company,v_product.id,p_kind,p_quantity,v_product.cost_price,nullif(trim(p_batch_number),''),p_expiration_date,trim(p_reason),v_product.current_stock+p_quantity,v_new,v_actor);
  return v_product;
end $$;

create function private.refresh_product_expiration() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.movement_type='compra' and new.expiration_date is not null then
    update public.products set next_expiration_date=case when next_expiration_date is null then new.expiration_date else least(next_expiration_date,new.expiration_date) end,
      next_batch_number=case when next_expiration_date is null or new.expiration_date<=next_expiration_date then new.batch_number else next_batch_number end where id=new.product_id and company_id=new.company_id;
  end if;
  return new;
end $$;
create trigger refresh_product_expiration after insert on public.stock_movements for each row execute function private.refresh_product_expiration();

revoke all on function public.create_inventory_count(text),public.finalize_inventory_count(uuid,jsonb),public.record_stock_loss(uuid,numeric,text,text,text,date) from public,anon;
grant execute on function public.create_inventory_count(text),public.finalize_inventory_count(uuid,jsonb),public.record_stock_loss(uuid,numeric,text,text,text,date) to authenticated;
revoke all on function private.refresh_product_expiration() from public,anon,authenticated;

create trigger audit_inventory_counts after insert or update or delete on public.inventory_counts for each row execute function private.capture_audit_log();
create trigger audit_inventory_count_items after insert or update or delete on public.inventory_count_items for each row execute function private.capture_audit_log();

commit;
