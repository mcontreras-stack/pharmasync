import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured(): boolean {
  if (typeof window !== 'undefined' && localStorage.getItem('vitarahealth_force_mock_mode') === 'true') {
    return false;
  }
  return (
    supabaseUrl.length > 0 && 
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes('placeholder')
  );
}

