import { supabase } from '../lib/supabase';
import type { BlockedTime } from '../types';

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function loadBlockedTimes(companyId: string) {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('company_id', companyId)
    .gte('end_at', new Date().toISOString())
    .order('start_at');
  fail(error);
  return (data ?? []) as BlockedTime[];
}

export async function loadCalendarBlockedTimes(companyId: string) {
  const { data, error } = await supabase
    .from('blocked_times')
    .select('*')
    .eq('company_id', companyId)
    .order('start_at');
  fail(error);
  return (data ?? []) as BlockedTime[];
}

export async function createBlockedTime(blockedTime: Omit<BlockedTime, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('blocked_times').insert(blockedTime).select().single();
  fail(error);
  return data as BlockedTime;
}

export async function deleteBlockedTime(id: string, companyId: string) {
  const { error } = await supabase.from('blocked_times').delete().eq('id', id).eq('company_id', companyId);
  fail(error);
}
