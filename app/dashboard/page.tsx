"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { Leaderboard } from '../../components/Leaderboard';
import { ActivityFeed } from '../../components/ActivityFeed';
import { 
  Trophy, Target, CheckCircle2, Flame, TrendingUp, 
  Calendar, Users, BarChart3, Zap, Award, Star,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfYear, subDays } from 'date-fns';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface Stats {
  todayCompleted: number;
  weekCompleted: number;
  monthCompleted: number;
  totalUsers: number;
  todayChange: number; // So với hôm qua
  weekStreak: number;
}

interface UserStats {
  myTodayCount: number;
  myWeekCount: number;
  myMonthCount: number;
  myRank: number;
}

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  iconColor: string;
  bgColor: string;
  change?: number;
  suffix?: string;
}> = ({ title, value, icon: Icon, iconColor, bgColor, change, suffix = '' }) => (
  <div className={cn("p-4 rounded-2xl border border-slate-200 dark:border-slate-800", bgColor)}>
    <div className="flex items-start justify-between mb-2">
      <div className={cn("p-2 rounded-xl", iconColor.replace('text-', 'bg-').replace('500', '100'), "dark:bg-opacity-20")}>
        <Icon size={18} className={iconColor} />
      </div>
      {change !== undefined && change !== 0 && (
        <div className={cn(
          "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
          change > 0 ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {change > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {Math.abs(change)}
        </div>
      )}
    </div>
    <p className="text-2xl font-black text-slate-800 dark:text-white">
      {value.toLocaleString()}{suffix}
    </p>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
      {title}
    </p>
  </div>
);

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    todayCompleted: 0,
    weekCompleted: 0,
    monthCompleted: 0,
    totalUsers: 0,
    todayChange: 0,
    weekStreak: 0
  });
  const [userStats, setUserStats] = useState<UserStats>({
    myTodayCount: 0,
    myWeekCount: 0,
    myMonthCount: 0,
    myRank: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const supabase = getSupabaseClient();

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = subDays(todayStart, 1);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);

      // Fetch all completions for stats
      const { data: completions } = await supabase
        .from('task_completions')
        .select('user_id, completed_at')
        .gte('completed_at', monthStart.toISOString());

      const { data: yesterdayData } = await supabase
        .from('task_completions')
        .select('id')
        .gte('completed_at', yesterdayStart.toISOString())
        .lt('completed_at', todayStart.toISOString());

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (completions) {
        const todayCompleted = completions.filter(c => 
          new Date(c.completed_at) >= todayStart
        ).length;

        const weekCompleted = completions.filter(c => 
          new Date(c.completed_at) >= weekStart
        ).length;

        const monthCompleted = completions.length;

        const todayChange = todayCompleted - (yesterdayData?.length || 0);

        setStats({
          todayCompleted,
          weekCompleted,
          monthCompleted,
          totalUsers: totalUsers || 0,
          todayChange,
          weekStreak: 0 // TODO: Calculate streak
        });

        // User stats
        if (user) {
          const myTodayCount = completions.filter(c => 
            c.user_id === user.id && new Date(c.completed_at) >= todayStart
          ).length;

          const myWeekCount = completions.filter(c => 
            c.user_id === user.id && new Date(c.completed_at) >= weekStart
          ).length;

          const myMonthCount = completions.filter(c => 
            c.user_id === user.id
          ).length;

          // Calculate rank
          const userCounts: Record<string, number> = {};
          completions.filter(c => new Date(c.completed_at) >= weekStart).forEach(c => {
            userCounts[c.user_id] = (userCounts[c.user_id] || 0) + 1;
          });
          const sorted = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);
          const myRank = sorted.findIndex(([uid]) => uid === user.id) + 1;

          setUserStats({
            myTodayCount,
            myWeekCount,
            myMonthCount,
            myRank: myRank || 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetchStats();

    // Realtime subscription
    const channel = supabase
      .channel('dashboard-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_completions'
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchStats]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <BarChart3 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Dashboard Cộng Đồng
            </h1>
            <p className="text-xs text-slate-500">
              {format(new Date(), "EEEE, dd/MM/yyyy")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Stats & My Progress */}
        <div className="lg:col-span-2 space-y-4">
          {/* Team Stats */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-slate-400" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Thống kê cộng đồng
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Hôm nay"
                value={stats.todayCompleted}
                icon={Zap}
                iconColor="text-amber-500"
                bgColor="bg-amber-50/50 dark:bg-amber-950/20"
                change={stats.todayChange}
              />
              <StatCard
                title="Tuần này"
                value={stats.weekCompleted}
                icon={Flame}
                iconColor="text-orange-500"
                bgColor="bg-orange-50/50 dark:bg-orange-950/20"
              />
              <StatCard
                title="Tháng này"
                value={stats.monthCompleted}
                icon={TrendingUp}
                iconColor="text-emerald-500"
                bgColor="bg-emerald-50/50 dark:bg-emerald-950/20"
              />
              <StatCard
                title="Thành viên"
                value={stats.totalUsers}
                icon={Users}
                iconColor="text-indigo-500"
                bgColor="bg-indigo-50/50 dark:bg-indigo-950/20"
              />
            </div>
          </div>

          {/* My Progress */}
          {user && (
            <div className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                      {profile?.full_name || 'Bạn'}
                    </h3>
                    <p className="text-[10px] text-slate-500">Tiến độ của bạn</p>
                  </div>
                </div>
                {userStats.myRank > 0 && (
                  <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                    <Trophy size={14} className="text-amber-600" />
                    <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                      #{userStats.myRank}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {userStats.myTodayCount}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Hôm nay</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                    {userStats.myWeekCount}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Tuần này</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {userStats.myMonthCount}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Tháng này</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Mục tiêu tuần: 50 task</span>
                  <span className="text-[10px] font-bold text-indigo-600">{Math.round((userStats.myWeekCount / 50) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((userStats.myWeekCount / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed (Extended) */}
          <div className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-orange-500" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Hoạt động gần đây
              </h2>
            </div>
            <ActivityFeed maxItems={10} />
          </div>
        </div>

        {/* Right Column - Leaderboard */}
        <div className="space-y-4">
          <Leaderboard />

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-amber-300" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                Tips hôm nay
              </span>
            </div>
            <p className="text-sm font-medium opacity-90">
              "Hoàn thành task LÀM NGAY trước 10h sáng giúp tăng năng suất 30%!"
            </p>
          </div>

          {/* Achievements Preview */}
          <div className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} className="text-amber-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Thành tựu sắp đạt
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Flame size={16} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Streak 7 ngày</p>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                    <div className="h-full w-3/4 bg-amber-500 rounded-full" />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400">5/7</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Target size={16} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">100 Task tháng</p>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                    <div className="h-full w-4/5 bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400">82/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}