-- PetShop: uso transacional de créditos no PDV e nas comandas.
begin;

alter table public.customer_credit_movements
  add column source_sale_id uuid references public.sales(id),
  add column source_order_payment_id uuid references public.service_order_payments(id);

create unique index credits_source_sale_uidx
  on public.customer_credit_movements(source_sale_id)
  where source_sale_id is not null;
create unique index credits_source_order_payment_uidx
  on public.customer_credit_movements(source_order_payment_id)
  where source_order_payment_id is not null;

alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check (payment_method in ('dinheiro','pix','cartao_debito','cartao_credito','fiado','saldo_credito'));

alter table public.service_order_payments drop constraint if exists service_order_payments_payment_method_check;
alter table public.service_order_payments add constraint service_order_payments_payment_method_check
  check (payment_method in ('dinheiro','pix','cartao_debito','cartao_credito','fiado','saldo_credito'));

create or replace function public.customer_credit_balance(p_customer_id uuid)
returns numeric
language plpgsql
security invoker
set search_path = ''
stable
as $$
declare v_company uuid; v_balance numeric;
begin
  select company_id into v_company
  from public.profiles
  where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','caixa','atendente']);
  if v_company is null then raise exception 'Acesso não autorizado'; end if;
  if not exists(select 1 from public.customers where id=p_customer_id and company_id=v_company) then
    raise exception 'Cliente não encontrado';
  end if;
  select coalesce(sum(amount),0) into v_balance
  from public.customer_credit_movements
  where company_id=v_company and customer_id=p_customer_id;
  return v_balance;
end;
$$;

create or replace function public.complete_product_sale(
  p_customer_id uuid, p_items jsonb, p_discount numeric,
  p_payment_method text, p_amount_paid numeric, p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid; v_sale public.sales; v_customer public.customers; v_item jsonb;
  v_product public.products; v_quantity numeric; v_subtotal numeric:=0; v_total numeric;
  v_credit_balance numeric;
begin
  select p.company_id into v_company from public.profiles p
  where p.id=(select auth.uid()) and p.is_active
    and p.role=any(array['proprietario','administrador','gerente','caixa']);
  if v_company is null then raise exception 'Acesso não autorizado'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'A venda precisa ter produtos'; end if;
  if p_payment_method not in ('dinheiro','pix','cartao_debito','cartao_credito','fiado','saldo_credito') then raise exception 'Forma de pagamento inválida'; end if;
  if p_customer_id is not null then
    select * into v_customer from public.customers where id=p_customer_id and company_id=v_company for update;
    if not found then raise exception 'Cliente inválido'; end if;
  elsif p_payment_method='saldo_credito' then
    raise exception 'Selecione um cliente para usar o saldo de crédito';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity:=(v_item->>'quantity')::numeric;
    if v_quantity<=0 then raise exception 'Quantidade inválida'; end if;
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and company_id=v_company and is_active for update;
    if not found then raise exception 'Produto não encontrado'; end if;
    if v_product.current_stock<v_quantity then raise exception 'Estoque insuficiente para %',v_product.name; end if;
    v_subtotal:=v_subtotal+(v_product.sale_price*v_quantity);
  end loop;
  if coalesce(p_discount,0)<0 or coalesce(p_discount,0)>v_subtotal then raise exception 'Desconto inválido'; end if;
  v_total:=v_subtotal-coalesce(p_discount,0);
  if p_payment_method='dinheiro' and coalesce(p_amount_paid,0)<v_total then raise exception 'Valor recebido é menor que o total'; end if;
  if p_payment_method='saldo_credito' then
    select coalesce(sum(amount),0) into v_credit_balance from public.customer_credit_movements
    where company_id=v_company and customer_id=p_customer_id;
    if v_credit_balance<v_total then raise exception 'Saldo de crédito insuficiente'; end if;
  end if;

  insert into public.sales(company_id,customer_id,seller_id,subtotal,discount,total_amount,payment_method,amount_paid,change_amount,notes)
  values(v_company,p_customer_id,(select auth.uid()),v_subtotal,coalesce(p_discount,0),v_total,p_payment_method,
    case when p_payment_method='dinheiro' then coalesce(p_amount_paid,0) else v_total end,
    case when p_payment_method='dinheiro' then greatest(coalesce(p_amount_paid,0)-v_total,0) else 0 end,p_notes)
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

  if p_payment_method='saldo_credito' then
    insert into public.customer_credit_movements(company_id,customer_id,auth_user_id,amount,type,description,source_sale_id,created_by)
    values(v_company,p_customer_id,(select auth_user_id from public.customer_credit_movements where company_id=v_company and customer_id=p_customer_id and auth_user_id is not null order by created_at limit 1),-v_total,'uso','Uso de crédito na venda PDV #'||v_sale.sale_number,v_sale.id,(select auth.uid()));
  end if;
  if p_customer_id is not null then update public.customers set total_spent=total_spent+v_total where id=p_customer_id and company_id=v_company; end if;
  return jsonb_build_object('id',v_sale.id,'sale_number',v_sale.sale_number,'subtotal',v_subtotal,
    'total_amount',v_total,'change_amount',v_sale.change_amount,'created_at',v_sale.created_at);
end;
$$;

create or replace function public.pay_service_order(p_order_id uuid,p_amount numeric,p_payment_method text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_company uuid; v_order public.service_orders; v_customer public.customers; v_new_paid numeric;
  v_item public.service_order_items; v_product public.products; v_credit_balance numeric; v_payment_id uuid;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','caixa']);
  if v_company is null then raise exception 'Acesso não autorizado'; end if;
  if p_amount<=0 or p_payment_method not in ('dinheiro','pix','cartao_debito','cartao_credito','fiado','saldo_credito') then raise exception 'Pagamento inválido'; end if;
  select * into v_order from public.service_orders where id=p_order_id and company_id=v_company for update;
  if not found or v_order.status in ('paga','cancelada') then raise exception 'Comanda indisponível'; end if;
  if p_amount>v_order.total-v_order.paid_amount then raise exception 'Valor maior que o saldo da comanda'; end if;
  select * into v_customer from public.customers where id=v_order.customer_id and company_id=v_company for update;
  if p_payment_method='saldo_credito' then
    select coalesce(sum(amount),0) into v_credit_balance from public.customer_credit_movements
    where company_id=v_company and customer_id=v_order.customer_id;
    if v_credit_balance<p_amount then raise exception 'Saldo de crédito insuficiente'; end if;
  end if;
  v_new_paid:=v_order.paid_amount+p_amount;
  insert into public.service_order_payments(company_id,service_order_id,amount,payment_method,received_by)
  values(v_company,v_order.id,p_amount,p_payment_method,(select auth.uid())) returning id into v_payment_id;
  if p_payment_method='saldo_credito' then
    insert into public.customer_credit_movements(company_id,customer_id,auth_user_id,amount,type,description,source_order_payment_id,created_by)
    values(v_company,v_order.customer_id,(select auth_user_id from public.customer_credit_movements where company_id=v_company and customer_id=v_order.customer_id and auth_user_id is not null order by created_at limit 1),-p_amount,'uso','Uso de crédito na comanda #'||v_order.order_number,v_payment_id,(select auth.uid()));
  else
    insert into public.financial_transactions(company_id,type,category,description,amount,due_date,payment_date,status,payment_method,customer_id,service_order_id,created_by)
    values(v_company,'receita','Serviços','Comanda #'||v_order.order_number,p_amount,current_date,current_date,'pago',p_payment_method,v_order.customer_id,v_order.id,(select auth.uid()));
  end if;
  update public.customers set total_spent=total_spent+p_amount where id=v_order.customer_id and company_id=v_company;
  if v_new_paid=v_order.total then
    for v_item in select * from public.service_order_items where service_order_id=v_order.id loop
      if v_item.product_id is not null then
        select * into v_product from public.products where id=v_item.product_id and company_id=v_company for update;
        if v_product.current_stock<v_item.quantity then raise exception 'Estoque insuficiente para %',v_product.name; end if;
        insert into public.stock_movements(company_id,product_id,movement_type,quantity,unit_cost,reason,previous_stock,new_stock,created_by)
        values(v_company,v_product.id,case when v_item.item_type='internal_consumption' then 'consumo_servico' else 'venda' end,v_item.quantity,v_product.cost_price,
          'Comanda #'||v_order.order_number,v_product.current_stock,v_product.current_stock-v_item.quantity,(select auth.uid()));
        update public.products set current_stock=current_stock-v_item.quantity where id=v_product.id;
      end if;
      if v_item.assigned_employee_id is not null and v_item.commission_amount>0 then
        insert into public.commissions(company_id,service_order_item_id,employee_id,amount)
        values(v_company,v_item.id,v_item.assigned_employee_id,v_item.commission_amount);
      end if;
    end loop;
    update public.service_orders set paid_amount=v_new_paid,status='paga' where id=v_order.id;
    update public.appointments set status='entregue' where id=v_order.appointment_id;
  else update public.service_orders set paid_amount=v_new_paid,status='parcialmente_paga' where id=v_order.id;
  end if;
  return jsonb_build_object('order_number',v_order.order_number,'paid_amount',v_new_paid,'remaining',v_order.total-v_new_paid,
    'status',case when v_new_paid=v_order.total then 'paga' else 'parcialmente_paga' end);
end;
$$;

revoke all on function public.customer_credit_balance(uuid) from public,anon;
grant execute on function public.customer_credit_balance(uuid) to authenticated;
revoke all on function public.complete_product_sale(uuid,jsonb,numeric,text,numeric,text) from public,anon;
grant execute on function public.complete_product_sale(uuid,jsonb,numeric,text,numeric,text) to authenticated;
revoke all on function public.pay_service_order(uuid,numeric,text) from public,anon;
grant execute on function public.pay_service_order(uuid,numeric,text) to authenticated;

commit;
