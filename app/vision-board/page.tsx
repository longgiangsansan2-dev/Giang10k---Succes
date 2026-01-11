"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, Plus, Loader2, Trash2, Edit3, X, CheckCircle2, 
  ChevronDown, ChevronUp, Quote
} from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { VisionGoal, VisionCategory, VISION_CATEGORY_UI } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function VisionBoardPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<VisionGoal | null>(null);
  const [formCategory, setFormCategory] = useState<VisionCategory>(VisionCategory.FINANCE);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<VisionCategory>>(new Set());
  const [statement, setStatement] = useState('');
  const [editingStatement, setEditingStatement] = useState(false);
  const [statementDraft, setStatementDraft] = useState('');

  const supabase = getSupabaseClient();

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('vision_goals').select('*').eq('user_id', user.id).order('order_index', { ascending: true });
    if (!error && data) {
      setGoals(data.map((g: any) => ({
        id: g.id, category: g.category, title: g.title, description: g.description,
        isCompleted: g.is_completed, orderIndex: g.order_index, createdAt: g.created_at, updatedAt: g.updated_at
      })));
    }
    setLoading(false);
  }, [supabase, user]);

  const fetchStatement = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('vision_statement').select('*').eq('user_id', user.id).single();
    if (data) setStatement(data.content || '');
  }, [supabase, user]);

  useEffect(() => { if (user) { fetchGoals(); fetchStatement(); } }, [fetchGoals, fetchStatement, user]);

  const toggleCategory = (category: VisionCategory) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const openAddModal = (category: VisionCategory) => {
    setEditingGoal(null); setFormCategory(category); setFormTitle(''); setFormDescription(''); setShowModal(true);
  };

  const handleSaveGoal = async () => {
    if (!formTitle.trim() || !user) return;
    setSaving(true);
    const payload = { category: formCategory, title: formTitle.trim(), description: formDescription.trim() || null };
    if (editingGoal) await supabase.from('vision_goals').update({...payload, updated_at: new Date().toISOString()}).eq('id', editingGoal.id);
    else await supabase.from('vision_goals').insert({...payload, is_completed: false, order_index: goals.length, user_id: user.id});
    await fetchGoals(); setShowModal(false); setSaving(false);
  };

  const overallProgress = goals.length > 0 ? Math.round((goals.filter(g => g.isCompleted).length / goals.length) * 100) : 0;

  if (loading && goals.length === 0) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 overflow-y-auto lg:overflow-hidden min-h-0">
      <aside className="w-full lg:w-[320px] shrink-0 bg-white dark:bg-[#1c1c1c] border-b lg:border-r border-slate-100 dark:border-slate-800 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 lg:overflow-y-auto no-scrollbar">
        <div className="space-y-2 sm:space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest"><Target size={10} /> Board 2026</div>
          <h1 className="hidden lg:block text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Vision Board</h1>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-lg sm:text-xl font-black text-indigo-600">{overallProgress}%</p>
              <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">Tiến độ</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">{goals.filter(g => g.isCompleted).length}/{goals.length}</p>
              <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">Mục tiêu</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Quote size={10} /> Sứ mệnh</h3>{!editingStatement && <button onClick={() => { setStatementDraft(statement); setEditingStatement(true); }} className="text-indigo-500 text-[8px] sm:text-[9px] font-black uppercase">Sửa</button>}</div>
          {editingStatement ? (
            <div className="space-y-2"><textarea value={statementDraft} onChange={e => setStatementDraft(e.target.value)} rows={4} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-xs focus:ring-2 ring-indigo-500 outline-none" /><div className="flex gap-2"><button onClick={() => setEditingStatement(false)} className="flex-1 py-1.5 bg-slate-100 text-[8px] font-black uppercase rounded-lg">Hủy</button><button onClick={async () => { await supabase.from('vision_statement').upsert({content: statementDraft, user_id: user!.id}); setStatement(statementDraft); setEditingStatement(false); }} className="flex-1 py-1.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg">Lưu</button></div></div>
          ) : (
            <div className="italic text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-indigo-50/50 dark:bg-indigo-900/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-indigo-100 dark:border-indigo-900/30">{statement || "Viết sứ mệnh năm 2026..."}</div>
          )}
        </div>
      </aside>

      <main className="flex-1 h-full lg:overflow-y-auto custom-scrollbar p-3 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-8 pb-24">
          {(Object.keys(VISION_CATEGORY_UI) as VisionCategory[]).map(cat => {
            const ui = VISION_CATEGORY_UI[cat];
            const catGoals = goals.filter(g => g.category === cat);
            const isCollapsed = collapsedCategories.has(cat);
            return (
              <div key={cat} className={cn("rounded-2xl sm:rounded-[2rem] border-2 overflow-hidden bg-white dark:bg-[#1c1c1c] transition-all flex flex-col", ui.color)}>
                <div className="p-4 sm:p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleCategory(cat)}>
                  <div className="flex items-center gap-2 sm:gap-3"><span className="text-xl sm:text-2xl">{ui.icon}</span><div><h3 className={cn("font-black text-[10px] sm:text-xs uppercase tracking-wider", ui.textColor)}>{ui.label}</h3><p className="text-[8px] sm:text-[9px] font-bold text-slate-400">{catGoals.length} mục tiêu</p></div></div>
                  <div className="flex items-center gap-1.5 sm:gap-2"><button onClick={(e) => { e.stopPropagation(); openAddModal(cat); }} className="p-1 sm:p-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg"><Plus size={12}/></button>{isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</div>
                </div>
                {!isCollapsed && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-1.5 sm:space-y-2">
                    {catGoals.length === 0 ? <div className="py-4 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800"><p className="text-[7px] font-black text-slate-300 uppercase">Trống</p></div> : catGoals.map(goal => (
                      <div key={goal.id} className={cn("bg-slate-50 dark:bg-slate-900 p-2 sm:p-3 rounded-lg sm:rounded-xl flex items-start gap-2 transition-all", goal.isCompleted && "opacity-50")}>
                        <button onClick={async () => { await supabase.from('vision_goals').update({is_completed: !goal.isCompleted}).eq('id', goal.id); fetchGoals(); }} className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5", goal.isCompleted ? "bg-green-500 border-green-500 text-white" : "border-slate-300")}>{goal.isCompleted && <CheckCircle2 size={10} />}</button>
                        <div className="flex-1 min-w-0" onClick={() => { setEditingGoal(goal); setFormCategory(goal.category); setFormTitle(goal.title); setFormDescription(goal.description || ''); setShowModal(true); }}><p className={cn("text-[10px] sm:text-[11px] font-bold leading-snug truncate", goal.isCompleted ? "line-through text-slate-500" : "text-slate-800 dark:text-slate-200")}>{goal.title}</p></div>
                        <button onClick={async () => { if(confirm('Xóa?')) { await supabase.from('vision_goals').delete().eq('id', goal.id); fetchGoals(); } }} className="p-0.5 text-slate-300 hover:text-red-500"><Trash2 size={10}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-2xl w-full max-w-sm p-5 sm:p-6 space-y-4 animate-in zoom-in-95">
             <h3 className="text-base font-black uppercase">{editingGoal ? 'Sửa' : 'Thêm'} mục tiêu</h3>
             <div className="space-y-3">
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Tên mục tiêu..." className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 ring-indigo-500 outline-none" />
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} placeholder="Mô tả..." className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-xs focus:ring-2 ring-indigo-500 outline-none" />
             </div>
             <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-100 text-[10px] font-black uppercase rounded-lg">Hủy</button>
                <button onClick={handleSaveGoal} disabled={saving || !formTitle.trim()} className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Lưu</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}