"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { CheckCircle2, Zap, Flame, Trophy, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface CompletionActivity {
  id: string;
  user_id: string;
  task_title: string;
  completed_at: string;
  quadrant: string;
  user_name: string;
  user_avatar: string;
}

interface ActivityFeedProps {
  isCollapsed?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
}

const QUADRANT_EMOJIS: Record<string, string> = {
  'do_now': '🔥',
  'schedule': '📅',
  'delegate': '👥',
  'eliminate': '🗑️'
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  isCollapsed = false, 
  onViewAll,
  maxItems = 5 
}) => {
  const [activities, setActivities] = useState<CompletionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);
  const supabase = getSupabaseClient();

  const fetchActivities = useCallback(async () => {
    try {
      // Query task_completions với join users
      const { data, error } = await supabase
        .from('task_completions')
        .select(`
          id,
          user_id,
          task_title,
          completed_at,
          quadrant,
          users (
            full_name,
            avatar_url
          )
        `)
        .order('completed_at', { ascending: false })
        .limit(maxItems);

      if (error) {
        console.error('Error fetching activities:', error);
        // Fallback: query without join if foreign key issue
        const { data: fallbackData } = await supabase
          .from('task_completions')
          .select('*')
          .order('completed_at', { ascending: false })
          .limit(maxItems);
        
        if (fallbackData) {
          const mapped = fallbackData.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            task_title: item.task_title,
            completed_at: item.completed_at,
            quadrant: item.quadrant,
            user_name: 'User',
            user_avatar: ''
          }));
          setActivities(mapped);
        }
        return;
      }

      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          task_title: item.task_title,
          completed_at: item.completed_at,
          quadrant: item.quadrant,
          user_name: item.users?.full_name || 'Unknown',
          user_avatar: item.users?.avatar_url || ''
        }));
        setActivities(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('task-completions-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_completions'
        },
        (payload) => {
          console.log('New completion:', payload);
          setHasNew(true);
          fetchActivities();
          
          // Reset hasNew after animation
          setTimeout(() => setHasNew(false), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchActivities]);

  // Collapsed view - chỉ hiện icon với badge
  if (isCollapsed) {
    return (
      <div className="relative group">
        <button 
          onClick={onViewAll}
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <Zap size={20} className={cn(hasNew && "text-amber-500 animate-pulse")} />
          {hasNew && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </button>
        
        {/* Tooltip on hover */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-[200]">
          <div className="bg-slate-900 dark:bg-black text-white text-[11px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl">
            Activity Feed
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-3 mb-2">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Hoạt động
          </span>
          {hasNew && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full animate-pulse">
              MỚI
            </span>
          )}
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
          >
            Xem tất cả <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-1.5 px-1">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-[10px]">
            Chưa có hoạt động nào
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-2 p-2 rounded-lg transition-all",
                "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                index === 0 && hasNew && "bg-amber-50 dark:bg-amber-900/20 animate-in slide-in-from-top duration-500"
              )}
            >
              {/* Avatar */}
              {activity.user_avatar ? (
                <img 
                  src={activity.user_avatar} 
                  alt={activity.user_name}
                  className="w-6 h-6 rounded-full shrink-0 object-cover ring-2 ring-white dark:ring-slate-800"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shrink-0 text-[9px] font-bold">
                  {activity.user_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] leading-tight">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {activity.user_name?.split(' ').slice(-1)[0] || 'Ai đó'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400"> đã hoàn thành </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    công việc
                  </span>
                  <span className="ml-1">{QUADRANT_EMOJIS[activity.quadrant] || '✅'}</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {formatDistanceToNow(new Date(activity.completed_at), { 
                    addSuffix: true
                  })}
                </p>
              </div>

              {/* Check icon */}
              <CheckCircle2 size={12} className="text-green-500 shrink-0 mt-0.5" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;