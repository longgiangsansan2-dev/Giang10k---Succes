"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckSquare, Plus, Loader2, Trash2, Edit3, X, CheckCircle2, 
  Image, Calendar, Trophy, Sparkles, Camera
} from 'lucide-react';
import { format } from 'date-fns';
import { getSupabaseClient } from '../../lib/supabase/client';
import { BucketlistItem } from '../../types';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function BucketlistPage() {
  const [items, setItems] = useState<BucketlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Add/Edit modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketlistItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState<string | null>(null);
  
  // Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const supabase = getSupabaseClient();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bucketlist_items')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (!error && data) {
      setItems(data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageBase64: item.image_base64,
        isCompleted: item.is_completed,
        completedAt: item.completed_at,
        orderIndex: item.order_index,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => fetchItems();
    window.addEventListener('giang:refresh', handleRefresh);
    return () => window.removeEventListener('giang:refresh', handleRefresh);
  }, [fetchItems]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormImage(null);
    setShowModal(true);
  };

  const openEditModal = (item: BucketlistItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormImage(item.imageBase64 || null);
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);

    if (editingItem) {
      // Update existing
      const { error } = await supabase
        .from('bucketlist_items')
        .update({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          image_base64: formImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (!error) {
        await fetchItems();
        setShowModal(false);
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('bucketlist_items')
        .insert({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          image_base64: formImage,
          is_completed: false,
          order_index: items.length
        });

      if (!error) {
        await fetchItems();
        setShowModal(false);
      }
    }
    setSaving(false);
  };

  const handleToggleComplete = async (item: BucketlistItem) => {
    const newCompleted = !item.isCompleted;
    const { error } = await supabase
      .from('bucketlist_items')
      .update({ 
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (!error) {
      setItems(prev => prev.map(i => 
        i.id === item.id ? { 
          ...i, 
          isCompleted: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : undefined
        } : i
      ));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return;
    
    const { error } = await supabase
      .from('bucketlist_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      setItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return !item.isCompleted;
    if (filter === 'completed') return item.isCompleted;
    return true;
  });

  const totalItems = items.length;
  const completedItems = items.filter(i => i.isCompleted).length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
            <CheckSquare size={18} />
            Bucketlist 2026
          </div>
          
          {/* Progress Overview */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-3xl font-black text-amber-500">{progress}%</div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hoàn thành</div>
            </div>
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <div className="text-3xl font-black text-slate-800 dark:text-white">{completedItems}/{totalItems}</div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mục tiêu</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter & Add */}
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'pending', label: 'Chưa làm' },
              { id: 'completed', label: 'Đã làm' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filter === f.id
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-amber-200 dark:hover:shadow-none transition-all"
          >
            <Plus size={16} />
            Thêm mới
          </button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className={cn(
                "bg-white dark:bg-[#1c1c1c] rounded-2xl overflow-hidden border-2 transition-all group hover:shadow-lg",
                item.isCompleted 
                  ? "border-green-200 dark:border-green-900/50" 
                  : "border-slate-100 dark:border-[#333]"
              )}
            >
              {/* Image */}
              {item.imageBase64 ? (
                <div 
                  className="h-40 bg-slate-100 dark:bg-slate-800 relative cursor-pointer overflow-hidden"
                  onClick={() => setPreviewImage(item.imageBase64!)}
                >
                  <img 
                    src={item.imageBase64} 
                    alt={item.title}
                    className={cn(
                      "w-full h-full object-cover transition-all",
                      item.isCompleted && "grayscale"
                    )}
                  />
                  {item.isCompleted && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-green-500" />
                    </div>
                  )}
                </div>
              ) : (
                <div className={cn(
                  "h-32 bg-gradient-to-br flex items-center justify-center",
                  item.isCompleted 
                    ? "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
                    : "from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50"
                )}>
                  {item.isCompleted ? (
                    <Trophy className="w-12 h-12 text-green-400" />
                  ) : (
                    <Image className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(item)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                      item.isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-slate-300 dark:border-slate-600 hover:border-green-500"
                    )}
                  >
                    {item.isCompleted && <CheckCircle2 size={14} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-bold text-sm",
                      item.isCompleted 
                        ? "line-through text-slate-400" 
                        : "text-slate-800 dark:text-white"
                    )}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#333]">
                  {item.isCompleted && item.completedAt ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 uppercase">
                      <Calendar size={12} />
                      {format(new Date(item.completedAt), 'dd/MM/yyyy')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Chưa hoàn thành
                    </span>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">
                {filter === 'completed' ? 'Chưa có mục nào hoàn thành' : 
                 filter === 'pending' ? 'Tất cả đã hoàn thành! 🎉' :
                 'Chưa có mục nào trong bucketlist'}
              </p>
              {filter === 'all' && (
                <button
                  onClick={openAddModal}
                  className="mt-4 text-amber-600 dark:text-amber-400 font-bold text-sm hover:underline"
                >
                  + Thêm mục đầu tiên
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-[2rem] w-full max-w-md shadow-2xl p-8 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                <CheckSquare size={20} className="text-amber-500" />
                {editingItem ? 'Sửa mục' : 'Thêm mới'}
              </h3>
              <button onClick={() => setShowModal(false)} disabled={saving} className="p-2 hover:bg-slate-100 dark:hover:bg-[#333] rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Hình ảnh</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden",
                    "border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600",
                    formImage ? "border-solid" : ""
                  )}
                >
                  {formImage ? (
                    <>
                      <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormImage(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Camera size={32} />
                      <span className="text-xs font-bold">Click để tải ảnh (tối đa 2MB)</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Tên mục tiêu *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Nhập tên bucketlist..."
                  className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mô tả</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Chi tiết về mục tiêu này..."
                  className="w-full bg-slate-50 dark:bg-[#262626] border-none rounded-xl py-3 px-4 outline-none ring-1 ring-slate-100 dark:ring-[#404040] focus:ring-2 focus:ring-amber-500 text-sm font-medium resize-none"
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
                onClick={handleSaveItem}
                disabled={saving || !formTitle.trim()}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            onClick={() => setPreviewImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95"
          />
        </div>
      )}
    </div>
  );
}
