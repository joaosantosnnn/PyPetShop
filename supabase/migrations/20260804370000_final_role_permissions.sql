-- PetShop: matriz final de permissoes por cargo.
begin;

drop policy customers_select on public.customers;create policy customers_select on public.customers for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','caixa'])));
drop policy pets_select on public.pets;create policy pets_select on public.pets for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador'])));
drop policy appointments_select on public.appointments;create policy appointments_select on public.appointments for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador'])));
drop policy appointment_history_select on public.appointment_status_history;create policy appointment_history_select on public.appointment_status_history for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','atendente','caixa','banhista','tosador'])));

drop policy suppliers_select on public.suppliers;create policy suppliers_select on public.suppliers for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','estoquista'])));
drop policy sales_select on public.sales;create policy sales_select on public.sales for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
drop policy sales_insert on public.sales;drop policy sales_update on public.sales;drop policy sale_items_insert on public.sale_items;
drop policy products_update on public.products;create policy products_update on public.products for update to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','estoquista'])))with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','estoquista'])));
drop policy stock_insert on public.stock_movements;create policy stock_insert on public.stock_movements for insert to authenticated with check((select private.has_company_role(company_id,array['proprietario','administrador','gerente','estoquista'])));

drop policy financial_select on public.financial_transactions;create policy financial_select on public.financial_transactions for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
drop policy cash_select on public.cash_registers;create policy cash_select on public.cash_registers for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
drop policy cash_movements_select on public.cash_movements;create policy cash_movements_select on public.cash_movements for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
drop policy order_payments_select on public.service_order_payments;create policy order_payments_select on public.service_order_payments for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
drop policy sale_payments_select on public.sale_payments;create policy sale_payments_select on public.sale_payments for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
drop policy commissions_select on public.commissions;create policy commissions_select on public.commissions for select to authenticated using(employee_id=(select auth.uid())or(select private.has_company_role(company_id,array['proprietario','administrador','gerente'])));

drop policy credits_select on public.customer_credit_movements;create policy credits_select on public.customer_credit_movements for select to authenticated using(auth_user_id=(select auth.uid())or(select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
drop policy refunds_select on public.pix_refund_requests;create policy refunds_select on public.pix_refund_requests for select to authenticated using(auth_user_id=(select auth.uid())or(select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));
drop policy sale_returns_select on public.sale_returns;create policy sale_returns_select on public.sale_returns for select to authenticated using(auth_user_id=(select auth.uid())or(select private.has_company_role(company_id,array['proprietario','administrador','gerente','caixa'])));

drop policy purchase_orders_select on public.purchase_orders;create policy purchase_orders_select on public.purchase_orders for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','estoquista'])));
drop policy purchase_items_select on public.purchase_order_items;create policy purchase_items_select on public.purchase_order_items for select to authenticated using((select private.has_company_role(company_id,array['proprietario','administrador','gerente','estoquista'])));
commit;
