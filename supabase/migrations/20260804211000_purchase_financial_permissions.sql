drop policy if exists financial_insert on public.financial_transactions;

create policy financial_insert
on public.financial_transactions
for insert
to authenticated
with check (
  private.has_company_role(
    company_id,
    array['proprietario', 'administrador', 'gerente', 'caixa']
  )
  or (
    private.has_company_role(company_id, array['estoquista'])
    and type = 'despesa'
    and category = 'Compra de Mercadorias'
    and status = 'pendente'
    and purchase_order_id is not null
    and exists (
      select 1
      from public.purchase_orders po
      where po.id = purchase_order_id
        and po.company_id = financial_transactions.company_id
        and po.supplier_id = financial_transactions.supplier_id
        and po.total_amount = financial_transactions.amount
        and po.due_date = financial_transactions.due_date
    )
  )
);
