-- PetShop: indicadores reais e segmentados por funcao para o painel principal.
begin;

create or replace function public.get_dashboard_summary()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_company uuid;
  v_role text;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_month date := date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_month_start timestamptz;
  v_financial boolean;
  v_operational boolean;
  v_inventory boolean;
  v_appointments_today bigint;
  v_appointments_pending bigint;
  v_in_service bigint;
  v_ready bigint;
  v_low_stock bigint;
  v_out_stock bigint;
  v_purchase_orders bigint;
  v_deliveries bigint;
  v_revenue_today numeric;
  v_revenue_month numeric;
  v_expenses_due numeric;
  v_receivables_due numeric;
  v_sales_today bigint;
  v_open_cash boolean;
  v_pending_refunds bigint;
  v_daily_flow jsonb := '[]'::jsonb;
begin
  select company_id, role into v_company, v_role
  from public.profiles
  where id = (select auth.uid()) and is_active;

  if v_company is null then raise exception 'Perfil ativo nao encontrado'; end if;

  v_financial := v_role = any(array['proprietario','administrador','gerente','caixa']);
  v_operational := v_role = any(array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador']);
  v_inventory := v_role = any(array['proprietario','administrador','gerente','estoquista']);
  v_day_start := v_today::timestamp at time zone 'America/Sao_Paulo';
  v_day_end := (v_today + 1)::timestamp at time zone 'America/Sao_Paulo';
  v_month_start := v_month::timestamp at time zone 'America/Sao_Paulo';

  if v_operational then
    select count(*), count(*) filter(where status in('agendado','confirmado')), count(*) filter(where status in('em_banho','em_secagem','em_tosa','finalizando')), count(*) filter(where status='pronto')
    into v_appointments_today, v_appointments_pending, v_in_service, v_ready
    from public.appointments
    where company_id=v_company and scheduled_at>=v_day_start and scheduled_at<v_day_end and status not in('cancelado','nao_compareceu','entregue');
  end if;

  if v_inventory then
    select count(*) filter(where current_stock<=min_stock), count(*) filter(where current_stock<=0)
    into v_low_stock, v_out_stock from public.products where company_id=v_company and is_active;
    select count(*) into v_purchase_orders from public.purchase_orders where company_id=v_company and status not in('recebido','cancelado');
  end if;

  if v_role = any(array['proprietario','administrador','gerente','atendente']) then
    select count(*) into v_deliveries from public.delivery_requests where company_id=v_company and status in('pendente','em_transito');
  end if;

  if v_financial then
    select coalesce(sum(amount),0), count(*) into v_revenue_today, v_sales_today from (
      select total_amount amount from public.sales where company_id=v_company and status='concluida' and created_at>=v_day_start and created_at<v_day_end
      union all
      select amount from public.service_order_payments where company_id=v_company and paid_at>=v_day_start and paid_at<v_day_end
    ) x;
    select coalesce(sum(amount),0) into v_revenue_month from (
      select total_amount amount from public.sales where company_id=v_company and status='concluida' and created_at>=v_month_start
      union all
      select amount from public.service_order_payments where company_id=v_company and paid_at>=v_month_start
    ) x;
    select coalesce(sum(amount) filter(where type='despesa'),0), coalesce(sum(amount) filter(where type='receita'),0)
    into v_expenses_due, v_receivables_due from public.financial_transactions
    where company_id=v_company and status in('pendente','atrasado');
    select exists(select 1 from public.cash_registers where company_id=v_company and status='aberto') into v_open_cash;
    select (select count(*) from public.pix_refund_requests where company_id=v_company and status='pendente') +
      (select count(*) from public.sale_returns where company_id=v_company and status='pendente') into v_pending_refunds;
    with days as (
      select generate_series(v_today-6,v_today,'1 day')::date as metric_date
    ), revenues as (
      select (created_at at time zone 'America/Sao_Paulo')::date as metric_date, sum(total_amount) amount from public.sales
      where company_id=v_company and status='concluida' and created_at>=((v_today-6)::timestamp at time zone 'America/Sao_Paulo') group by 1
      union all
      select (paid_at at time zone 'America/Sao_Paulo')::date as metric_date, sum(amount) from public.service_order_payments
      where company_id=v_company and paid_at>=((v_today-6)::timestamp at time zone 'America/Sao_Paulo') group by 1
    ), expenses as (
      select coalesce(payment_date,created_at::date) as metric_date, sum(amount) amount from public.financial_transactions
      where company_id=v_company and type='despesa' and status='pago' and coalesce(payment_date,created_at::date)>=v_today-6 group by 1
    )
    select jsonb_agg(jsonb_build_object('date',d.metric_date,'revenue',coalesce(r.amount,0),'expense',coalesce(e.amount,0)) order by d.metric_date)
    into v_daily_flow from days d left join (select metric_date,sum(amount) amount from revenues group by metric_date) r using(metric_date) left join expenses e using(metric_date);
  end if;

  return jsonb_build_object(
    'generated_at',now(),'role',v_role,'appointments_today',v_appointments_today,'appointments_pending',v_appointments_pending,
    'in_service',v_in_service,'ready_for_pickup',v_ready,'low_stock',v_low_stock,'out_of_stock',v_out_stock,
    'pending_purchase_orders',v_purchase_orders,'pending_deliveries',v_deliveries,'revenue_today',v_revenue_today,
    'revenue_month',v_revenue_month,'expenses_due',v_expenses_due,'receivables_due',v_receivables_due,'sales_today',v_sales_today,
    'open_cash',v_open_cash,'pending_refunds',v_pending_refunds,'daily_flow',v_daily_flow);
end;
$$;

revoke all on function public.get_dashboard_summary() from public, anon;
grant execute on function public.get_dashboard_summary() to authenticated;

commit;
