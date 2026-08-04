create index if not exists financial_purchase_order_company_idx
  on public.financial_transactions (purchase_order_id, company_id)
  where purchase_order_id is not null;

create index if not exists purchase_items_order_company_idx
  on public.purchase_order_items (purchase_order_id, company_id);

create index if not exists purchase_items_product_company_idx
  on public.purchase_order_items (product_id, company_id);

create index if not exists purchase_orders_creator_company_idx
  on public.purchase_orders (created_by, company_id);

create index if not exists purchase_orders_supplier_company_idx
  on public.purchase_orders (supplier_id, company_id);
