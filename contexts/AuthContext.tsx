"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();
  const isMounted = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    console.log('[Auth] Fetching profile for:', userId);
    try {
      // Timeout 3s cho việc fetch profile để tránh treo app
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile timeout')), 3000)
      );
      
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const result: any = await Promise.race([queryPromise, timeoutPromise]);
      
      if (result.error) {
        console.warn('[Auth] Profile query error:', result.error.message);
        return null;
      }
      return result.data;
    } catch (e: any) {
      console.warn('[Auth] Profile fetch failed or timed out:', e.message);
      return null;
    }
  }, [supabase]);

  const refreshAuth = useCallback(async () => {
    console.log('[Auth] Manual refresh started');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        console.log('[Auth] Refresh: user set, loading off');
        
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('[Auth] Refresh error');
      setLoading(false);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    console.log('[Auth] Initializing AuthProvider...');

    // 1. BACKUP TIMEOUT: Ép loading về false sau 5s nếu kẹt
    const backupTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] Watchdog triggered: forcing loading to false after 5s');
        setLoading(false);
      }
    }, 5000);

    const init = async () => {
      try {
        console.log('[Auth] Checking initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] getSession error:', error.message);
        }

        if (session?.user) {
          console.log('[Auth] Session found:', session.user.email);
          setUser(session.user);
          // Tắt loading NGAY khi có user, không đợi profile
          setLoading(false);
          console.log('[Auth] init: loading set to false (user ready)');
          
          // Fetch profile background
          fetchProfile(session.user.id).then(p => {
            console.log('[Auth] Profile background load finished');
            setProfile(p);
          });
        } else {
          console.log('[Auth] No initial session');
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Init catch block');
        setLoading(false);
      } finally {
        clearTimeout(backupTimeout);
      }
    };

    // 2. Lắng nghe thay đổi trạng thái
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event detected:', event);
        
        if (session?.user) {
          console.log('[Auth] AuthChange: user detected, stopping loading');
          setUser(session.user);
          setLoading(false); 
          console.log('[Auth] AuthChange: loading set to false');
          
          fetchProfile(session.user.id).then(p => {
            console.log('[Auth] AuthChange: profile loaded in background');
            setProfile(p);
          });
          
          clearTimeout(backupTimeout);
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] AuthChange: SIGNED_OUT');
          setUser(null);
          setProfile(null);
          setLoading(false);
          clearTimeout(backupTimeout);
        }
      }
    );

    init();

    return () => {
      subscription.unsubscribe();
      clearTimeout(backupTimeout);
    };
  }, [fetchProfile]);

  const signInWithGoogle = async () => {
    const redirectUrl = window.location.origin + window.location.pathname;
    console.log('[Auth] signInWithGoogle, redirecting...');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: redirectUrl,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
  };

  const signOut = async () => {
    console.log('[Auth] signOut started');
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem('giang-task-auth');
    setUser(null);
    setProfile(null);
    setLoading(false);
    console.log('[Auth] signOut completed');
    window.location.href = '#/login';
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut, isAdmin, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};