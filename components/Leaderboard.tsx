"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { Trophy, Medal, Crown, TrendingUp, Calendar, CalendarDays, CalendarRange, Flame, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

type Period = 'day' | 'week' | 'month' | 'year';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_avatar: string;
  completion_count: number;
}

interface LeaderboardProps {
  className?: string;
}

const PERIOD_CONFIG: Record<Period, { label: string; icon: React.ComponentType<any> }> = {
  day: { label: 'Hôm nay', icon: Calendar },
  week: { label: 'Tuần này', icon: CalendarDays },
  month: { label: 'Tháng này', icon: CalendarRange },
  year: { label: 'Năm nay', icon: TrendingUp }
};

const RANK_STYLES = {
  1: {
    bg: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    text: 'text-amber-900',
    icon: Crown,
    iconColor: 'text-amber-600',
    ring: 'ring-4 ring-amber-300'
  },
  2: {
    bg: 'bg-gradient-to-r from-slate-300 to-gray-400',
    text: 'text-slate-700',
    icon: Medal,
    iconColor: 'text-slate-500',
    ring: 'ring-4 ring-slate-200'
  },
  3: {
    bg: 'bg-gradient-to-r from-orange-400 to-amber-600',
    text: 'text-orange-900',
    icon: Medal,
    iconColor: 'text-orange-600',
    ring: 'ring-4 ring-orange-200'
  }
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const supabase = getSupabaseClient();

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Query với group by và count
      const { data, error } = await supabase
        .from('task_completions')
        .select(`
          user_id,
          users!task_completions_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .gte('completed_at', startDate.toISOString());

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      // Group và count manually
      const userCounts: Record<string, { 
        user_id: string; 
        user_name: string; 
        user_avatar: string; 
        count: number 
      }> = {};

      data?.forEach((item: any) => {
        const userId = item.user_id;
        if (!userCounts[userId]) {
          userCounts[userId] = {
            user_id: userId,
            user_name: item.users?.full_name || 'Unknown',
            user_avatar: item.users?.avatar_url || '',
            count: 0
          };
        }
        userCounts[userId].count++;
      });

      // Sort và rank
      const sorted = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((item, index) => ({
          rank: index + 1,
          user_id: item.user_id,
          user_name: item.user_name,
          user_avatar: item.user_avatar,
          completion_count: item.count
        }));

      setEntries(sorted);

      // Find my rank
      if (user) {
        const myEntry = sorted.find(e => e.user_id === user.id);
        setMyRank(myEntry || null);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, period, user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_completions'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchLeaderboard]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className={cn("bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">
              Bảng Xếp Hạng
            </h3>
          </div>
          <Flame className="text-orange-500 animate-pulse" size={16} />
        </div>

        {/* Period Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(Object.keys(PERIOD_CONFIG) as Period[]).map((p) => {
            const config = PERIOD_CONFIG[p];
            const Icon = config.icon;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all",
                  period === p
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <Star className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-400 text-sm">Chưa có dữ liệu</p>
            <p className="text-slate-300 text-xs mt-1">Hoàn thành task để lên bảng!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-2 mb-4 min-h-[120px]">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex flex-col items-center w-20">
                  <div className="relative">
                    {top3[1].user_avatar ? (
                      <img 
                        src={top3[1].user_avatar} 
                        alt={top3[1].user_name}
                        className={cn("w-12 h-12 rounded-full object-cover", RANK_STYLES[2].ring)}
                      />
                    ) : (
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold", RANK_STYLES[2].bg, RANK_STYLES[2].text)}>
                        {top3[1].user_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow">
                      2
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-2 text-center truncate w-full">
                    {top3[1].user_name?.split(' ').slice(-1)[0]}
                  </p>
                  <p className="text-[9px] text-slate-400">{top3[1].completion_count} ✓</p>
                  <div className="h-12 w-full bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-t-lg mt-1" />
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="flex flex-col items-center w-24 -mb-2">
                  <Crown className="text-amber-500 mb-1 animate-bounce" size={20} />
                  <div className="relative">
                    {top3[0].user_avatar ? (
                      <img 
                        src={top3[0].user_avatar} 
                        alt={top3[0].user_name}
                        className={cn("w-14 h-14 rounded-full object-cover", RANK_STYLES[1].ring)}
                      />
                    ) : (
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold", RANK_STYLES[1].bg, RANK_STYLES[1].text)}>
                        {top3[0].user_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                      1
                    </div>
                  </div>
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 mt-2 text-center truncate w-full">
                    {top3[0].user_name?.split(' ').slice(-1)[0]}
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold">{top3[0].completion_count} ✓</p>
                  <div className="h-16 w-full bg-gradient-to-t from-amber-400 to-yellow-300 dark:from-amber-600 dark:to-yellow-500 rounded-t-lg mt-1" />
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex flex-col items-center w-20">
                  <div className="relative">
                    {top3[2].user_avatar ? (
                      <img 
                        src={top3[2].user_avatar} 
                        alt={top3[2].user_name}
                        className={cn("w-11 h-11 rounded-full object-cover", RANK_STYLES[3].ring)}
                      />
                    ) : (
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-base font-bold", RANK_STYLES[3].bg, RANK_STYLES[3].text)}>
                        {top3[2].user_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow">
                      3
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-2 text-center truncate w-full">
                    {top3[2].user_name?.split(' ').slice(-1)[0]}
                  </p>
                  <p className="text-[9px] text-slate-400">{top3[2].completion_count} ✓</p>
                  <div className="h-8 w-full bg-gradient-to-t from-orange-400 to-amber-300 dark:from-orange-600 dark:to-amber-500 rounded-t-lg mt-1" />
                </div>
              )}
            </div>

            {/* Rest of Rankings */}
            {rest.length > 0 && (
              <div className="space-y-1.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {rest.map((entry) => (
                  <div 
                    key={entry.user_id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-xl transition-all",
                      entry.user_id === user?.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <span className="w-6 text-center text-[11px] font-black text-slate-400">
                      #{entry.rank}
                    </span>
                    {entry.user_avatar ? (
                      <img 
                        src={entry.user_avatar} 
                        alt={entry.user_name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {entry.user_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {entry.user_name}
                      {entry.user_id === user?.id && (
                        <span className="ml-1 text-[9px] text-indigo-600 font-bold">(Bạn)</span>
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {entry.completion_count} <span className="text-green-500">✓</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* My Rank (if not in top 10) */}
            {user && !myRank && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-center text-[10px] text-slate-400">
                  Bạn chưa có trong bảng xếp hạng. Hoàn thành task để lên top!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
