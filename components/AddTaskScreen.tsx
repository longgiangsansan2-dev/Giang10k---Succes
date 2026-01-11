import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { TaskQuadrant, QUADRANT_UI, JournalPost } from '../types';
import { getSupabaseClient } from '../lib/supabase/client';
import { PlusCircle, CheckCircle2, Loader2, Clock, BookText, AlignLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TagSelector } from './TagSelector';

interface AddTaskScreenProps {
  onTaskAdded: () => void;
}

const AddTaskScreen: React.FC<AddTaskScreenProps> & { TagSelectorWrapper: React.FC<any> } = ({ onTaskAdded }) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [linkedPostId, setLinkedPostId] = useState<string | null>(null);
  const [tagId, setTagId] = useState<string | null>(null);
  const [journalPosts, setJournalPosts] = useState<JournalPost[]>([]);
  const [selectedQuadrant, setSelectedQuadrant] = useState<TaskQuadrant>(TaskQuadrant.DO_NOW);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const supabase = getSupabaseClient();

  const fetchJournalPosts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('journal_post')
      .select('id, title, topic_id, journal_topic(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setJournalPosts(data);
  }, [supabase, user]);

  useEffect(() => { fetchJournalPosts(); }, [fetchJournalPosts]);

  const handleAdd = async () => {
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) return;
    
    if (!user) {
      setError("Phiên đăng nhập hết hạn, vui lòng load lại trang.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Lấy order_index cao nhất hiện tại
      const { data: lastTask } = await supabase
        .from('daily_task')
        .select('order_index')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('quadrant', selectedQuadrant)
        .order('order_index', { ascending: false })
        .limit(1);
      
      const nextOrder = (lastTask && lastTask.length > 0) ? (lastTask[0].order_index + 1) : 1;
      
      const { error: insertError } = await supabase.from('daily_task').insert([{ 
        user_id: user.id, // BẮT BUỘC cho RLS
        title: trimmedTitle, 
        description: (description || '').trim() || null,
        date: today, 
        quadrant: selectedQuadrant, 
        deadline_at: deadline ? new Date(deadline).toISOString() : null, 
        order_index: nextOrder,
        linked_post_id: linkedPostId,
        tag_id: tagId,
        status: 'pending'
      }]);

      if (insertError) {
        throw insertError;
      }

      // Reset form
      setTitle(''); 
      setDescription(''); 
      setDeadline(''); 
      setLinkedPostId(null); 
      setTagId(null);
      setShowToast(true); 
      setTimeout(() => setShowToast(false), 2000);
      setIsExpanded(false);
      onTaskAdded(); 
      inputRef.current?.focus();
    } catch (err: any) { 
      console.error("Error adding task:", err);
      setError(err.message || "Không thể thêm nhiệm vụ. Kiểm tra lại quyền Database.");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e1f20] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-[#333537] space-y-3.5 transition-all">
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nhiệm vụ mới</label>
            {profile?.role === 'user' && <span className="text-[9px] font-bold text-indigo-500 uppercase">Personal</span>}
          </div>
          <input 
            ref={inputRef} type="text" 
            value={title || ''} onChange={(e) => setTitle(e.target.value)} 
            onFocus={() => setIsExpanded(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
            className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#3c4043] rounded-lg py-2.5 px-3.5 outline-none focus:ring-2 ring-indigo-500 text-sm font-medium" 
            placeholder="Bạn cần làm gì?" disabled={loading} 
          />
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-start gap-2 animate-in fade-in zoom-in-95">
            <ShieldAlert size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 leading-tight">{error}</p>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <TagSelector 
              category="task"
              showCreateOption={true}
              selectedTagIds={tagId ? [tagId] : []} 
              onSelect={(ids) => setTagId(ids.length > 0 ? ids[ids.length - 1] : null)} 
            />

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5 tracking-widest flex items-center gap-1">
                <AlignLeft size={10} /> Mô tả
              </label>
              <textarea 
                value={description || ''} onChange={(e) => setDescription(e.target.value)} 
                rows={2}
                className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#3c4043] rounded-lg py-2 px-3.5 outline-none focus:ring-2 ring-indigo-500 text-[13px] font-medium resize-none" 
                placeholder="Chi tiết..." disabled={loading} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5 tracking-widest flex items-center gap-1">
                <Clock size={10} /> Hạn chót
              </label>
              <input 
                type="datetime-local" 
                value={deadline || ''} onChange={(e) => setDeadline(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#3c4043] rounded-lg py-2 px-3.5 outline-none focus:ring-2 ring-indigo-500 text-xs font-bold" 
                disabled={loading} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-0.5 tracking-widest flex items-center gap-1">
                <BookText size={10} /> Liên kết Note
              </label>
              <select value={linkedPostId || ''} onChange={e => setLinkedPostId(e.target.value || null)} className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#3c4043] rounded-lg py-2 px-3 outline-none focus:ring-2 ring-indigo-500 text-[11px] font-bold">
                <option value="">-- Không liên kết --</option>
                {journalPosts.map(p => <option key={p.id} value={p.id}>[{(p as any).journal_topic?.name}] {p.title || 'Ghi chép'}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {(Object.keys(QUADRANT_UI) as TaskQuadrant[]).map((quad) => {
          const isSelected = selectedQuadrant === quad;
          const config = QUADRANT_UI[quad];
          return (
            <button key={quad} onClick={() => setSelectedQuadrant(quad)} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-50 dark:border-[#3c4043] bg-white dark:bg-[#1e1f20]'}`}>
              <span className={`h-2 w-2 rounded-full shrink-0 ${config.dot}`} />
              <span className={`text-[10px] font-bold uppercase tracking-tight ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{config.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {isExpanded && (
          <button onClick={() => { setIsExpanded(false); setError(null); }} className="px-4 py-2.5 bg-slate-100 dark:bg-[#3c4043] text-slate-600 dark:text-slate-300 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-slate-200 transition-all">
            Hủy
          </button>
        )}
        <button onClick={handleAdd} disabled={!(title || '').trim() || loading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 uppercase text-[10px] tracking-wider shadow-md active:scale-[0.98]">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />} {isExpanded ? 'Thêm nhiệm vụ' : 'Thêm'}
        </button>
      </div>

      {showToast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300 z-[100]"><CheckCircle2 size={16} className="text-green-400" /><span className="text-[11px] font-bold uppercase tracking-wider">Đã thêm thành công!</span></div>}
    </div>
  );
};

AddTaskScreen.TagSelectorWrapper = ({ category, selectedTagId, onSelect }: any) => (
  <TagSelector 
    category={category}
    showCreateOption={true}
    selectedTagIds={selectedTagId ? [selectedTagId] : []} 
    onSelect={(ids) => onSelect(ids.length > 0 ? ids[ids.length - 1] : null)}
  />
);

export default AddTaskScreen;