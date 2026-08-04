-- PetShop: conciliação de pagamentos mistos no caixa e nos relatórios.
begin;

alter table public.cash_registers add column total_sales_credit numeric(12,2) not null default 0;

create or replace function public.close_cash_register(p_actual_cash numeric)
returns public.cash_registers language plpgsql security invoker set search_path='' as $$
declare v_company uuid;v_cash public.cash_registers;v_money numeric;v_pix numeric;v_card numeric;v_credit numeric;v_expected numeric;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente','caixa']);
  select * into v_cash from public.cash_registers where company_id=v_company and status='aberto' for update;
  if not found or p_actual_cash<0 then raise exception 'Fechamento inválido';end if;
  with payments as(
    select amount,payment_method,paid_at occurred_at from public.service_order_payments where company_id=v_company
    union all select amount,payment_method,created_at from public.sale_payments where company_id=v_company
    union all select total_amount,payment_method,created_at from public.sales s where company_id=v_company and status='concluida'
      and not exists(select 1 from public.sale_payments sp where sp.sale_id=s.id and sp.company_id=s.company_id)
  )select coalesce(sum(amount)filter(where payment_method='dinheiro'),0),coalesce(sum(amount)filter(where payment_method='pix'),0),
    coalesce(sum(amount)filter(where payment_method in('cartao_debito','cartao_credito')),0),coalesce(sum(amount)filter(where payment_method='saldo_credito'),0)
    into v_money,v_pix,v_card,v_credit from payments where occurred_at>=v_cash.opened_at and occurred_at<now();
  v_expected:=v_cash.initial_cash+v_money+v_cash.total_supplements-v_cash.total_withdrawals;
  update public.cash_registers set closed_at=now(),expected_cash=v_expected,actual_cash=p_actual_cash,
    difference=p_actual_cash-v_expected,status='fechado',total_sales_cash=v_money,total_sales_pix=v_pix,
    total_sales_card=v_card,total_sales_credit=v_credit where id=v_cash.id returning * into v_cash;
  return v_cash;
end$$;

create or replace function public.get_payment_breakdown(p_start_date date,p_end_date date)
returns jsonb language plpgsql security invoker set search_path='' stable as $$
declare v_company uuid;v_cash numeric;v_pix numeric;v_card numeric;v_credit numeric;
begin
  select company_id into v_company from public.profiles where id=(select auth.uid()) and is_active
    and role=any(array['proprietario','administrador','gerente']);
  if v_company is null then raise exception 'Acesso restrito à gestão';end if;
  if p_start_date is null or p_end_date is null or p_end_date<p_start_date or p_end_date-p_start_date>366 then raise exception 'Período inválido';end if;
  with payments as(
    select amount,payment_method,paid_at occurred_at from public.service_order_payments where company_id=v_company
    union all select amount,payment_method,created_at from public.sale_payments where company_id=v_company
    union all select total_amount,payment_method,created_at from public.sales s where company_id=v_company and status='concluida'
      and not exists(select 1 from public.sale_payments sp where sp.sale_id=s.id and sp.company_id=s.company_id)
  )select coalesce(sum(amount)filter(where payment_method='dinheiro'),0),coalesce(sum(amount)filter(where payment_method='pix'),0),
    coalesce(sum(amount)filter(where payment_method in('cartao_debito','cartao_credito')),0),coalesce(sum(amount)filter(where payment_method='saldo_credito'),0)
    into v_cash,v_pix,v_card,v_credit from payments where occurred_at>=p_start_date::timestamptz and occurred_at<(p_end_date+1)::timestamptz;
  return jsonb_build_object('cash_received',v_cash,'pix_received',v_pix,'card_received',v_card,
    'credit_used',v_credit,'real_inflow',v_cash+v_pix+v_card);
end$$;

revoke all on function public.close_cash_register(numeric) from public,anon;
grant execute on function public.close_cash_register(numeric) to authenticated;
revoke all on function public.get_payment_breakdown(date,date) from public,anon;
grant execute on function public.get_payment_breakdown(date,date) to authenticated;
commit;
