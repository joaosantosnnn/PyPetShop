import { supabase } from '../lib/supabase';
import type { Product, Sale, StockMovement, Supplier } from '../types';

export interface CommercialData {
  products: Product[];
  stockMovements: StockMovement[];
  sales: Sale[];
  suppliers: Supplier[];
}

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const normalizeProduct = (row: Record<string, unknown>, supplierName?: string): Product => ({
  ...(row as unknown as Product),
  selling_price: Number(row.sale_price ?? 0),
  sale_price: Number(row.sale_price ?? 0),
  minimum_stock: Number(row.min_stock ?? 0),
  min_stock: Number(row.min_stock ?? 0),
  supplier_name: supplierName,
});

export async function loadCommercialData(companyId: string): Promise<CommercialData> {
  const [productResult, movementResult, salesResult, itemResult, supplierResult] = await Promise.all([
    supabase.from('products').select('*').eq('company_id', companyId).order('name'),
    supabase.from('stock_movements').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(500),
    supabase.from('sales').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(500),
    supabase.from('sale_items').select('*').eq('company_id', companyId),
    supabase.from('suppliers').select('*').eq('company_id', companyId).order('company_name'),
  ]);
  [productResult, movementResult, salesResult, itemResult, supplierResult].forEach(result => fail(result.error));

  const suppliers = (supplierResult.data ?? []) as Supplier[];
  const supplierById = new Map(suppliers.map(item => [item.id, item.trade_name || item.company_name]));
  const products = (productResult.data ?? []).map(row => normalizeProduct(row, supplierById.get(row.supplier_id)));
  const productById = new Map(products.map(item => [item.id, item.name]));
  const itemsBySale = new Map<string, Record<string, unknown>[]>();
  for (const item of itemResult.data ?? []) {
    itemsBySale.set(item.sale_id, [...(itemsBySale.get(item.sale_id) ?? []), item]);
  }

  return {
    products,
    suppliers,
    stockMovements: ((movementResult.data ?? []) as StockMovement[]).map(item => ({
      ...item,
      product_name: productById.get(item.product_id),
    })),
    sales: ((salesResult.data ?? []) as Sale[]).map(item => ({
      ...item,
      total: Number(item.total_amount),
      items: itemsBySale.get(item.id) ?? [],
    })),
  };
}

const productRow = (product: Product) => {
  const {
    selling_price, minimum_stock, supplier_name: _supplierName,
    batch_number: _batchNumber, expiration_date: _expirationDate,
    next_batch_number: _nextBatch, next_expiration_date: _nextExpiration, ...row
  } = product;
  return { ...row, sale_price: selling_price, min_stock: minimum_stock };
};

export async function insertProduct(product: Product) {
  const { data, error } = await supabase.from('products').insert(productRow(product)).select().single();
  fail(error);
  return normalizeProduct(data, product.supplier_name);
}

export async function saveProduct(product: Product) {
  const { id, company_id, ...changes } = productRow(product);
  const { data, error } = await supabase.from('products').update(changes).eq('id', id).eq('company_id', company_id).select().single();
  fail(error);
  return normalizeProduct(data, product.supplier_name);
}

export async function insertSupplier(supplier: Supplier) {
  const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
  fail(error);
  return data as Supplier;
}

export async function adjustProductStock(productId: string, quantity: number, movementType: string, reason: string) {
  const normalizedType = movementType === 'uso_interno' ? 'consumo_servico'
    : movementType === 'ajuste' ? (quantity > 0 ? 'ajuste_positivo' : 'ajuste_negativo')
    : movementType === 'compra' && quantity < 0 ? 'ajuste_negativo' : movementType;
  const { data, error } = await supabase.rpc('adjust_product_stock', {
    p_product_id: productId,
    p_quantity: quantity,
    p_movement_type: normalizedType,
    p_reason: reason,
  });
  fail(error);
  return normalizeProduct(data as Record<string, unknown>);
}

export interface SaleInput {
  customer_id?: string;
  customer_name?: string;
  items: Array<{ item_id: string; quantity: number }>;
  discount: number;
  payment_method: string;
  amount_paid: number;
  credit_amount?: number;
  notes?: string;
}

export async function completeProductSale(input: SaleInput) {
  const mixed = Number(input.credit_amount ?? 0) > 0;
  const { data, error } = await supabase.rpc(mixed ? 'complete_mixed_product_sale' : 'complete_product_sale', {
    p_customer_id: input.customer_id || null,
    p_items: input.items.map(item => ({ product_id: item.item_id, quantity: item.quantity })),
    p_discount: input.discount,
    p_payment_method: input.payment_method,
    p_amount_paid: input.amount_paid,
    ...(mixed ? { p_credit_amount: input.credit_amount } : {}),
    p_notes: input.notes || null,
  });
  fail(error);
  return data as { id: string; sale_number: number; subtotal: number; total_amount: number; change_amount: number; created_at: string };
}
export async function returnProductSale(saleId:string,reason:string){const{data,error}=await supabase.rpc('return_product_sale',{p_sale_id:saleId,p_reason:reason});fail(error);return data as{sale_number:number;credit_amount:number;refund_amount:number;status:string}}
