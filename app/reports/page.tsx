"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, Target, Zap, Clock, Calendar, LayoutGrid, Loader2, X, CheckCircle2, Circle } from 'lucide-react';
import { TaskQuadrant, QUADRANT_UI, TaskStatus, DailyTask } from '../../types';
import { getReportData } from '../../actions/report-actions';
import { getSupabaseClient } from '../../lib/supabase/client';
import { format } from 'date-fns';

const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#64748b'];

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function ReportsPage() {
  const [filter, setFilter] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayTasks, setDayTasks] = useState<DailyTask[]>([]);
  const [loadingDayTasks, setLoadingDayTasks] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await getReportData(filter);
      setData(res);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    const handleGlobalRefresh = () => fetchData();
    window.addEventListener('giang:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('giang:refresh', handleGlobalRefresh);
  }, [fetchData]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('giang:status', { detail: { refreshing, lastRefresh } }));
  }, [refreshing, lastRefresh]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetails = async (date: string) => {
    setSelectedDate(date);
    setLoadingDayTasks(true);
    const supabase = getSupabaseClient();
    try {
      const { data: tasks, error } = await supabase
        .from('daily_task')
        .select('*')
        .or(`deadline_at.gte.${date}T00:00:00,and(deadline_at.is.null,date.eq.${date})`)
        .order('status', { ascending: false });

      if (!error && tasks) {
        setDayTasks(tasks.map((t: any) => ({
          id: t.id,
          date: t.date,
          title: t.title,
          quadrant: t.quadrant,
          status: t.status as TaskStatus,
          orderIndex: t.order_index,
          deadlineAt: t.deadline_at,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        })));
      }
    } catch (err) {} finally { setLoadingDayTasks(false); }
  };

  if (loading && !data) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scrollbar">
      <div className="p-3 sm:p-8 max-w-6xl mx-auto w-full space-y-4 sm:space-y-10 pb-24">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Hiệu suất</h1>
          </div>
          <div className="flex bg-white dark:bg-[#1c1c1c] p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {['today', 'week', 'month', 'year'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 sm:flex-none px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold capitalize transition-all", filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50')}>
                {f === 'today' ? 'Ngày' : f === 'week' ? 'Tuần' : f === 'month' ? 'Tháng' : 'Năm'}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
          {[
            { label: 'Hoàn thành', value: `${data.doneCount}/${data.total}`, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Hiệu suất', value: `${data.efficiency}%`, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Trọng tâm', value: data.focus !== "--" ? QUADRANT_UI[data.focus as TaskQuadrant]?.label : "--", icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Kỳ báo cáo', value: filter.toUpperCase(), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-[#1c1c1c] p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2 sm:gap-5">
              <div className={`p-2 sm:p-4 rounded-xl ${card.bg} ${card.color} dark:bg-slate-800/50 hidden xs:block`}><card.icon size={16} className="sm:size-6"/></div>
              <div>
                <p className="text-[8px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-sm sm:text-2xl font-black text-slate-800 dark:text-slate-100 truncate">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-8">
          <div className="bg-white dark:bg-[#1c1c1c] p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sm:mb-8 flex items-center gap-2"><TrendingUp size={16} className="text-indigo-500"/> Tiến độ thực hiện</h3>
            <div className="h-[200px] sm:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.progressData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#f1f5f9', padding: '8px', fontSize: '10px' }} />
                  <Bar dataKey="done" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c1c1c] p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
            <h3 className="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 sm:mb-8 flex items-center gap-2"><LayoutGrid size={16} className="text-indigo-500"/> Ma trận</h3>
            <div className="flex-1 min-h-[200px] sm:min-h-[350px]">
              {data.doneCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.matrixData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                      {data.matrixData.map((e: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', padding: '8px', fontSize: '10px' }} />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '10px', fontSize: '9px', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 italic font-bold text-[10px]">Chưa có dữ liệu</div>}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-8 border-b border-slate-50 dark:border-slate-800"><h3 className="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-100">Lịch sử</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[8px] sm:text-[10px] tracking-widest">
                <tr><th className="px-4 py-3 sm:px-8 sm:py-5">Ngày</th><th className="px-4 py-3 sm:px-8 sm:py-5">Tỉ lệ</th><th className="px-4 py-3 sm:px-8 sm:py-5 text-right">Xem</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {data.history.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 sm:px-8 sm:py-5 font-black text-slate-700 dark:text-slate-200 text-xs sm:text-base">{row.date}</td>
                    <td className="px-4 py-3 sm:px-8 sm:py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 sm:w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${row.rate}%` }}></div>
                        </div>
                        <span className="text-[9px] font-black text-indigo-600">{row.rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-8 sm:py-5 text-right">
                      <button onClick={() => handleViewDetails(row.date)} className="p-1.5 sm:px-5 sm:py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase">Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-2xl sm:rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-xl font-black uppercase tracking-tighter">{selectedDate}</h3>
              </div>
              <button onClick={() => setSelectedDate(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-2">
              {loadingDayTasks ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-40"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
              ) : (
                dayTasks.map(task => {
                  const ui = QUADRANT_UI[task.quadrant];
                  const isDone = task.status === TaskStatus.DONE;
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className={cn("shrink-0", isDone ? "text-green-500" : "text-slate-300")}>{isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}</div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[11px] font-bold truncate", isDone && "line-through opacity-40")}>{task.title}</p>
                        <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter", ui.color)}>{ui.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
               <button onClick={() => setSelectedDate(null)} className="w-full sm:w-auto px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-md">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}