import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const DEMO_USER_ID = "11111111-1111-1111-1111-111111111111";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "https://wxfqmkboolkvhqdaknax.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZnFta2Jva2x2aHFkYWtuYXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTk0MDMsImV4cCI6MjA5Nzc5NTQwM30.mNq1vkdXKiwssUat6qbcW0zHVD5pyqwoc0PrmHSdx48";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  console.log("[supabase] config", {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    hasSupabaseConfig
  });

  if (!hasSupabaseConfig) {
    console.error("[supabase] missing config, falling back to mock data");
    return null;
  }

  if (!supabaseClient) {
    console.log("[supabase] creating client instance");
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      }
    });
  }

  return supabaseClient;
}
