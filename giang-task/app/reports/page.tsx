
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Zap, Clock, Calendar, LayoutGrid, Loader2, RefreshCw, X, CheckCircle2, Circle } from 'lucide-react';
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
  
  // State cho Modal chi tiết ngày
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
      console.error("Lỗi tải báo cáo:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // Handle Refresh from Header
  useEffect(() => {
    const handleGlobalRefresh = () => fetchData();
    window.addEventListener('giang:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('giang:refresh', handleGlobalRefresh);
  }, [fetchData]);

  // Sync status to Header
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('giang:status', { 
      detail: { refreshing, lastRefresh } 
    }));
  }, [refreshing, lastRefresh]);

  // Khởi tạo và Auto Refresh mỗi 5 phút
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Tải chi tiết công việc cho Modal
  const handleViewDetails = async (date: string) => {
    setSelectedDate(date);
    setLoadingDayTasks(true);
    const supabase = getSupabaseClient();
    try {
      // Query tasks có deadline trong ngày đó HOẶC date = ngày đó và deadline = null
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
    } catch (err) {
      console.error("Lỗi tải chi tiết ngày:", err);
    } finally {
      setLoadingDayTasks(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center dark:bg-slate-950">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-10 pb-24 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Báo cáo hiệu suất</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">Dựa trên thời hạn (Deadline) công việc</p>
        </div>
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          {['today', 'week', 'month', 'year'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}>
              {f === 'today' ? 'Hôm nay' : f === 'week' ? 'Tuần này' : f === 'month' ? 'Tháng này' : 'Năm nay'}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Hoàn thành', value: `${data.doneCount}/${data.total}`, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Hiệu suất', value: `${data.efficiency}%`, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Trọng tâm', value: data.focus !== "--" ? QUADRANT_UI[data.focus as TaskQuadrant]?.label : "--", icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Dòng thời gian', value: filter.toUpperCase(), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${card.bg} ${card.color}`}><card.icon size={24}/></div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3"><TrendingUp size={24} className="text-indigo-500"/> Tiến độ thực hiện</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: 'rgba(79, 70, 229, 0.05)'}} contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#1e293b', color: '#f1f5f9', padding: '15px' }} />
                <Bar dataKey="done" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3"><LayoutGrid size={24} className="text-indigo-500"/> Phân bổ Ma trận</h3>
          <div className="flex-1 min-h-[350px]">
            {data.doneCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.matrixData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                    {data.matrixData.map((e: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '20px', padding: '15px' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 italic font-bold">Chưa có dữ liệu hoàn thành</div>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800"><h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3"><Calendar size={24} className="text-indigo-500"/> Lịch sử ngày (Theo Deadline)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <tr><th className="px-8 py-5">Ngày</th><th className="px-8 py-5">Hoàn thành</th><th className="px-8 py-5">Tỉ lệ</th><th className="px-8 py-5">Hành động</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.history.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5 font-black text-slate-700 dark:text-slate-200 text-base">{row.date}</td>
                  <td className="px-8 py-5 text-slate-500 dark:text-slate-400 text-sm font-bold">{row.count}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${row.rate}%` }}></div>
                      </div>
                      <span className="text-xs font-black text-indigo-600">{row.rate}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleViewDetails(row.date)}
                      className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT NGÀY */}
      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedDate(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Chi tiết: {selectedDate}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Danh sách công việc dựa trên Deadline</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><X size={24} className="text-slate-400" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {loadingDayTasks ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40"><Loader2 className="animate-spin text-indigo-500 mb-4" size={32} /><p className="text-xs font-black uppercase tracking-widest">Đang tải...</p></div>
              ) : dayTasks.length === 0 ? (
                <div className="text-center py-20 opacity-40 italic font-bold">Không tìm thấy dữ liệu cho ngày này.</div>
              ) : (
                dayTasks.map(task => {
                  const ui = QUADRANT_UI[task.quadrant];
                  const isDone = task.status === TaskStatus.DONE;
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className={cn("shrink-0", isDone ? "text-green-500" : "text-slate-300")}>
                        {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-bold truncate", isDone && "line-through opacity-40")}>{task.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                           <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter", ui.color)}>
                            {ui.label}
                           </span>
                           {task.deadlineAt && (
                             <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                               <Clock size={10} /> {format(new Date(task.deadlineAt), 'HH:mm')}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
               <button onClick={() => setSelectedDate(null)} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
