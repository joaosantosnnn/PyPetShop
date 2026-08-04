import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types';

export async function loadAuditLogs(companyId: string, entityType?: string) {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(300);
  if (entityType) query = query.eq('entity_type', entityType);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLog[];
}
