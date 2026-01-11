"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckSquare, Plus, Loader2, Trash2, Edit3, X, CheckCircle2, 
  Image as ImageIcon, Trophy, Camera, Tag as TagIcon, Quote
} from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { BucketlistItem, Tag } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTags } from '../../hooks/useTags';
import { TagSelector } from '../../components/TagSelector';
import { TagChip } from '../../components/TagChip';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function BucketlistPage() {
  const { user } = useAuth();
  const { tags } = useTags('bucketlist');
  const [items, setItems] = useState<BucketlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketlistItem | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formTagIds, setFormTagIds] = useState<string[]>([]);
  
  const [slogan, setSlogan] = useState('');
  const [editingSlogan, setEditingSlogan] = useState(false);
  const [sloganDraft, setSloganDraft] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('bucketlist_items').select('*').eq('user_id', user.id).order('order_index', { ascending: true });
    if (!error && data) {
      setItems(data.map((item: any) => ({
        ...item, imageBase64: item.image_base_64, isCompleted: item.is_completed, tag_ids: item.tag_ids || []
      })));
    }
    setLoading(false);
  }, [supabase, user]);

  const fetchSlogan = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('bucketlist_slogan').select('*').eq('user_id', user.id).single();
    if (data) setSlogan(data.content || '');
  }, [supabase, user]);

  useEffect(() => { if (user) { fetchItems(); fetchSlogan(); } }, [fetchItems, fetchSlogan, user]);

  const handleSaveSlogan = async () => {
    if (!user) return;
    await supabase.from('bucketlist_slogan').upsert({ content: sloganDraft, user_id: user.id });
    setSlogan(sloganDraft);
    setEditingSlogan(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingItem(null); setFormTitle(''); setFormDescription(''); setFormImage(null); setFormTagIds([]); setShowModal(true);
  };

  const openEditModal = (item: BucketlistItem) => {
    setEditingItem(item); setFormTitle(item.title); setFormDescription(item.description || ''); setFormImage(item.imageBase64 || null); setFormTagIds(item.tag_ids || []); setShowModal(true);
  };

  const handleSaveItem = async () => {
    if (!formTitle.trim() || !user) return;
    setSaving(true);
    const payload = { title: formTitle.trim(), description: formDescription.trim() || null, image_base_64: formImage, tag_ids: formTagIds, updated_at: new Date().toISOString() };
    if (editingItem) await supabase.from('bucketlist_items').update(payload).eq('id', editingItem.id);
    else await supabase.from('bucketlist_items').insert({ ...payload, user_id: user.id, is_completed: false, order_index: items.length });
    await fetchItems(); setShowModal(false); setSaving(false);
  };

  const filteredItems = items.filter(item => {
    const statusMatch = filter === 'all' || (filter === 'pending' && !item.isCompleted) || (filter === 'completed' && item.isCompleted);
    const tagMatch = !tagFilter || (item.tag_ids && item.tag_ids.includes(tagFilter));
    return statusMatch && tagMatch;
  });
  
  const progress = items.length > 0 ? Math.round((items.filter(i => i.isCompleted).length / items.length) * 100) : 0;

  if (loading && items.length === 0) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 overflow-y-auto lg:overflow-hidden relative">
      <aside className="w-full lg:w-[300px] bg-white dark:bg-[#1c1c1c] border-b lg:border-r border-slate-100 dark:border-slate-800 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 lg:overflow-y-auto no-scrollbar shrink-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2"><div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-lg"><CheckSquare size={14}/></div><h2 className="text-base font-bold uppercase tracking-tighter">Bucketlist</h2></div>
          <div className="space-y-1.5"><div className="flex items-center justify-between font-bold text-[9px] text-slate-400 uppercase"><span>Tiến độ</span><span>{progress}%</span></div><div className="h-1 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${progress}%` }} /></div></div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Quote size={10} /> Khẩu hiệu</h3>{!editingSlogan && <button onClick={() => { setSloganDraft(slogan); setEditingSlogan(true); }} className="text-indigo-500 text-[8px] font-black uppercase">Sửa</button>}</div>
          {editingSlogan ? (
            <div className="space-y-2"><textarea value={sloganDraft} onChange={e => setSloganDraft(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-[11px] focus:ring-2 ring-amber-500 outline-none" /><div className="flex gap-2"><button onClick={() => setEditingSlogan(false)} className="flex-1 py-1.5 bg-slate-100 text-[8px] font-black uppercase rounded-lg">Hủy</button><button onClick={handleSaveSlogan} className="flex-1 py-1.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded-lg">Lưu</button></div></div>
          ) : (
            <div className="italic text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">{slogan || "Ghi câu khẩu hiệu của bạn..."}</div>
          )}
        </div>

        <div className="hidden lg:flex flex-col gap-4">
            <button onClick={openAddModal} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase shadow-lg shadow-indigo-500/20">Thêm mục tiêu</button>
            <div className="space-y-1"><h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Bộ lọc Tag</h3>
              <button onClick={() => setTagFilter(null)} className={cn("w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase", !tagFilter ? "bg-amber-50 text-amber-600" : "text-slate-500")}>Tất cả</button>
              {tags.map(t => (<button key={t.id} onClick={() => setTagFilter(t.id)} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase truncate", tagFilter === t.id ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500")}><span>{t.icon}</span> {t.name}</button>))}
            </div>
        </div>
      </aside>

      <main className="flex-1 h-full lg:overflow-y-auto custom-scrollbar p-2 sm:p-6 relative">
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-4 pb-20">
          {filteredItems.map(item => (
            <div key={item.id} className={cn("group relative bg-white dark:bg-[#1c1c1c] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm", item.isCompleted && "opacity-80")}>
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                {item.imageBase64 ? <img src={item.imageBase64} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 dark:bg-[#262626] flex items-center justify-center text-slate-200"><ImageIcon size={20} /></div>}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEditModal(item)} className="p-1 bg-white/90 dark:bg-slate-900/90 rounded shadow text-slate-600"><Edit3 size={10}/></button>
                  <button onClick={async () => { if(confirm('Xóa?')) { await supabase.from('bucketlist_items').delete().eq('id', item.id); fetchItems(); } }} className="p-1 bg-white/90 dark:bg-slate-900/90 rounded shadow text-red-500"><Trash2 size={10}/></button>
                </div>
                <button onClick={async () => { const nc = !item.isCompleted; await supabase.from('bucketlist_items').update({is_completed: nc}).eq('id', item.id); fetchItems(); }} className={cn("absolute top-1 left-1 p-1 rounded shadow transition-all", item.isCompleted ? "bg-green-500 text-white" : "bg-white/90 text-slate-400")}>{item.isCompleted ? <Trophy size={10}/> : <CheckCircle2 size={10}/>}</button>
              </div>
              <div className="p-2"><h3 className={cn("text-[10px] font-bold truncate", item.isCompleted ? "line-through text-slate-400" : "text-slate-800 dark:text-white")}>{item.title}</h3></div>
            </div>
          ))}
        </div>
      </main>

      <button onClick={openAddModal} className="lg:hidden fixed bottom-6 right-6 w-12 h-12 bg-amber-500 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 z-[150]"><Plus size={24} /></button>

      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-[#1c1c1c] w-full max-w-sm rounded-[2rem] p-6 space-y-4 animate-in zoom-in-95 duration-200">
             <h3 className="text-sm font-black uppercase">{editingItem ? 'Sửa mục tiêu' : 'Mục tiêu mới'}</h3>
             <div className="space-y-3">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 cursor-pointer">{formImage ? <img src={formImage} className="w-full h-full object-cover" /> : <Camera size={20} className="text-slate-300" />}</div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Tên mục tiêu..." className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-xs font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-2 ring-amber-500" />
                <TagSelector category="bucketlist" selectedTagIds={formTagIds} onSelect={setFormTagIds} showCreateOption={true} />
             </div>
             <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase">Hủy</button>
                <button onClick={handleSaveItem} disabled={saving || !formTitle.trim()} className="flex-[2] py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase shadow-lg">Lưu lại</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}