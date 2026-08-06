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

export const defaultFinancialPaymentMethods = [
  { code: 'dinheiro', name: 'Dinheiro' },
  { code: 'pix', name: 'Pix' },
  { code: 'cartao_debito', name: 'Cartão de débito' },
  { code: 'cartao_credito', name: 'Cartão de crédito' },
  { code: 'fiado', name: 'Fiado' },
  { code: 'saldo_credito', name: 'Saldo de crédito' },
] as const;

export const fallbackFinancialPaymentMethods = (companyId: string): FinancialPaymentMethod[] =>
  defaultFinancialPaymentMethods.map((method, index) => ({
    ...method, company_id: companyId, is_active: true, fee_percentage: 0,
    settlement_days: 0, display_order: index + 1,
  }));

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
