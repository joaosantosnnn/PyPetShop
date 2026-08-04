-- PetShop: pagamentos mistos no PDV com saldo de crédito.
begin;

alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check(payment_method in('dinheiro','pix','cartao_debito','cartao_credito','fiado','saldo_credito','misto'));

create table public.sale_payments(
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  sale_id uuid not null references public.sales(id) on delete restrict,
  amount numeric(12,2) not null check(amount>0),
  payment_method text not null check(payment_method in('dinheiro','pix','cartao_debito','cartao_credito','saldo_credito')),
  received_by uuid not null,
  created_at timestamptz not null default now(),
  constraint sale_payments_sale_company_fkey foreign key(sale_id,company_id) references public.sales(id,company_id),
  constraint sale_payments_receiver_company_fkey foreign key(received_by,company_id) references public.profiles(id,company_id)
);
create index sale_payments_sale_company_idx on public.sale_payments(sale_id,company_id);
create index sale_payments_company_date_idx on public.sale_payments(company_id,created_at desc);
create index sale_payments_receiver_company_idx on public.sale_payments(received_by,company_id);
alter table public.sale_payments enable row level security;
create policy sale_payments_select on public.sale_payments for select to authenticated
  using((select private.is_company_member(company_id)));
revoke all on public.sale_payments from public,anon,authenticated;
grant select on public.sale_payments to authenticated;
create trigger audit_sale_payments after insert or update or delete on public.sale_payments
for each row execute function private.capture_audit_log();

create or replace function public.complete_mixed_product_sale(
  p_customer_id uuid,p_items jsonb,p_discount numeric,p_payment_method text,
  p_amount_paid numeric,p_credit_amount numeric,p_notes text default null
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_company uuid;v_sale public.sales;v_customer public.customers;v_item jsonb;v_product public.products;
  v_quantity numeric;v_subtotal numeric:=0;v_total numeric;v_credit numeric;v_complement numeric;
  v_credit_balance numeric;v_change numeric:=0;v_sale_method text;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','caixa']);
  if v_company is null then raise exception 'Acesso não autorizado';end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'A venda precisa ter produtos';end if;
  if p_payment_method not in('dinheiro','pix','cartao_debito','cartao_credito') then raise exception 'Forma complementar inválida';end if;
  select * into v_customer from public.customers where id=p_customer_id and company_id=v_company for update;
  if not found then raise exception 'Selecione um cliente válido para usar crédito';end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity:=(v_item->>'quantity')::numeric;
    if v_quantity<=0 then raise exception 'Quantidade inválida';end if;
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and company_id=v_company and is_active for update;
    if not found then raise exception 'Produto não encontrado';end if;
    if v_product.current_stock<v_quantity then raise exception 'Estoque insuficiente para %',v_product.name;end if;
    v_subtotal:=v_subtotal+v_product.sale_price*v_quantity;
  end loop;
  if coalesce(p_discount,0)<0 or coalesce(p_discount,0)>v_subtotal then raise exception 'Desconto inválido';end if;
  v_total:=v_subtotal-coalesce(p_discount,0);
  v_credit:=round(coalesce(p_credit_amount,0),2);
  if v_credit<=0 or v_credit>v_total then raise exception 'Valor de crédito inválido';end if;
  select coalesce(sum(amount),0) into v_credit_balance from public.customer_credit_movements
    where company_id=v_company and customer_id=p_customer_id;
  if v_credit_balance<v_credit then raise exception 'Saldo de crédito insuficiente';end if;
  v_complement:=v_total-v_credit;
  if p_payment_method='dinheiro' and coalesce(p_amount_paid,0)<v_complement then raise exception 'Valor recebido é menor que o restante';end if;
  if p_payment_method<>'dinheiro' and v_complement>0 and round(coalesce(p_amount_paid,0),2)<>v_complement then raise exception 'Valor complementar inválido';end if;
  if p_payment_method='dinheiro' then v_change:=greatest(coalesce(p_amount_paid,0)-v_complement,0);end if;
  v_sale_method:=case when v_complement=0 then 'saldo_credito' else 'misto' end;

  insert into public.sales(company_id,customer_id,seller_id,subtotal,discount,total_amount,payment_method,amount_paid,change_amount,notes)
  values(v_company,p_customer_id,(select auth.uid()),v_subtotal,coalesce(p_discount,0),v_total,v_sale_method,v_total,v_change,p_notes)
  returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity:=(v_item->>'quantity')::numeric;
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and company_id=v_company for update;
    insert into public.sale_items(company_id,sale_id,product_id,product_name,quantity,unit_price,total_price)
    values(v_company,v_sale.id,v_product.id,v_product.name,v_quantity,v_product.sale_price,v_quantity*v_product.sale_price);
    insert into public.stock_movements(company_id,product_id,movement_type,quantity,unit_cost,reason,previous_stock,new_stock,created_by)
    values(v_company,v_product.id,'venda',v_quantity,v_product.cost_price,'Venda PDV #'||v_sale.sale_number,
      v_product.current_stock,v_product.current_stock-v_quantity,(select auth.uid()));
    update public.products set current_stock=current_stock-v_quantity where id=v_product.id;
  end loop;

  insert into public.sale_payments(company_id,sale_id,amount,payment_method,received_by)
  values(v_company,v_sale.id,v_credit,'saldo_credito',(select auth.uid()));
  if v_complement>0 then
    insert into public.sale_payments(company_id,sale_id,amount,payment_method,received_by)
    values(v_company,v_sale.id,v_complement,p_payment_method,(select auth.uid()));
  end if;
  insert into public.customer_credit_movements(company_id,customer_id,auth_user_id,amount,type,description,source_sale_id,created_by)
  values(v_company,p_customer_id,(select auth_user_id from public.customer_credit_movements where company_id=v_company and customer_id=p_customer_id and auth_user_id is not null order by created_at limit 1),
    -v_credit,'uso','Uso de crédito na venda PDV #'||v_sale.sale_number,v_sale.id,(select auth.uid()));
  update public.customers set total_spent=total_spent+v_total where id=p_customer_id and company_id=v_company;
  return jsonb_build_object('id',v_sale.id,'sale_number',v_sale.sale_number,'subtotal',v_subtotal,'total_amount',v_total,
    'credit_amount',v_credit,'complement_amount',v_complement,'complement_method',case when v_complement>0 then p_payment_method else null end,
    'change_amount',v_change,'created_at',v_sale.created_at);
end$$;

revoke all on function public.complete_mixed_product_sale(uuid,jsonb,numeric,text,numeric,numeric,text) from public,anon;
grant execute on function public.complete_mixed_product_sale(uuid,jsonb,numeric,text,numeric,numeric,text) to authenticated;
commit;
