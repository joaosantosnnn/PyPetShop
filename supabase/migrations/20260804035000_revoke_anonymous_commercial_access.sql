-- PetGestor: o catálogo administrativo exige autenticação.
begin;

revoke all on public.suppliers, public.products, public.stock_movements, public.sales, public.sale_items from anon;
revoke all on all sequences in schema public from anon;

commit;
