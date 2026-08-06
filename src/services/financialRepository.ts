import { supabase } from '../lib/supabase';

export interface FinancialPaymentMethod {
  id?: string;
  company_id: string;
  code: string;
  name: string;
  is_active: boolean;
  fee_percentage: number;
  settlement_days: number;
  display_order: number;
}

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function loadFinancialPaymentMethods(companyId: string) {
  const { data, error } = await supabase.from('financial_payment_methods').select('*')
    .eq('company_id', companyId).order('display_order');
  fail(error);
  return (data ?? []).map(row => ({ ...row, fee_percentage: Number(row.fee_percentage), settlement_days: Number(row.settlement_days) })) as FinancialPaymentMethod[];
}

export async function saveFinancialPaymentMethods(methods: FinancialPaymentMethod[]) {
  const rows = methods.map(({ id: _id, ...method }) => method);
  const { data, error } = await supabase.from('financial_payment_methods')
    .upsert(rows, { onConflict: 'company_id,code' }).select('*');
  fail(error);
  return (data ?? []) as FinancialPaymentMethod[];
}
