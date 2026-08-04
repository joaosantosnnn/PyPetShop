import { supabase } from '../lib/supabase';
import type { DeliveryRequest } from '../types';

const row = (request: DeliveryRequest) => {
  const { customer_name: _customerName, pet_name: _petName, driver_name: _driverName, ...data } = request;
  return data;
};

export async function loadDeliveryRequests(companyId: string) {
  const { data, error } = await supabase.from('delivery_requests').select('*').eq('company_id', companyId).order('scheduled_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as DeliveryRequest[];
}

export async function insertDeliveryRequest(request: DeliveryRequest) {
  const { data, error } = await supabase.from('delivery_requests').insert(row(request)).select().single();
  if (error) throw new Error(error.message);
  return { ...request, ...(data as DeliveryRequest) };
}

export async function saveDeliveryRequest(request: DeliveryRequest) {
  const { id, company_id, ...changes } = row(request);
  const { data, error } = await supabase.from('delivery_requests').update(changes).eq('id', id).eq('company_id', company_id).select().single();
  if (error) throw new Error(error.message);
  return { ...request, ...(data as DeliveryRequest) };
}
