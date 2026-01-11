
import { getRuntimeSupabaseConfig, isConfigValid } from './runtimeConfig';

/**
 * Bridge sang runtimeConfig mới để không phá vỡ các import cũ nếu có
 */
export function getSupabasePublicEnv() {
  const config = getRuntimeSupabaseConfig();
  return {
    url: config.url,
    anonKey: config.anonKey
  };
}

export function isSupabaseConfigValid() {
  return isConfigValid();
}
