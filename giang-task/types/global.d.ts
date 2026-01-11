
declare global {
  interface Window {
    __SUPABASE_PUBLIC_ENV__?: {
      url?: string;
      anonKey?: string;
    };
  }
}

export {};
