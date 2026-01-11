"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, Plus, Loader2, Trash2, Edit3, X, CheckCircle2, 
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { VisionGoal, VisionCategory, VISION_CATEGORY_UI } from '../../types';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function VisionBoardPage() {
  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Add/Edit modal states
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<VisionGoal | null>(null);
  const [formCategory, setFormCategory] = useState<VisionCategory>(VisionCategory.FINANCE);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  
  // Collapse states for categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<VisionCategory>>(new Set());

  // Personal Statement
  const [statement, setStatement] = useState('');
  const [editingStatement, setEditingStatement] = useState(false);
  const [statementDraft, setStatementDraft] = useState('');

  const supabase = getSupabaseClient();

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vision_goals')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (!error && data) {
      setGoals(data.map((g: any) => ({
        id: g.id,
        category: g.category,
        title: g.title,
        description: g.description,
        isCompleted: g.is_completed,
        orderIndex: g.order_index,
        createdAt: g.created_at,
        updatedAt: g.updated_at
      })));
    }
    setLoading(false);
  }, [supabase]);

  const fetchStatement = useCallback(async () => {
    const { data, error } = await supabase
      .from('vision_statement')
      .select('*')
      .single();
    
    if (!error && data) {
      setStatement(data.content || '');
    }
  }, [supabase]);

  useEffect(() => {
    fetchGoals();
    fetchStatement();
  }, [fetchGoals, fetchStatement]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchGoals();
      fetchStatement();
    };
    window.addEventListener('giang:refresh', handleRefresh);
    return () => window.removeEventListener('giang:refresh', handleRefresh);
  }, [fetchGoals, fetchStatement]);

  const toggleCategory = (category: VisionCategory) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const openAddModal = (category: VisionCategory) => {
    setEditingGoal(null);
    setFormCategory(category);
    setFormTitle('');
    setFormDescription('');
    setShowModal(true);
  };

  const openEditModal = (goal: VisionGoal) => {
    setEditingGoal(goal);
    setFormCategory(goal.category);
    setFormTitle(goal.title);
    setFormDescription(goal.description || '');
    setShowModal(true);
  };

  const handleSaveGoal = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);

    if (editingGoal) {
      // Update existing
      const { error } = await supabase
        .from('vision_goals')
        .update({
          category: formCategory,
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingGoal.id);

      if (!error) {
        await fetchGoals();
        setShowModal(false);
      }
    } else {
      // Create new
      const maxOrder = goals.filter(g => g.category === formCategory).length;
      const { error } = await supabase
        .from('vision_goals')
        .insert({
          category: formCategory,
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          is_completed: false,
          order_index: maxOrder
        });

      if (!error) {
        await fetchGoals();
        setShowModal(false);
      }
    }
    setSaving(false);
  };

  const handleToggleComplete = async (goal: VisionGoal) => {
    const { error } = await supabase
      .from('vision_goals')
      .update({ 
        is_completed: !goal.isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', goal.id);

    if (!error) {
      setGoals(prev => prev.map(g => 
        g.id === goal.id ? { ...g, isCompleted: !g.isCompleted } : g
      ));
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục tiêu này?')) return;
    
    const { error } = await supabase
      .from('vision_goals')
      .delete()
      .eq('id', goalId);

    if (!error) {
      setGoals(prev => prev.filter(g => g.id !== goalId));
    }
  };

  const handleSaveStatement = async () => {
    setSaving(true);
    
    // Check if statement exists
    const { data: existing } = await supabase
      .from('vision_statement')
      .select('id')
      .single();

    if (existing) {
      await supabase
        .from('vision_statement')
        .update({ content: statementDraft, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('vision_statement')
        .insert({ content: statementDraft });
    }

    setStatement(statementDraft);
    setEditingStatement(false);
    setSaving(false);
  };

  const getGoalsByCategory = (category: VisionCategory) => {
    return goals.filter(g => g.category === category);
  };

  const getProgress = (category: VisionCategory) => {
    const categoryGoals = getGoalsByCategory(category);
    if (categoryGoals.length === 0) return 0;
    const completed = categoryGoals.filter(g => g.isCompleted).length;
    return Math.round((completed / categoryGoals.length) * 100);
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.isCompleted).length;
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
            <Target size={18} />
            Vision Board 2026
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ngày lập: 01/01/2026
          </p>
          
          {/* Progress Overview */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-3xl font-black text-indigo-600">{overallProgress}%</div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hoàn thành</div>
            </div>
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <div className="text-3xl font-black text-slate-800 dark:text-white">{completedGoals}/{totalGoals}</div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mục tiêu</div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(VISION_CATEGORY_UI) as VisionCategory[]).map(category => {
            const ui = VISION_CATEGORY_UI[category];
            const categoryGoals = getGoalsByCategory(category);
            const progress = getProgress(category);
            const isCollapsed = collapsedCategories.has(category);

            return (
              <div 
                key={category}
                className={cn(
                  "rounded-3xl border-2 overflow-hidden transition-all",
                  ui.color
                )}
              >
                {/* Category Header */}
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ui.icon}</span>
                    <div>
                      <h3 className={cn("font-black text-sm uppercase tracking-wider", ui.textColor)}>
                        {ui.label}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                        {categoryGoals.filter(g => g.isCompleted).length}/{categoryGoals.length} hoàn thành
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Progress Ring */}
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${progress} 100`}
                          className={ui.textColor}
                        />
                      </svg>
                      <span className={cn("absolute inset-0 flex items-center justify-center text-[10px] font-black", ui.textColor)}>
                        {progress}%
                      </span>
                    </div>
                    
                    {isCollapsed ? (
                      <ChevronDown size={20} className="text-slate-400" />
                    ) : (
                      <ChevronUp size={20} className="text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Goals List */}
                {!isCollapsed && (
                  <div className="px-5 pb-5 space-y-2">
                    {categoryGoals.map(goal => (
                      <div 
                        key={goal.id}
                        className={cn(
                          "bg-white dark:bg-[#1c1c1c] p-3 rounded-xl flex items-start gap-3 group transition-all",
                          goal.isCompleted && "opacity-60"
                        )}
                      >
                        <button
                          onClick={() => handleToggleComplete(goal)}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            goal.isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-slate-300 dark:border-slate-600 hover:border-green-500"
                          )}
                        >
                          {goal.isCompleted && <div className="w-2 h-2 bg-white rounded-full" />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-semibold",
                            goal.isCompleted 
                              ? "line-through text-slate-400" 
                              : "text-slate-800 dark:text-slate-100"
                          )}>
                            {goal.title}
                          </p>
                          {goal.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {goal.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(goal)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Button */}
                    <button
                      onClick={() => openAddModal(category)}
                      className={cn(
                        "w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all",
                        "border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600",
                        "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      )}
                    >
                      <Plus size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Thêm mục tiêu</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Personal Statement */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-3xl p-8 border-2 border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-indigo-600" size={24} />
              <h3 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tight">
                Tuyên bố cá nhân
              </h3>
            </div>
            {!editingStatement && (
              <button
                onClick={() => {
                  setStatementDraft(statement);
                  setEditingStatement(true);
                }}
                className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl text-indigo-600 transition-all"
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>

          {editingStatement ? (
            <div className="space-y-4">
              <textarea
                value={statementDraft}
                onChange={(e) => setStatementDraft(e.target.value)}
                rows={15}
                className="w-full bg-white dark:bg-[#1c1c1c] rounded-2xl p-4 text-sm leading-relaxed outline-none ring-2 ring-indigo-200 dark:ring-indigo-800 focus:ring-indigo-500 resize-none"
                placeholder="Viết tuyên bố cá nhân của bạn cho năm 2026..."
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditingStatement(false)}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveStatement}
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {statement ? (
                <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                  {statement}
                </div>
              ) : (
                <p className="text-slate-400 italic">
                  Chưa có tuyên bố cá nhân. Click nút sửa để thêm.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-[2rem] w-full max-w-md shadow-2xl p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                <Target size={20} className="text-indigo-600" />
                {editingGoal ? 'Sửa mục tiêu' : 'Thêm mục tiêu'}
              </h3>
              <button onClick={() => setShowModal(false)} disabled={saving} className="p-2 hover:bg-slate-100 dark:hover:bg-[#333] rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Danh mục</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as VisionCategory)}
                  className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                >
                  {(Object.keys(VISION_CATEGORY_UI) as VisionCategory[]).map(cat => (
                    <option key={cat} value={cat}>
                      {VISION_CATEGORY_UI[cat].icon} {VISION_CATEGORY_UI[cat].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mục tiêu</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Nhập mục tiêu..."
                  className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mô tả (không bắt buộc)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Chi tiết mục tiêu..."
                  className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowModal(false)} 
                disabled={saving}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-[#333] text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveGoal}
                disabled={saving || !formTitle.trim()}
                className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
