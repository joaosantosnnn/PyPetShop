-- PetGestor: índices restantes das relações de comandas.
begin;
create index service_order_items_company_idx on public.service_order_items(company_id);
create index service_order_payments_company_idx on public.service_order_payments(company_id);
create index commissions_company_idx on public.commissions(company_id);
create index commissions_order_item_idx on public.commissions(service_order_item_id);
commit;
