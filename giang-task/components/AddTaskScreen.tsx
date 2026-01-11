import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { TaskQuadrant, QUADRANT_UI, JournalPost } from '../types';
import { getSupabaseClient } from '../lib/supabase/client';
import { PlusCircle, CheckCircle2, Loader2, ShieldAlert, Clock, BookText, AlignLeft } from 'lucide-react';

interface AddTaskScreenProps {
  onTaskAdded: () => void;
}

const AddTaskScreen: React.FC<AddTaskScreenProps> = ({ onTaskAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [linkedPostId, setLinkedPostId] = useState<string | null>(null);
  const [journalPosts, setJournalPosts] = useState<JournalPost[]>([]);
  const [selectedQuadrant, setSelectedQuadrant] = useState<TaskQuadrant>(TaskQuadrant.DO_NOW);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const supabase = getSupabaseClient();

  const fetchJournalPosts = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from('journal_post')
      .select('id, title, topic_id, journal_topic(name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setJournalPosts(data);
  }, [supabase]);

  useEffect(() => {
    fetchJournalPosts();
  }, [fetchJournalPosts]);

  const handleAdd = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setLoading(true);
    setErrorDetails(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Vui lòng đăng nhập lại");
      const userId = session.user.id;

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: lastTask } = await supabase
        .from('daily_task')
        .select('order_index')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('quadrant', selectedQuadrant)
        .order('order_index', { ascending: false })
        .limit(1);
      
      const nextOrder = (lastTask && lastTask.length > 0) ? (lastTask[0].order_index + 1) : 1;
      
      const { error: insertError } = await supabase.from('daily_task').insert([{ 
        user_id: userId,
        title: trimmedTitle, 
        description: description.trim() || null,
        date: today, 
        quadrant: selectedQuadrant, 
        deadline_at: deadline ? new Date(deadline).toISOString() : null, 
        order_index: nextOrder,
        linked_post_id: linkedPostId,
        status: 'pending'
      }]);

      if (insertError) { 
        setErrorDetails(insertError); 
      } else {
        setTitle(''); 
        setDescription('');
        setDeadline(''); 
        setLinkedPostId(null);
        setShowToast(true); 
        setTimeout(() => setShowToast(false), 2000);
        setIsExpanded(false);
        onTaskAdded(); 
        inputRef.current?.focus();
      }
    } catch (err: any) { 
      setErrorDetails({ message: err.message || "Lỗi thêm nhiệm vụ" }); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="bg-white dark:bg-[#1c1c1c] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-[#333] space-y-4 transition-all">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nhiệm vụ mới</label>
          <input 
            ref={inputRef} 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            onFocus={() => setIsExpanded(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
            className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 ring-indigo-500 text-sm font-bold" 
            placeholder="Bạn cần làm gì?" 
            disabled={loading} 
          />
        </div>

        {isExpanded && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest flex items-center gap-1">
                <AlignLeft size={12} /> Mô tả
              </label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={2}
                className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 ring-indigo-500 text-xs font-medium resize-none" 
                placeholder="Thêm mô tả chi tiết..." 
                disabled={loading} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest flex items-center gap-1">
                <BookText size={12} /> Liên kết ghi chú
              </label>
              <select 
                value={linkedPostId || ''} 
                onChange={(e) => setLinkedPostId(e.target.value || null)}
                className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 ring-indigo-500 text-xs font-bold"
                disabled={loading}
              >
                <option value="">-- Không liên kết --</option>
                {journalPosts.map(p => (
                  <option key={p.id} value={p.id}>[{(p as any).journal_topic?.name}] {p.title || 'Không tiêu đề'}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest flex items-center gap-1">
                <Clock size={12} /> Hạn chót
              </label>
              <input 
                type="datetime-local" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 ring-indigo-500 text-[13px] font-bold" 
                disabled={loading} 
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(QUADRANT_UI) as TaskQuadrant[]).map((quad) => {
          const isSelected = selectedQuadrant === quad;
          const config = QUADRANT_UI[quad];
          return (
            <button key={quad} onClick={() => setSelectedQuadrant(quad)} className={`flex flex-col p-2.5 rounded-xl border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-50 dark:border-[#404040] bg-white dark:bg-[#1c1c1c]'}`}>
              <div className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${config.dot}`} /><span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>{config.label}</span></div>
            </button>
          );
        })}
      </div>

      {errorDetails && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2"><ShieldAlert size={16} /> {errorDetails.message}</div>}
      
      <div className="flex gap-2">
        {isExpanded && (
          <button onClick={() => setIsExpanded(false)} className="px-4 py-3.5 bg-slate-100 dark:bg-[#333] text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">
            Hủy
          </button>
        )}
        <button onClick={handleAdd} disabled={!title.trim() || loading} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 uppercase text-[11px] tracking-widest shadow-md">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />} {isExpanded ? 'Thêm nhiệm vụ' : 'Thêm'}
        </button>
      </div>

      {showToast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce z-[100]"><CheckCircle2 size={18} className="text-green-400" /><span className="text-xs font-black uppercase">Thành công!</span></div>}
    </div>
  );
};

export default AddTaskScreen;