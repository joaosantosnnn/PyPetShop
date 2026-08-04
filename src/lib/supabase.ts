import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' && 
  supabasePublishableKey &&
  supabasePublishableKey !== 'your-supabase-publishable-key' &&
  supabasePublishableKey !== 'your-supabase-anon-key'
);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabasePublishableKey : 'placeholder-publishable-key'
);
