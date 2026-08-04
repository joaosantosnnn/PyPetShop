-- PetGestor: toda quantidade inicial de produto gera histórico de estoque.
begin;

create or replace function private.log_initial_product_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.current_stock > 0 then
    insert into public.stock_movements(
      company_id, product_id, movement_type, quantity, unit_cost, reason,
      previous_stock, new_stock, created_by
    ) values (
      new.company_id, new.id, 'entrada_manual', new.current_stock, new.cost_price,
      'Estoque inicial do cadastro', 0, new.current_stock, (select auth.uid())
    );
  end if;
  return new;
end;
$$;

revoke all on function private.log_initial_product_stock() from public, anon, authenticated;
create trigger products_log_initial_stock
after insert on public.products
for each row execute function private.log_initial_product_stock();

commit;
