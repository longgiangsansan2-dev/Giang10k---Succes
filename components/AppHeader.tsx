"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ListTodo, BarChart3, BookText, RefreshCw, Sun, Moon, Target, CheckSquare, LogOut, User as UserIcon, Code } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export const AppHeader = () => {
  const location = useLocation();
  const { profile, signOut, isAdmin } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);

    const handleStatus = (e: any) => {
      if (e.detail) {
        setIsRefreshing(e.detail.refreshing);
        if (e.detail.lastRefresh) setLastRefresh(e.detail.lastRefresh);
      }
    };
    window.addEventListener('giang:status', handleStatus);
    return () => window.removeEventListener('giang:status', handleStatus);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const tabs = [
    { id: 'tasks', label: 'Nhiệm vụ', path: '/', icon: ListTodo },
    { id: 'reports', label: 'Báo cáo', path: '/reports', icon: BarChart3 },
    { id: 'journal', label: 'Ghi chú', path: '/journal', icon: BookText },
    { id: 'vision', label: 'Vision', path: '/vision-board', icon: Target },
    { id: 'bucketlist', label: 'Bucketlist', path: '/bucketlist', icon: CheckSquare },
  ];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-[100] transition-colors">
      <div className="flex items-center gap-3">
        <Link to="/" className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl shadow-lg">
          <Code size={20} />
        </Link>
        <span className="font-black text-xl text-slate-800 dark:text-slate-100 hidden md:inline tracking-tighter">
          Success<span className="text-indigo-600">Code</span>
        </span>
      </div>

      <nav className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <Link key={tab.id} to={tab.path} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", isActive ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              <tab.icon size={14}/>
              <span className="hidden lg:inline">{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 mr-2 border-r border-slate-100 dark:border-slate-800 pr-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 leading-none truncate max-w-[100px]">{profile?.full_name || 'Người dùng'}</p>
            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">{isAdmin ? 'Administrator' : 'Standard User'}</p>
          </div>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-8 h-8 rounded-full border-2 border-indigo-500/20" alt="Avatar" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><UserIcon size={14}/></div>
          )}
        </div>

        <button onClick={toggleDarkMode} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-500" />}
        </button>

        <button onClick={signOut} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500" title="Đăng xuất">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};