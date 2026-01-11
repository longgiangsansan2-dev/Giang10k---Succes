import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ListTodo, BarChart3, BookText, 
  Target, CheckSquare, LogOut, Settings, Code, Sun, Moon,
  Menu, X, PanelLeft, Trophy, Flame
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ActivityFeed } from './ActivityFeed';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export const MainLayout = () => {
  const location = useLocation();
  const { profile, signOut, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showToggleTooltip, setShowToggleTooltip] = useState(false);

  // Sync isCollapsed with localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Keyboard shortcut Ctrl + .
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const navLinks = [
    { name: 'Nhiệm vụ', path: '/', icon: ListTodo },
    { name: 'Dashboard', path: '/dashboard', icon: Trophy },
    { name: 'Báo cáo', path: '/reports', icon: BarChart3 },
    { name: 'Ghi chú', path: '/journal', icon: BookText },
    { name: 'Vision', path: '/vision-board', icon: Target },
    { name: 'Bucketlist', path: '/bucketlist', icon: CheckSquare },
    { name: 'Thiết lập DMO', path: '/dmo/setup', icon: Settings },
  ];

  const getPageTitle = () => {
    const currentLink = navLinks.find(link => link.path === location.pathname);
    return currentLink ? currentLink.name : 'SuccessCode';
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div 
      className={cn(
        "flex flex-col h-full bg-white dark:bg-[#1e1f20] transition-all duration-200",
        !mobile && "border-r border-slate-200 dark:border-[#333537]"
      )}
    >
      {/* Sidebar Header with Toggle Button */}
      <div className={cn(
        "h-14 flex items-center px-4 border-b border-slate-100 dark:border-[#333537] transition-all shrink-0",
        (isCollapsed && !mobile) ? "justify-center" : "justify-between"
      )}>
        {(!isCollapsed || mobile) ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <Link to="/" className="bg-indigo-600 text-white p-1 rounded-lg shrink-0 shadow-sm">
              <Code size={16} />
            </Link>
            <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white whitespace-nowrap animate-in fade-in duration-300">
              Success<span className="text-indigo-600">Code</span>
            </span>
          </div>
        ) : null}

        {/* Toggle Button Inside Sidebar */}
        {!mobile && (
          <div className="relative group">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              onMouseEnter={() => setShowToggleTooltip(true)}
              onMouseLeave={() => setShowToggleTooltip(false)}
              className={cn(
                "p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-all",
                "hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90"
              )}
            >
              <PanelLeft size={20} />
            </button>
            
            {showToggleTooltip && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 flex items-center z-[200] animate-in fade-in zoom-in-95 duration-100 pointer-events-none">
                <div className="bg-slate-900 dark:bg-black text-white text-[11px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl border border-slate-700">
                  {isCollapsed ? 'Open sidebar' : 'Close sidebar'} <span className="ml-2 text-slate-500 font-medium">Ctrl+.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {mobile && (
          <button onClick={() => setIsMobileOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Profile Section */}
      <div className={cn("px-2.5 my-4 transition-all shrink-0", (isCollapsed && !mobile) ? "flex justify-center" : "")}>
        <div className={cn(
          "flex items-center gap-3 p-1.5 rounded-xl transition-all w-full overflow-hidden",
          (isCollapsed && !mobile) ? "bg-transparent justify-center" : "bg-slate-50 dark:bg-slate-800/30"
        )}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-8 h-8 rounded-full border border-indigo-500/10 shrink-0 object-cover" alt="Avatar" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-[10px] uppercase">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
            </div>
          )}
          {(!isCollapsed || mobile) && (
            <div className="min-w-0 flex-1 animate-in slide-in-from-left-2 duration-300">
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate font-normal lowercase tracking-tight opacity-70">{user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 space-y-1 overflow-y-auto no-scrollbar py-2">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileOpen(false)}
              title={(isCollapsed && !mobile) ? link.name : ''}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden",
                (isCollapsed && !mobile) ? "justify-center" : "",
                isActive 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <link.icon size={19} className={cn("shrink-0 transition-transform", !isActive && "group-hover:scale-110")} />
              {(!isCollapsed || mobile) && (
                <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                  {link.name}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Activity Feed Section */}
      {(!isCollapsed || mobile) && (
        <div className="px-2.5 py-3 border-t border-slate-100 dark:border-[#333537] max-h-[200px] overflow-y-auto no-scrollbar">
          <ActivityFeed 
            isCollapsed={isCollapsed && !mobile} 
            maxItems={5}
            onViewAll={() => {
              setIsMobileOpen(false);
              // Navigate to dashboard
            }}
          />
        </div>
      )}
      
      {(isCollapsed && !mobile) && (
        <div className="px-2 py-2 border-t border-slate-100 dark:border-[#333537]">
          <ActivityFeed isCollapsed={true} />
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-2.5 mt-auto border-t border-slate-100 dark:border-[#333537] space-y-1">
        <button
          onClick={toggleDarkMode}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all",
            (isCollapsed && !mobile) ? "justify-center" : ""
          )}
          title={(isCollapsed && !mobile) ? (isDark ? 'Light mode' : 'Dark mode') : ''}
        >
          {isDark ? <Sun size={19} className="text-amber-500" /> : <Moon size={19} />}
          {(!isCollapsed || mobile) && <span className="text-[13px] font-semibold">{isDark ? 'Chế độ sáng' : 'Chế độ tối'}</span>}
        </button>
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all",
            (isCollapsed && !mobile) ? "justify-center" : ""
          )}
          title={(isCollapsed && !mobile) ? 'Đăng xuất' : ''}
        >
          <LogOut size={19} />
          {(!isCollapsed || mobile) && <span className="text-[13px] font-semibold">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white dark:bg-[#131314] transition-colors overflow-hidden">
      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:block h-full transition-all duration-300 shrink-0 z-[100]",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        {/* Mobile Header (Only visible on mobile) */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-white dark:bg-[#1e1f20] border-b border-slate-200 dark:border-[#333537] shrink-0">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
            <Menu size={20} />
          </button>
          <span className="font-bold text-slate-800 dark:text-white uppercase tracking-tight text-sm">
            {getPageTitle()}
          </span>
          <div className="w-8" />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};