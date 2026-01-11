import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://luhgjdvorwgridljhoar.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aGdqZHZvcndncmlkbGpob2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODUyMzMsImV4cCI6MjA4MjA2MTIzM30.Hgmjm_rAnPnHUdHaQxImOd1-SMKTiXzeerREaqnavKk";

const getEnv = (key: string) => {
  try {
    return typeof process !== 'undefined' ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL') || FALLBACK_URL;
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || FALLBACK_KEY;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'successcode-auth-v1', // Đồng bộ tên mới để tránh xung đột cache
      },
    });
    console.log("[Supabase] Client initialized for SuccessCode");
  }
  return supabaseInstance;
}

/**
 * Hàm hỗ trợ lấy client đã xác thực. 
 * getUser() sẽ buộc kiểm tra JWT với server, cực kỳ quan trọng cho RLS.
 */
export async function getAuthenticatedClient(): Promise<{ supabase: SupabaseClient; user: any }> {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('[Supabase] Auth failed:', error?.message);
    throw new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
  }
  
  return { supabase, user };
}

export const clearSession = async () => {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  localStorage.removeItem('successcode-auth-v1');
  localStorage.removeItem('giang-task-auth');
};

export const createClient_deprecated = getSupabaseClient;