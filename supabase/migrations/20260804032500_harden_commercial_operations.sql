-- PetGestor: funções comerciais com privilégios do chamador e políticas sem sobreposição.
begin;

alter function public.adjust_product_stock(uuid,numeric,text,text) security invoker;
alter function public.complete_product_sale(uuid,jsonb,numeric,text,numeric,text) security invoker;

drop policy suppliers_write on public.suppliers;
create policy suppliers_insert on public.suppliers for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista']));
create policy suppliers_update on public.suppliers for update to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista']));

drop policy products_write on public.products;
create policy products_insert on public.products for insert to authenticated
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista']));
create policy products_update on public.products for update to authenticated
using (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista','caixa']))
with check (private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista','caixa']));

create index suppliers_company_id_idx on public.suppliers(company_id);
create index stock_movements_product_company_idx on public.stock_movements(product_id, company_id);
create index sale_items_company_id_idx on public.sale_items(company_id);

commit;
