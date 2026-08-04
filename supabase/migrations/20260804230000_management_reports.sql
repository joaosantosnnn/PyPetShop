create or replace function public.get_management_report(p_start_date date,p_end_date date)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_company uuid;v_start timestamptz;v_end timestamptz;v_product_revenue numeric:=0;v_service_revenue numeric:=0;v_cogs numeric:=0;v_loss numeric:=0;v_orders bigint:=0;v_inventory numeric:=0;v_result jsonb;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active and role=any(array['proprietario','administrador','gerente']);
  if v_company is null then raise exception 'Acesso restrito à gestão';end if;
  if p_start_date is null or p_end_date is null or p_end_date<p_start_date or p_end_date-p_start_date>366 then raise exception 'Período inválido';end if;
  v_start:=p_start_date::timestamptz;v_end:=(p_end_date+1)::timestamptz;
  select coalesce(sum(total_amount),0),count(*) into v_product_revenue,v_orders from public.sales where company_id=v_company and status='concluida' and created_at>=v_start and created_at<v_end;
  select coalesce(sum(paid_amount),0),v_orders+count(*) into v_service_revenue,v_orders from public.service_orders where company_id=v_company and status in('paga','parcialmente_paga') and created_at>=v_start and created_at<v_end;
  select coalesce(sum(si.quantity*p.cost_price),0) into v_cogs from public.sale_items si join public.sales s on s.id=si.sale_id and s.company_id=si.company_id join public.products p on p.id=si.product_id and p.company_id=si.company_id where si.company_id=v_company and s.status='concluida' and s.created_at>=v_start and s.created_at<v_end;
  select v_cogs+coalesce(sum(oi.quantity*p.cost_price),0) into v_cogs from public.service_order_items oi join public.service_orders so on so.id=oi.service_order_id and so.company_id=oi.company_id join public.products p on p.id=oi.product_id and p.company_id=oi.company_id where oi.company_id=v_company and oi.item_type<>'service' and so.status in('paga','parcialmente_paga') and so.created_at>=v_start and so.created_at<v_end;
  select coalesce(sum(quantity*unit_cost),0) into v_loss from public.stock_movements where company_id=v_company and movement_type in('perda','avaria','vencimento') and created_at>=v_start and created_at<v_end;
  select coalesce(sum(current_stock*cost_price),0) into v_inventory from public.products where company_id=v_company and is_active;
  select jsonb_build_object(
    'start_date',p_start_date,'end_date',p_end_date,'product_revenue',v_product_revenue,'service_revenue',v_service_revenue,'total_revenue',v_product_revenue+v_service_revenue,'cost_of_goods',v_cogs,'gross_profit',v_product_revenue+v_service_revenue-v_cogs-v_loss,'loss_value',v_loss,'orders_count',v_orders,'average_ticket',case when v_orders=0 then 0 else (v_product_revenue+v_service_revenue)/v_orders end,'inventory_value',v_inventory,'estimated_turnover',case when v_inventory=0 then 0 else v_cogs/v_inventory end,
    'top_products',coalesce((select jsonb_agg(x order by x.revenue desc) from(select si.product_name as name,sum(si.quantity) as quantity,sum(si.total_price) as revenue from public.sale_items si join public.sales s on s.id=si.sale_id and s.company_id=si.company_id where si.company_id=v_company and s.status='concluida' and s.created_at>=v_start and s.created_at<v_end group by si.product_name order by revenue desc limit 10)x),'[]'::jsonb),
    'top_services',coalesce((select jsonb_agg(x order by x.revenue desc) from(select oi.name,sum(oi.quantity) as quantity,sum(oi.total_price) as revenue from public.service_order_items oi join public.service_orders so on so.id=oi.service_order_id and so.company_id=oi.company_id where oi.company_id=v_company and oi.item_type='service' and so.status in('paga','parcialmente_paga') and so.created_at>=v_start and so.created_at<v_end group by oi.name order by revenue desc limit 10)x),'[]'::jsonb),
    'daily_revenue',coalesce((select jsonb_agg(x order by x.day) from(select report_date as day,sum(products) as products,sum(services) as services from(select created_at::date as report_date,sum(total_amount) products,0::numeric services from public.sales where company_id=v_company and status='concluida' and created_at>=v_start and created_at<v_end group by 1 union all select created_at::date as report_date,0::numeric,sum(paid_amount) from public.service_orders where company_id=v_company and status in('paga','parcialmente_paga') and created_at>=v_start and created_at<v_end group by 1)y group by report_date)x),'[]'::jsonb)
  ) into v_result;
  return v_result;
end$$;
revoke all on function public.get_management_report(date,date) from public,anon;
grant execute on function public.get_management_report(date,date) to authenticated;
