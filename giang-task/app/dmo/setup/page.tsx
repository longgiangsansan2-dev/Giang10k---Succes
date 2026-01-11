
"use client";

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { TaskQuadrant, QUADRANT_UI } from '../../../types';
import { getTemplates, upsertTemplate, deleteTemplate } from '../../../actions/template-actions';
import { Link } from 'react-router-dom';

export default function DmoSetupPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newQuad, setNewQuad] = useState<TaskQuadrant>(TaskQuadrant.DO_NOW);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await getTemplates();
      setTemplates(res);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await upsertTemplate({ title: newTitle, quadrant: newQuad });
    setNewTitle('');
    fetchTemplates();
  };

  const handleToggle = async (tpl: any) => {
    await upsertTemplate({ id: tpl.id, title: tpl.title, quadrant: tpl.quadrant, isActive: !tpl.is_active, orderIndex: tpl.order_index });
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xoá template này?')) { await deleteTemplate(id); fetchTemplates(); }
  };

  if (loading) return <div className="p-24 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={48} /></div>;

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-10 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Thiết lập DMO</h1>
          <p className="text-sm text-slate-500 italic">Quản lý các đầu việc lặp lại</p>
        </div>
        <Link to="/" className="text-sm font-black text-indigo-500 hover:underline">← Quay lại board</Link>
      </header>

      {error && <div className="p-5 bg-red-50 text-red-600 rounded-2xl flex items-center gap-4 font-bold text-base border border-red-100"><ShieldAlert size={24}/> {error}</div>}

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Tên công việc..." className="flex-1 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl p-4 outline-none ring-1 ring-slate-200 focus:ring-2 ring-indigo-500 text-base font-bold" />
        <select value={newQuad} onChange={e => setNewQuad(e.target.value as TaskQuadrant)} className="bg-slate-50 dark:bg-slate-950 border-none rounded-2xl p-4 text-sm font-black text-slate-600 outline-none ring-1 ring-slate-200">
          {Object.entries(QUADRANT_UI).map(([val, ui]) => <option key={val} value={val}>{ui.label}</option>)}
        </select>
        <button onClick={handleAdd} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg"><Plus size={22} /> Thêm Template</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {templates.map(tpl => (
          <div key={tpl.id} className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border flex items-center justify-between transition-all ${tpl.is_active ? 'opacity-100' : 'opacity-50 grayscale'}`}>
            <div className="flex items-center gap-5">
              <div className={`w-4 h-4 rounded-full ${QUADRANT_UI[tpl.quadrant as TaskQuadrant].dot}`} />
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg">{tpl.title}</h4>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{QUADRANT_UI[tpl.quadrant as TaskQuadrant].label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleToggle(tpl)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${tpl.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{tpl.is_active ? 'Bật' : 'Tắt'}</button>
              <button onClick={() => handleDelete(tpl.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={24} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
