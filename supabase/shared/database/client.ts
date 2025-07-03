// Supabase client management - Extracted from database.ts
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getConfig } from '../config.ts';

let supabase: SupabaseClient | null = null;

// Initialize Supabase client with service role key for Edge Functions
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const config = getConfig();
    supabase = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabase;
} 