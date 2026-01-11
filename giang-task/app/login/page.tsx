
"use client";

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = getSupabaseClient();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/', { replace: true });
    };
    checkUser();
  }, [navigate, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setError("Đăng ký thành công! Hãy đăng nhập ngay.");
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Lỗi xác thực.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 p-10 space-y-8 relative overflow-hidden transition-all">
        <div className="text-center space-y-3">
          <div className="inline-flex p-5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[2rem] shadow-2xl mb-2"><Sparkles size={40} fill="currentColor" /></div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Giang<span className="text-indigo-600">10k</span></h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{isSignUp ? 'Tạo tài khoản mới' : 'Năng suất tối đa mỗi ngày'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail size={12}/> Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-4 px-6 outline-none ring-1 ring-slate-200 focus:ring-2 ring-indigo-500 text-sm font-medium transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Mật khẩu</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-4 px-6 outline-none ring-1 ring-slate-200 focus:ring-2 ring-indigo-500 text-sm font-medium transition-all" />
          </div>
          {error && <div className={`p-4 rounded-2xl text-xs font-bold text-center border flex items-center gap-2 justify-center ${error.includes('thành công') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}><AlertCircle size={16} /> {error}</div>}
          <button type="submit" disabled={loading} className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 uppercase tracking-widest transition-all">
            {loading ? <Loader2 size={20} className="animate-spin" /> : isSignUp ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>
        <div className="text-center pt-6 border-t border-slate-50"><button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">{isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button></div>
      </div>
    </div>
  );
}
