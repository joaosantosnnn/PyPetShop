-- PetGestor: operações atômicas das comandas.
begin;

create or replace function public.open_service_order(p_appointment_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_company uuid; v_app public.appointments; v_service public.services; v_order_id uuid;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']);
  if v_company is null then raise exception 'Acesso não autorizado'; end if;
  select * into v_app from public.appointments where id=p_appointment_id and company_id=v_company for update;
  if not found then raise exception 'Agendamento não encontrado'; end if;
  select id into v_order_id from public.service_orders where appointment_id=p_appointment_id;
  if v_order_id is not null then return v_order_id; end if;
  select * into v_service from public.services where id=v_app.service_id and company_id=v_company;
  insert into public.service_orders(company_id,appointment_id,customer_id,pet_id,status,subtotal,total,tutor_signature_accepted,notes)
  values(v_company,v_app.id,v_app.customer_id,v_app.pet_id,'aberta',v_app.expected_price,v_app.expected_price,true,v_app.notes)
  returning id into v_order_id;
  insert into public.service_order_items(company_id,service_order_id,item_type,service_id,name,quantity,unit_price,total_price,assigned_employee_id,commission_amount)
  values(v_company,v_order_id,'service',v_service.id,v_service.name,1,v_app.expected_price,v_app.expected_price,v_app.employee_id,
    round(v_app.expected_price * v_service.commission_percentage / 100,2));
  update public.appointments set status='recebido' where id=v_app.id;
  return v_order_id;
end; $$;

create or replace function public.add_service_order_item(p_order_id uuid,p_item_type text,p_item_id uuid,p_quantity numeric)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_company uuid; v_order public.service_orders; v_product public.products; v_service public.services; v_item_id uuid; v_total numeric;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']);
  if v_company is null or p_quantity<=0 then raise exception 'Dados inválidos'; end if;
  select * into v_order from public.service_orders where id=p_order_id and company_id=v_company for update;
  if not found or v_order.status in ('paga','cancelada') then raise exception 'Comanda indisponível'; end if;
  if p_item_type='service' then
    select * into v_service from public.services where id=p_item_id and company_id=v_company and is_active;
    if not found then raise exception 'Serviço não encontrado'; end if;
    v_total:=v_service.base_price*p_quantity;
    insert into public.service_order_items(company_id,service_order_id,item_type,service_id,name,quantity,unit_price,total_price,commission_amount)
    values(v_company,p_order_id,'service',v_service.id,v_service.name,p_quantity,v_service.base_price,v_total,round(v_total*v_service.commission_percentage/100,2)) returning id into v_item_id;
  else
    select * into v_product from public.products where id=p_item_id and company_id=v_company and is_active;
    if not found then raise exception 'Produto não encontrado'; end if;
    if v_product.current_stock<p_quantity then raise exception 'Estoque insuficiente'; end if;
    v_total:=case when p_item_type='internal_consumption' then 0 else v_product.sale_price*p_quantity end;
    insert into public.service_order_items(company_id,service_order_id,item_type,product_id,name,quantity,unit_price,total_price)
    values(v_company,p_order_id,p_item_type,v_product.id,v_product.name,p_quantity,case when p_item_type='internal_consumption' then 0 else v_product.sale_price end,v_total) returning id into v_item_id;
  end if;
  update public.service_orders set subtotal=subtotal+v_total,total=subtotal+v_total-discount where id=p_order_id;
  return v_item_id;
end; $$;

create or replace function public.pay_service_order(p_order_id uuid,p_amount numeric,p_payment_method text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_company uuid; v_order public.service_orders; v_new_paid numeric; v_item public.service_order_items; v_product public.products;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','caixa']);
  if v_company is null then raise exception 'Acesso não autorizado'; end if;
  if p_amount<=0 or p_payment_method not in ('dinheiro','pix','cartao_debito','cartao_credito','fiado') then raise exception 'Pagamento inválido'; end if;
  select * into v_order from public.service_orders where id=p_order_id and company_id=v_company for update;
  if not found or v_order.status in ('paga','cancelada') then raise exception 'Comanda indisponível'; end if;
  if p_amount > v_order.total-v_order.paid_amount then raise exception 'Valor maior que o saldo da comanda'; end if;
  v_new_paid:=v_order.paid_amount+p_amount;
  insert into public.service_order_payments(company_id,service_order_id,amount,payment_method,received_by)
  values(v_company,v_order.id,p_amount,p_payment_method,(select auth.uid()));
  insert into public.financial_transactions(company_id,type,category,description,amount,due_date,payment_date,status,payment_method,customer_id,service_order_id,created_by)
  values(v_company,'receita','Serviços','Comanda #'||v_order.order_number,p_amount,current_date,current_date,'pago',p_payment_method,v_order.customer_id,v_order.id,(select auth.uid()));
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
  else
    update public.service_orders set paid_amount=v_new_paid,status='parcialmente_paga' where id=v_order.id;
  end if;
  return jsonb_build_object('order_number',v_order.order_number,'paid_amount',v_new_paid,'remaining',v_order.total-v_new_paid,'status',case when v_new_paid=v_order.total then 'paga' else 'parcialmente_paga' end);
end; $$;

revoke all on function public.open_service_order(uuid) from public,anon;
revoke all on function public.add_service_order_item(uuid,text,uuid,numeric) from public,anon;
revoke all on function public.pay_service_order(uuid,numeric,text) from public,anon;
grant execute on function public.open_service_order(uuid) to authenticated;
grant execute on function public.add_service_order_item(uuid,text,uuid,numeric) to authenticated;
grant execute on function public.pay_service_order(uuid,numeric,text) to authenticated;

commit;
