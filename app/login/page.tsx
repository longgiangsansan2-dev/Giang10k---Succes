"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Loader2, Mail, Lock, AlertCircle, Code } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const supabase = getSupabaseClient();
  const navigate = useNavigate();

  // Nếu đã login thì redirect về trang chủ
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== GOOGLE BUTTON CLICKED ===');
    // Redirect URL phải khớp với cài đặt trong Supabase Dashboard
    const redirectUrl = window.location.origin + window.location.pathname;
    console.log('Redirect URL:', redirectUrl);
    
    setGoogleLoading(true);
    setError(null);
    
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        }
      });
      
      if (oauthError) {
        console.error('OAuth error:', oauthError);
        throw oauthError;
      }
      
      // Nếu không lỗi, trình duyệt sẽ tự động chuyển hướng sang Google
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Lỗi đăng nhập Google');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setError("Đăng ký thành công! Hãy kiểm tra email.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || "Lỗi xác thực.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 space-y-8 relative overflow-hidden">
        <div className="text-center space-y-3">
          <div className="inline-flex p-5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[2rem] shadow-2xl mb-2">
            <Code size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
            Success<span className="text-indigo-600">Code</span>
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mật mã thành công</p>
        </div>

        {/* NÚT GOOGLE - KHÔNG TRONG FORM */}
        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full py-4 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {googleLoading ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase font-black tracking-widest"><span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Hoặc</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={12}/> Email
            </label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              autoComplete="email"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-3.5 px-5 outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12}/> Mật khẩu
            </label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              autoComplete="current-password"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl py-3.5 px-5 outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all" 
            />
          </div>
          
          {error && (
            <div className={`p-4 rounded-2xl text-xs font-bold text-center border flex items-center gap-2 justify-center ${error.includes('thành công') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-800'}`}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading || googleLoading} 
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 uppercase tracking-widest transition-all"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : isSignUp ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
            className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>
        </div>
      </div>
    </div>
  );
}