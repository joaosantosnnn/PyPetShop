-- PetShop: devolucao integral de vendas do PDV.
begin;

alter table public.customer_credit_movements drop constraint if exists customer_credit_movements_type_check;
alter table public.customer_credit_movements add constraint customer_credit_movements_type_check
  check(type in('credito_cancelamento','credito_devolucao','uso'));
drop index if exists public.credits_source_sale_uidx;
create unique index credits_source_sale_type_uidx on public.customer_credit_movements(source_sale_id,type)
  where source_sale_id is not null;

create table public.sale_returns(
  id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),
  sale_id uuid not null unique references public.sales(id),customer_id uuid references public.customers(id),auth_user_id uuid,
  total_amount numeric(12,2) not null check(total_amount>0),credit_amount numeric(12,2) not null default 0 check(credit_amount>=0),
  refund_amount numeric(12,2) not null default 0 check(refund_amount>=0),refund_method text,
  reason text not null,status text not null check(status in('credito_emitido','pendente','concluido','recusado')),
  requested_by uuid not null references public.profiles(id),reviewed_by uuid references public.profiles(id),reviewed_at timestamptz,
  refund_reference text,response_note text,financial_transaction_id uuid references public.financial_transactions(id),created_at timestamptz not null default now()
);
create index sale_returns_company_status_idx on public.sale_returns(company_id,status,created_at desc);
create index sale_returns_customer_idx on public.sale_returns(customer_id) where customer_id is not null;
create index sale_returns_user_idx on public.sale_returns(auth_user_id) where auth_user_id is not null;
create index sale_returns_requester_idx on public.sale_returns(requested_by);
create index sale_returns_reviewer_idx on public.sale_returns(reviewed_by) where reviewed_by is not null;
create index sale_returns_financial_idx on public.sale_returns(financial_transaction_id) where financial_transaction_id is not null;
alter table public.sale_returns enable row level security;
create policy sale_returns_select on public.sale_returns for select to authenticated using(
  auth_user_id=(select auth.uid()) or (select private.is_company_member(company_id)));
revoke all on public.sale_returns from public,anon,authenticated;grant select on public.sale_returns to authenticated;

create function public.return_product_sale(p_sale_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_company uuid;v_sale public.sales;v_company_row public.companies;v_item public.sale_items;v_product public.products;
  v_credit_used numeric:=0;v_external numeric:=0;v_credit_issue numeric:=0;v_refund numeric:=0;v_method text;
  v_status text;v_return uuid;v_auth_user uuid;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','caixa']);
  if v_company is null then raise exception 'Acesso nao autorizado';end if;
  if length(trim(coalesce(p_reason,'')))<5 then raise exception 'Informe um motivo com pelo menos 5 caracteres';end if;
  select * into v_sale from public.sales where id=p_sale_id and company_id=v_company for update;
  if not found or v_sale.status<>'concluida' then raise exception 'Venda indisponivel para devolucao';end if;
  if exists(select 1 from public.sale_returns where sale_id=v_sale.id) then raise exception 'Esta venda ja possui devolucao';end if;
  select * into v_company_row from public.companies where id=v_company;
  if v_sale.customer_id is not null then
    perform 1 from public.customers where id=v_sale.customer_id and company_id=v_company for update;
    select auth_user_id into v_auth_user from public.customer_credit_movements where company_id=v_company and customer_id=v_sale.customer_id and auth_user_id is not null order by created_at limit 1;
  end if;
  if exists(select 1 from public.sale_payments where sale_id=v_sale.id and company_id=v_company) then
    select coalesce(sum(amount)filter(where payment_method='saldo_credito'),0),
      coalesce(sum(amount)filter(where payment_method<>'saldo_credito'),0),
      string_agg(distinct payment_method,', ')filter(where payment_method<>'saldo_credito')
      into v_credit_used,v_external,v_method from public.sale_payments where sale_id=v_sale.id and company_id=v_company;
  elsif v_sale.payment_method='saldo_credito' then v_credit_used:=v_sale.total_amount;
  else v_external:=v_sale.total_amount;v_method:=v_sale.payment_method;end if;

  for v_item in select * from public.sale_items where sale_id=v_sale.id and company_id=v_company loop
    select * into v_product from public.products where id=v_item.product_id and company_id=v_company for update;
    insert into public.stock_movements(company_id,product_id,movement_type,quantity,unit_cost,reason,previous_stock,new_stock,created_by)
    values(v_company,v_product.id,'devolucao',v_item.quantity,v_product.cost_price,'Devolucao da venda PDV #'||v_sale.sale_number||': '||trim(p_reason),
      v_product.current_stock,v_product.current_stock+v_item.quantity,(select auth.uid()));
    update public.products set current_stock=current_stock+v_item.quantity where id=v_product.id;
  end loop;
  update public.sales set status='devolvida',notes=concat_ws(E'\n',notes,'Devolvida: '||trim(p_reason)) where id=v_sale.id;
  if v_sale.customer_id is not null then update public.customers set total_spent=greatest(0,total_spent-v_sale.total_amount) where id=v_sale.customer_id and company_id=v_company;end if;

  if v_company_row.paid_cancellation_policy='credito' and v_sale.customer_id is not null then
    v_credit_issue:=v_sale.total_amount;v_status:='credito_emitido';
  else
    v_credit_issue:=case when v_sale.customer_id is not null then v_credit_used else 0 end;
    v_refund:=v_external;v_status:=case when v_refund>0 then 'pendente' else 'credito_emitido' end;
  end if;
  insert into public.sale_returns(company_id,sale_id,customer_id,auth_user_id,total_amount,credit_amount,refund_amount,refund_method,reason,status,requested_by)
  values(v_company,v_sale.id,v_sale.customer_id,v_auth_user,v_sale.total_amount,v_credit_issue,v_refund,v_method,trim(p_reason),v_status,(select auth.uid())) returning id into v_return;
  if v_credit_issue>0 then
    insert into public.customer_credit_movements(company_id,customer_id,auth_user_id,amount,type,description,source_sale_id,created_by)
    values(v_company,v_sale.customer_id,v_auth_user,v_credit_issue,'credito_devolucao','Credito pela devolucao da venda PDV #'||v_sale.sale_number,v_sale.id,(select auth.uid()));
  end if;
  return jsonb_build_object('return_id',v_return,'sale_number',v_sale.sale_number,'credit_amount',v_credit_issue,'refund_amount',v_refund,'status',v_status);
end$$;

create function public.review_sale_return(p_return uuid,p_complete boolean,p_reference text,p_note text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_company uuid;v_return public.sale_returns;v_financial uuid;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','caixa']);
  if v_company is null then raise exception 'Acesso negado';end if;
  select * into v_return from public.sale_returns where id=p_return and company_id=v_company for update;
  if not found or v_return.status<>'pendente' then raise exception 'Estorno indisponivel';end if;
  if p_complete then
    if length(trim(coalesce(p_reference,'')))<3 then raise exception 'Informe a referencia do estorno';end if;
    insert into public.financial_transactions(company_id,type,category,description,amount,due_date,payment_date,status,payment_method,customer_id,sale_id,created_by)
    values(v_company,'despesa','Estorno de venda','Estorno manual da venda devolvida',v_return.refund_amount,current_date,current_date,'pago',v_return.refund_method,v_return.customer_id,v_return.sale_id,(select auth.uid())) returning id into v_financial;
    update public.sale_returns set status='concluido',reviewed_by=(select auth.uid()),reviewed_at=now(),refund_reference=trim(p_reference),response_note=p_note,financial_transaction_id=v_financial where id=v_return.id;
  else update public.sale_returns set status='recusado',reviewed_by=(select auth.uid()),reviewed_at=now(),response_note=p_note where id=v_return.id;end if;
end$$;

revoke all on function public.return_product_sale(uuid,text),public.review_sale_return(uuid,boolean,text,text) from public,anon;
grant execute on function public.return_product_sale(uuid,text),public.review_sale_return(uuid,boolean,text,text) to authenticated;
create trigger audit_sale_returns after insert or update or delete on public.sale_returns for each row execute function private.capture_audit_log();
commit;
