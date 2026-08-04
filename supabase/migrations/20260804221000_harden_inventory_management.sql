create index if not exists inventory_items_company_idx
  on public.inventory_count_items(company_id);

drop policy if exists inventory_counts_write on public.inventory_counts;
create policy inventory_counts_insert on public.inventory_counts for insert to authenticated
with check ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])));
create policy inventory_counts_update on public.inventory_counts for update to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])))
with check ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])));
create policy inventory_counts_delete on public.inventory_counts for delete to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador','gerente'])));

drop policy if exists inventory_items_write on public.inventory_count_items;
create policy inventory_items_insert on public.inventory_count_items for insert to authenticated
with check ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])));
create policy inventory_items_update on public.inventory_count_items for update to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])))
with check ((select private.has_company_role(company_id, array['proprietario','administrador','gerente','estoquista'])));
create policy inventory_items_delete on public.inventory_count_items for delete to authenticated
using ((select private.has_company_role(company_id, array['proprietario','administrador','gerente'])));
