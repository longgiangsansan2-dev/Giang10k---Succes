
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Thông tin fallback hardcoded theo yêu cầu
const FALLBACK_URL = "https://luhgjdvorwgridljhoar.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aGdqZHZvcndncmlkbGpob2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODUyMzMsImV4cCI6MjA4MjA2MTIzM30.Hgmjm_rAnPnHUdHaQxImOd1-SMKTiXzeerREaqnavKk";

// Kiểm tra an toàn cho process.env để tránh lỗi ReferenceError: process is not defined
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

/**
 * Singleton Supabase Client dùng @supabase/supabase-js
 * Đảm bảo tương thích cả Browser và Server runtime
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    console.info("[DB_INIT] URL:", SUPABASE_URL);
    console.info("[DB_INIT] Key:", SUPABASE_ANON_KEY.substring(0, 10) + "...");
    
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
}

// Giữ lại createClient như một bí danh để không làm hỏng code cũ nếu chưa kịp đổi hết
export const createClient_deprecated = getSupabaseClient;
