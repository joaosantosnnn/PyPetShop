import { supabase } from '../lib/supabase';
import type { FinancialTransaction, ServiceOrder, ServiceOrderItem } from '../types';

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function loadServiceOrders(companyId: string) {
  const [ordersResult, itemsResult, customersResult, petsResult, financialResult] = await Promise.all([
    supabase.from('service_orders').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    supabase.from('service_order_items').select('*').eq('company_id', companyId),
    supabase.from('customers').select('id,name').eq('company_id', companyId),
    supabase.from('pets').select('id,name').eq('company_id', companyId),
    supabase.from('financial_transactions').select('*').eq('company_id', companyId).order('due_date', { ascending: false }),
  ]);
  [ordersResult, itemsResult, customersResult, petsResult, financialResult].forEach(result => fail(result.error));
  const customerById = new Map((customersResult.data ?? []).map(item => [item.id, item.name]));
  const petById = new Map((petsResult.data ?? []).map(item => [item.id, item.name]));
  const itemsByOrder = new Map<string, ServiceOrderItem[]>();
  for (const row of itemsResult.data ?? []) {
    const item: ServiceOrderItem = {
      id: row.id,
      service_order_id: row.service_order_id,
      type: row.item_type,
      item_id: row.service_id || row.product_id,
      name: row.name,
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price),
      total_price: Number(row.total_price),
      assigned_employee_id: row.assigned_employee_id || undefined,
      commission_amount: Number(row.commission_amount),
    };
    itemsByOrder.set(row.service_order_id, [...(itemsByOrder.get(row.service_order_id) ?? []), item]);
  }
  return {
    orders: ((ordersResult.data ?? []) as ServiceOrder[]).map(order => ({
      ...order,
      customer_name: customerById.get(order.customer_id),
      pet_name: petById.get(order.pet_id),
      items: itemsByOrder.get(order.id) ?? [],
    })),
    financialTransactions: ((financialResult.data ?? []) as FinancialTransaction[]).map(item => ({
      ...item,
      customer_name: item.customer_id ? customerById.get(item.customer_id) : undefined,
    })),
  };
}

export async function openServiceOrder(appointmentId: string) {
  const { data, error } = await supabase.rpc('open_service_order', { p_appointment_id: appointmentId });
  fail(error);
  return data as string;
}

export async function addOrderItem(orderId: string, type: 'service' | 'product' | 'internal_consumption', itemId: string, quantity: number) {
  const { data, error } = await supabase.rpc('add_service_order_item', {
    p_order_id: orderId, p_item_type: type, p_item_id: itemId, p_quantity: quantity,
  });
  fail(error);
  return data as string;
}

export async function payServiceOrder(orderId: string, amount: number, paymentMethod: string) {
  const { data, error } = await supabase.rpc('pay_service_order', {
    p_order_id: orderId, p_amount: amount, p_payment_method: paymentMethod,
  });
  fail(error);
  return data as { order_number: number; paid_amount: number; remaining: number; status: string };
}

export async function insertFinancialTransaction(transaction: FinancialTransaction) {
  const { customer_name: _customerName, supplier_name: _supplierName, ...row } = transaction;
  const { data, error } = await supabase.from('financial_transactions').insert(row).select().single();
  fail(error);
  return data as FinancialTransaction;
}
