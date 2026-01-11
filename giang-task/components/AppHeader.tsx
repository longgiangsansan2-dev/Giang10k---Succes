"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ListTodo, BarChart3, BookText, RefreshCw, Sun, Moon, Target, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export const AppHeader = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    // Kiểm tra trạng thái thực tế của class dark trên thẻ html
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
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('giang-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('giang-theme', 'light');
    }
  };

  const handleRefresh = () => {
    window.dispatchEvent(new CustomEvent('giang:refresh'));
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
        <Link to="/" className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all">
          <Sparkles size={20} fill="currentColor" className="opacity-90" />
        </Link>
        <span className="font-black text-xl text-slate-800 dark:text-slate-100 hidden sm:inline tracking-tighter">
          Giang<span className="text-indigo-600">10k</span>
        </span>
      </div>

      <nav className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <Link key={tab.id} to={tab.path} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", isActive ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              <tab.icon size={14}/>
              <span className="hidden xs:inline">{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2">
        <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-50">
          <RefreshCw size={18} className={cn("text-slate-500", isRefreshing && "animate-spin")} />
        </button>

        <button onClick={toggleDarkMode} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
          {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-500" />}
        </button>
      </div>
    </header>
  );
};