import { supabase } from '../lib/supabase';

export interface DashboardDailyFlow {
  date: string;
  revenue: number;
  expense: number;
}

export interface DashboardSummary {
  generated_at: string;
  role: string;
  appointments_today: number | null;
  appointments_pending: number | null;
  in_service: number | null;
  ready_for_pickup: number | null;
  low_stock: number | null;
  out_of_stock: number | null;
  pending_purchase_orders: number | null;
  pending_deliveries: number | null;
  revenue_today: number | null;
  revenue_month: number | null;
  expenses_due: number | null;
  receivables_due: number | null;
  sales_today: number | null;
  open_cash: boolean | null;
  pending_refunds: number | null;
  daily_flow: DashboardDailyFlow[];
}

export async function loadDashboardSummary(): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc('get_dashboard_summary');
  if (error) throw new Error(error.message);
  return data as DashboardSummary;
}
