"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Plus, Trash2, Loader2, ShieldAlert, Edit3, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { TaskQuadrant, QUADRANT_UI, Tag } from '../../../types';
import { getTemplates, upsertTemplate, deleteTemplate } from '../../../actions/template-actions';
import { getSupabaseClient } from '../../../lib/supabase/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTags } from '../../../hooks/useTags';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function DmoSetupPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formQuad, setFormQuad] = useState<TaskQuadrant>(TaskQuadrant.DO_NOW);
  const [formTagId, setFormTagId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { tags } = useTags('task');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTemplates();
      setTemplates(res);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) fetchTemplates(); }, [fetchTemplates, user]);

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    try {
      await upsertTemplate({ 
        id: editingId,
        title: formTitle.trim(), 
        quadrant: formQuad, 
        tagId: formTagId 
      });
      resetForm();
      await fetchTemplates();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const resetForm = () => {
    setEditingId(null); setFormTitle(''); setFormQuad(TaskQuadrant.DO_NOW); setFormTagId(null);
  };

  const startEdit = (tpl: any) => {
    setEditingId(tpl.id); setFormTitle(tpl.title);
    setFormQuad(tpl.quadrant as TaskQuadrant); setFormTagId(tpl.tag_id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (tpl: any) => {
    try {
      await upsertTemplate({ ...tpl, isActive: !tpl.is_active, tagId: tpl.tag_id });
      await fetchTemplates();
    } catch (err) {}
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xóa template?')) {
      await deleteTemplate(id); fetchTemplates();
      if (editingId === id) resetForm();
    }
  };

  if (loading && templates.length === 0) return <div className="h-full flex items-center justify-center bg-white dark:bg-[#131314]"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#131314] transition-colors h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <LayoutGrid size={24} className="text-indigo-500" /> Thiết lập DMO
              </h1>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Nhiệm vụ lặp lại tự động mỗi ngày</p>
            </div>
            <Link to="/" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase">← Quay lại Board</Link>
          </header>

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-3 font-semibold text-xs border border-red-100 animate-in fade-in"><ShieldAlert size={16}/> {error}</div>}

          {/* Form thêm gọn nhẹ */}
          <div className={cn(
            "p-5 rounded-xl border transition-all space-y-4 bg-white dark:bg-[#1e1f20] shadow-sm",
            editingId ? "border-indigo-400 ring-4 ring-indigo-500/5" : "border-slate-200 dark:border-[#333537]"
          )}>
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                {editingId ? <Edit3 size={11} className="text-indigo-500" /> : <Plus size={11} />}
                {editingId ? 'Đang chỉnh sửa' : 'Thêm nhiệm vụ mới'}
              </h3>
              {editingId && <button onClick={resetForm} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Hủy sửa</button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <input 
                  autoFocus={!!editingId}
                  value={formTitle} onChange={e => setFormTitle(e.target.value)} 
                  placeholder="Tên công việc (Vd: Check mail, Thiền...)" 
                  className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#3c4043] rounded-lg p-2.5 outline-none focus:ring-2 ring-indigo-500 text-sm font-medium" 
                />
              </div>
              <div>
                <select 
                  value={formQuad} onChange={e => setFormQuad(e.target.value as TaskQuadrant)} 
                  className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#3c4043] rounded-lg p-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  {Object.entries(QUADRANT_UI).map(([val, ui]) => <option key={val} value={val}>{ui.label}</option>)}
                </select>
              </div>
              <button 
                onClick={handleSave} 
                disabled={saving || !formTitle.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <select 
                value={formTagId || ''} onChange={(e) => setFormTagId(e.target.value || null)} 
                className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#3c4043] rounded-lg p-2.5 text-xs font-semibold outline-none"
              >
                <option value="">-- Gắn Tag (Không bắt buộc) --</option>
                {tags.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
              </select>
              <div className="flex-1 md:block hidden" />
            </div>
          </div>

          {/* Danh sách dạng hàng mật độ cao */}
          <div className="bg-white dark:bg-[#1e1f20] rounded-xl border border-slate-200 dark:border-[#333537] shadow-sm overflow-hidden">
            <div className="bg-slate-50 dark:bg-[#1e1f20] border-b border-slate-200 dark:border-[#333537] px-5 py-3">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Danh sách Template ({templates.length})</h3>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-[#333537]">
              {templates.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-slate-400 font-medium text-sm italic">Chưa có nhiệm vụ lặp lại nào được thiết lập.</p>
                </div>
              ) : (
                templates.map(tpl => {
                  const tplTag = tags.find(t => t.id === tpl.tag_id);
                  const ui = QUADRANT_UI[tpl.quadrant as TaskQuadrant];
                  
                  return (
                    <div key={tpl.id} className={cn("flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-[#2a2b2c] transition-colors", !tpl.is_active && "bg-slate-50/50 dark:bg-[#171819] opacity-70")}>
                      <button onClick={() => toggleActive(tpl)} className="shrink-0 transition-colors">
                        {tpl.is_active ? <ToggleRight className="text-indigo-500" size={24} /> : <ToggleLeft className="text-slate-400" size={24} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", ui.dot)} />
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{tpl.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{ui.label}</span>
                          {tplTag && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight flex items-center gap-1" style={{ backgroundColor: `${tplTag.color}15`, color: tplTag.color }}>
                              <span>{tplTag.icon}</span> {tplTag.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(tpl)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Sửa">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(tpl.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all" title="Xóa">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}