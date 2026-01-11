"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { 
  BookText, Plus, Filter, 
  Loader2, Sparkles, 
  Trash2, ArrowLeft, Share2, Link2, Copy, Check,
  Save, X, Clock, Calendar, Smile, RefreshCw, PanelRight, Save as SaveIcon
} from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { JournalTopic, JournalPost } from '../../types';
import RichTextEditor from '../../components/RichTextEditor';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const TOPIC_COLORS = [
  { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-500' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
];

export default function JournalPage() {
  const [topics, setTopics] = useState<JournalTopic[]>([]);
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [fullscreenEdit, setFullscreenEdit] = useState(false);
  const [postTopicId, setPostTopicId] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMood, setPostMood] = useState<number>(5);
  const [postDate, setPostDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTopicName, setNewTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = getSupabaseClient();

  const fetchTopics = useCallback(async () => {
    const { data } = await supabase.from('journal_topic').select('*').order('created_at', { ascending: true });
    if (data) {
      setTopics(data);
      if (data.length > 0 && !postTopicId) setPostTopicId(data[0].id);
    }
  }, [supabase, postTopicId]);

  const fetchPosts = useCallback(async () => {
    let query = supabase.from('journal_post').select('*, journal_topic(name)').order('created_at', { ascending: false });
    if (selectedTopicId) query = query.eq('topic_id', selectedTopicId);
    const { data } = await query;
    if (data) setPosts(data);
    setLoading(false);
  }, [supabase, selectedTopicId]);

  useEffect(() => { fetchTopics(); fetchPosts(); }, [fetchTopics, fetchPosts]);

  const getTopicColor = (topicId: string) => {
    const index = topics.findIndex(t => t.id === topicId);
    if (index === -1) return { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/20', dot: 'bg-slate-500' };
    return TOPIC_COLORS[index % TOPIC_COLORS.length];
  };

  const handleNewPost = () => {
    setEditingPostId(null); setPostTitle(''); setPostContent(''); setPostMood(5); setPostDate(format(new Date(), 'yyyy-MM-dd'));
    if (selectedTopicId) setPostTopicId(selectedTopicId);
    else if (topics.length > 0) setPostTopicId(topics[0].id);
    setFullscreenEdit(true);
  };

  const handleSavePost = async () => {
    if (!postContent.trim() || !postTopicId) return;
    setSaving(true);
    const payload = { topic_id: postTopicId, title: postTitle.trim() || null, content: postContent, mood: postMood, entry_date: postDate, updated_at: new Date().toISOString() };
    const result = editingPostId ? await supabase.from('journal_post').update(payload).eq('id', editingPostId) : await supabase.from('journal_post').insert([payload]);
    if (!result.error) {
      await fetchPosts();
      setFullscreenEdit(false);
    }
    setSaving(false);
  };

  // Add missing openFullscreenEdit function to fix reference error
  const openFullscreenEdit = (post: JournalPost) => {
    setEditingPostId(post.id); 
    setPostTopicId(post.topic_id); 
    setPostTitle(post.title || ''); 
    setPostContent(post.content); 
    setPostMood(post.mood || 5); 
    setPostDate(post.entry_date);
    setFullscreenEdit(true);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col h-full shrink-0 p-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Filter size={14} /> Chủ đề</h2>
          <div className="flex gap-2 mb-6">
            <input type="text" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="Thêm..." className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border-none rounded-lg p-2.5 outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-500 font-bold" />
            <button onClick={async () => { if(newTopicName.trim()){ await supabase.from('journal_topic').insert({name: newTopicName.trim()}); setNewTopicName(''); fetchTopics(); } }} className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"><Plus size={18} /></button>
          </div>
          <div className="space-y-1 overflow-y-auto no-scrollbar">
            <button onClick={() => setSelectedTopicId(null)} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all", selectedTopicId === null ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : "text-slate-500 hover:bg-slate-50")}>
              <div className="flex items-center gap-3"><BookText size={16} /><span className="font-bold text-xs uppercase tracking-tighter">Tất cả</span></div>
              <span className="text-[10px] font-black opacity-50">{posts.length}</span>
            </button>
            {topics.map((topic) => (
              <button key={topic.id} onClick={() => setSelectedTopicId(topic.id)} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all truncate", selectedTopicId === topic.id ? "bg-slate-100 dark:bg-slate-800 text-slate-800" : "text-slate-500 hover:bg-slate-50")}>
                <span className="font-bold text-xs uppercase tracking-tighter truncate">{topic.name}</span>
                <span className="text-[10px] font-black opacity-50">{posts.filter(p => p.topic_id === topic.id).length}</span>
              </button>
            ))}
          </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 pb-24 scroll-smooth">
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
              <Sparkles size={16} className="text-amber-500" /> 
              {selectedTopicId ? `Ghi chép: ${topics.find(t => t.id === selectedTopicId)?.name}` : 'Tất cả ghi chép'}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {posts.map(post => {
              const topicColor = getTopicColor(post.topic_id);
              return (
                <div key={post.id} onClick={() => openFullscreenEdit(post)} className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-2">
                  <span className={cn("inline-flex items-center w-fit px-1.5 py-0.5 rounded-full text-[7px] sm:text-[10px] font-black uppercase tracking-tighter border", topicColor.bg, topicColor.text, topicColor.border)}>{post.journal_topic?.name || 'Ghi chép'}</span>
                  <div className="space-y-1 flex-1 overflow-hidden">
                    <h4 className="text-[10px] sm:text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-1">{post.title || 'Ghi chú'}</h4>
                    <p className="text-[9px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-tight line-clamp-3 italic">{stripHtml(post.content)}</p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-50 dark:border-slate-800/50 text-[7px] sm:text-[10px] font-bold text-slate-400">
                    <span>{format(new Date(post.entry_date), 'dd/MM/yy')}</span>
                  </div>
                </div>
              );
            })}
            {posts.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs italic">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button - Cả Desktop và Mobile */}
      {!fullscreenEdit && (
        <button 
          onClick={handleNewPost}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-95 hover:scale-105 transition-all z-[200]"
          title="Ghi chú mới"
        >
          <Plus size={28} />
        </button>
      )}

      {fullscreenEdit && (
        <div className="fixed inset-0 z-[250] bg-slate-50 dark:bg-[#171717] flex flex-col overflow-hidden animate-in fade-in duration-300">
          <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-100 dark:border-[#333] bg-white dark:bg-[#1c1c1c] sticky top-0 transition-colors">
            <button onClick={() => setFullscreenEdit(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><ArrowLeft size={18}/></button>
            <div className="flex items-center gap-2">
              <button onClick={handleSavePost} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest">{saving ? <Loader2 size={12} className="animate-spin" /> : 'Lưu'}</button>
              {/* Fixed confirm dialog text to include missing accent */}
              <button onClick={async () => { if(confirm('Xoá?')){ await supabase.from('journal_post').delete().eq('id', editingPostId!); fetchPosts(); setFullscreenEdit(false); } }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-16">
            <div className="max-w-4xl mx-auto space-y-4">
              <input type="text" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Tiêu đề..." className="w-full bg-transparent text-xl sm:text-5xl font-black text-slate-800 dark:text-white outline-none tracking-tighter" />
              <RichTextEditor content={postContent} onChange={setPostContent} placeholder="Bắt đầu viết..." isFullscreen={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}