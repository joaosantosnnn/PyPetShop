import { supabase } from '../lib/supabase';
import type { LoyaltyPackage } from '../types';

export async function loadLoyaltyPackages(companyId: string) {
  const { data, error } = await supabase.from('customer_packages').select('*').eq('company_id', companyId).order('expires_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as LoyaltyPackage[];
}

export async function sellLoyaltyPackage(input: { customerId:string;petId:string;serviceId:string;name:string;totalUses:number;validityDays:number;price:number;paymentMethod:string }) {
  const { data, error } = await supabase.rpc('sell_service_package', { p_customer_id:input.customerId,p_pet_id:input.petId,p_service_id:input.serviceId,p_name:input.name,p_total_uses:input.totalUses,p_validity_days:input.validityDays,p_price:input.price,p_payment_method:input.paymentMethod });
  if (error) throw new Error(error.message);
  return data as LoyaltyPackage;
}
