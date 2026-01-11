
/**
 * Quản lý cấu hình Supabase Runtime
 */

const HARDCODED_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://luhgjdvorwgridljhoar.supabase.co";
const HARDCODED_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aGdqZHZvcndncmlkbGpob2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjQ0NjcsImV4cCI6MjA1MDU0MDQ2N30.Hgmjm_rAnPnHUdHaQxImOd1-SMKTiXzeerREaqnavKk";

export function getRuntimeSupabaseConfig() {
  return {
    url: HARDCODED_URL,
    anonKey: HARDCODED_ANON,
    isManual: false
  };
}

export function saveRuntimeSupabaseConfig(url: string, anonKey: string) {
  // No-op
}

export function clearRuntimeSupabaseConfig() {
  // No-op
}

export function isConfigValid() {
  return !!HARDCODED_URL && !!HARDCODED_ANON;
}

export function exportConfigAsJSON() {
  return JSON.stringify({ url: HARDCODED_URL, anonKey: HARDCODED_ANON }, null, 2);
}

export function importConfigFromJSON(jsonStr: string) {
  return false;
}
