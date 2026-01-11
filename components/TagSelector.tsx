import React, { useState } from 'react';
import { Tag as TagIcon, Plus, X, Check } from 'lucide-react';
import { Tag } from '../types';
import { useTags } from '../hooks/useTags';

interface TagSelectorProps {
  selectedTagIds: string[];
  onSelect: (tagIds: string[]) => void;
  category?: 'task' | 'bucketlist';
  showCreateOption?: boolean;
  hideList?: boolean; // Mới: dùng để ẩn danh sách tag khi chỉ muốn dùng form tạo
}

const PRESET_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#06b6d4'];
const PRESET_EMOJIS = ['🏷️', '💰', '🎯', '💼', '❤️', '✨', '🏠', '✈️', '📚', '🎨'];

export const TagSelector: React.FC<TagSelectorProps> = ({ 
  selectedTagIds = [], 
  onSelect,
  category = 'task',
  showCreateOption = true,
  hideList = false
}) => {
  // Fix: Explicitly cast category to expected union type to satisfy useTags parameter requirements
  const { tags, addTag, deleteTag } = useTags(category as 'task' | 'bucketlist');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[1]);
  const [newEmoji, setNewEmoji] = useState(PRESET_EMOJIS[0]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || saving) return;
    setSaving(true);
    const tag = await addTag(newName, newColor, newEmoji);
    if (tag) {
      onSelect([...selectedTagIds, tag.id]);
      setNewName('');
      setShowAddForm(false);
    }
    setSaving(false);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelect(selectedTagIds.filter(id => id !== tagId));
    } else {
      onSelect([...selectedTagIds, tagId]);
    }
  };

  const handleDelete = async (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation();
    if (confirm('Xóa tag này vĩnh viễn?')) {
      await deleteTag(tagId);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
          <TagIcon size={12} /> {category === 'task' ? 'Tags Nhiệm vụ' : 'Tags Bucketlist'}
        </label>
        {showCreateOption && (
          <button 
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[10px] font-bold uppercase text-indigo-500 flex items-center gap-1 hover:text-indigo-400 transition-colors"
          >
            {showAddForm ? <X size={10}/> : <Plus size={10}/>} {showAddForm ? 'Hủy' : 'Tạo mới'}
          </button>
        )}
      </div>

      {showAddForm && showCreateOption ? (
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <input 
            type="text"
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Tên tag..."
            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-2.5 px-4 text-xs font-bold outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 ring-indigo-500 transition-all"
          />
          
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(c => (
              <button 
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`w-6 h-6 rounded-full transition-all ${newColor === c ? 'scale-125 ring-2 ring-white dark:ring-slate-400 shadow-lg' : 'hover:scale-110 opacity-60 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_EMOJIS.map(e => (
              <button 
                key={e}
                type="button"
                onClick={() => setNewEmoji(e)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                  newEmoji === e 
                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110 ring-2 ring-indigo-400' 
                    : 'bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <button 
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim() || saving}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            {saving ? 'Đang tạo...' : 'Xác nhận tạo Tag'}
          </button>
        </div>
      ) : (
        !hideList && (
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
            {tags.length === 0 ? (
              <p className="text-[10px] italic text-slate-400 py-2 px-1">Chưa có tag nào.</p>
            ) : (
              tags.map(t => {
                const isSelected = selectedTagIds.includes(t.id);
                return (
                  <div key={t.id} className="relative group/chip">
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                          : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      <span>{t.icon}</span>
                      {t.name}
                      {isSelected && <Check size={10} />}
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, t.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/chip:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                      title="Xóa tag"
                    >
                      <X size={8} strokeWidth={4} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )
      )}
    </div>
  );
};
