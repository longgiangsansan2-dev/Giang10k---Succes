"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { 
  BookText, Plus, Filter, 
  Loader2, Sparkles, 
  Trash2, ArrowLeft,
  X, Calendar, RefreshCw, Search, CloudCheck, CloudUpload, AlertCircle
} from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { JournalTopic, JournalPost } from '../../types';
import RichTextEditor from '../../components/RichTextEditor';
import { useAuth } from '../../contexts/AuthContext';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const TOPIC_COLORS = [
  { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-500' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
];

const removeAccents = (str: string) => {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
};

const getSearchSnippet = (content: string, query: string) => {
  const text = content || '';
  if (!query) return text.substring(0, 120);
  const normalizedText = removeAccents(text);
  const normalizedQuery = removeAccents(query);
  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return text.substring(0, 120);
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + query.length + 60);
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
};

export default function JournalPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetPostId = searchParams.get('post');
  
  const [topics, setTopics] = useState<JournalTopic[]>([]);
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [fullscreenEdit, setFullscreenEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [postTopicId, setPostTopicId] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postDate, setPostDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle' | 'error'>('saved');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef({ title: '', content: '', topicId: '', date: '' });
  
  const [newTopicName, setNewTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  const fetchTopics = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('journal_topic').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    if (data) {
      setTopics(data);
      if (data.length > 0 && !postTopicId) setPostTopicId(data[0].id);
    }
  }, [supabase, user, postTopicId]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    let query = supabase.from('journal_post').select('*, journal_topic(name)').eq('user_id', user.id).order('created_at', { ascending: false });
    
    if (selectedTopicId && !targetPostId) query = query.eq('topic_id', selectedTopicId);
    
    const { data } = await query;
    if (data) setPosts(data);
    setLoading(false);
  }, [supabase, user, selectedTopicId, targetPostId]);

  useEffect(() => { if (user) { fetchTopics(); fetchPosts(); } }, [fetchTopics, fetchPosts, user]);

  const getTopicColor = (topicId: string) => {
    const index = topics.findIndex(t => t.id === topicId);
    if (index === -1) return { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/20', dot: 'bg-slate-500' };
    return TOPIC_COLORS[index % TOPIC_COLORS.length];
  };

  const openFullscreenEdit = useCallback((post: JournalPost) => {
    setEditingPostId(post.id); 
    setPostTopicId(post.topic_id); 
    setPostTitle(post.title || ''); 
    setPostContent(post.content); 
    setPostDate(post.entry_date);
    lastSavedDataRef.current = { title: post.title || '', content: post.content, topicId: post.topic_id, date: post.entry_date };
    setSaveStatus('saved'); 
    setFullscreenEdit(true);
  }, []);

  const handleCloseEdit = () => {
    setFullscreenEdit(false);
    if (searchParams.has('post')) setSearchParams({});
  };

  useEffect(() => {
    if (targetPostId && posts.length > 0 && !fullscreenEdit) {
      const post = posts.find(p => p.id === targetPostId);
      if (post) openFullscreenEdit(post);
    }
  }, [targetPostId, posts, fullscreenEdit, openFullscreenEdit]);

  const performSave = async (currentId: string | null, data: any) => {
    if (!user) return;
    setSaveStatus('saving');
    const payload = { ...data, user_id: user.id };
    try {
      if (currentId) {
        const { error } = await supabase.from('journal_post').update(payload).eq('id', currentId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        if (!data.content.trim() && !data.title.trim()) {
           setSaveStatus('saved');
           return;
        }
        const { data: newPost, error } = await supabase.from('journal_post').insert([payload]).select().single();
        if (error) throw error;
        if (newPost) setEditingPostId(newPost.id);
      }
      lastSavedDataRef.current = { title: data.title, content: data.content, topicId: data.topic_id, date: data.entry_date };
      setSaveStatus('saved');
      fetchPosts(); 
    } catch (err) {
      console.error("Auto-save failed:", err);
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (!fullscreenEdit || !user) return;
    const hasChanged = 
      postTitle !== lastSavedDataRef.current.title ||
      postContent !== lastSavedDataRef.current.content ||
      postTopicId !== lastSavedDataRef.current.topicId ||
      postDate !== lastSavedDataRef.current.date;
    
    if (!hasChanged) return;
    setSaveStatus('idle');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const payload = {
        title: postTitle.trim(),
        content: postContent,
        topic_id: postTopicId,
        entry_date: postDate,
        updated_at: new Date().toISOString()
      };
      performSave(editingPostId, payload);
    }, 1500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [postTitle, postContent, postTopicId, postDate, fullscreenEdit, editingPostId, user]);

  const handleNewPost = () => {
    const defaultDate = format(new Date(), 'yyyy-MM-dd');
    const defaultTopicId = selectedTopicId || (topics.length > 0 ? topics[0].id : '');
    setEditingPostId(null); 
    setPostTitle(''); 
    setPostContent(''); 
    setPostDate(defaultDate);
    setPostTopicId(defaultTopicId);
    lastSavedDataRef.current = { title: '', content: '', topicId: defaultTopicId, date: defaultDate };
    setSaveStatus('saved');
    setFullscreenEdit(true);
  };

  const stripHtml = (html: string) => {
    if (typeof document === 'undefined') return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const normalizedQuery = removeAccents(searchQuery);
    return posts.filter(post => {
      const normalizedTitle = removeAccents(post.title || '');
      const normalizedContent = removeAccents(stripHtml(post.content));
      return normalizedTitle.includes(normalizedQuery) || normalizedContent.includes(normalizedQuery);
    });
  }, [posts, searchQuery]);

  const renderHighlightedSnippet = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
      return parts.map((part, i) => 
        removeAccents(part) === removeAccents(query) 
          ? <mark key={i} className="bg-indigo-500/30 text-indigo-300 dark:text-indigo-200 rounded px-0.5 border-b border-indigo-400">{part}</mark> 
          : part
      );
    } catch (e) { return text; }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col h-full shrink-0 p-6 shadow-sm">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Filter size={14} /> Chủ đề</h2>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} 
              placeholder="Chủ đề..." 
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border-none rounded-lg p-2.5 outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-500 font-bold" 
            />
            <button 
              onClick={async () => { if(newTopicName.trim() && user){ await supabase.from('journal_topic').insert({name: newTopicName.trim(), user_id: user.id}); setNewTopicName(''); fetchTopics(); } }} 
              className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1">
            <button 
              onClick={() => setSelectedTopicId(null)} 
              className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all", selectedTopicId === null ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}
            >
              <div className="flex items-center gap-3"><BookText size={16} /><span className="font-bold text-xs uppercase tracking-tighter">Tất cả</span></div>
              <span className="text-[10px] font-black opacity-50">{posts.length}</span>
            </button>
            {topics.map((topic) => (
              <button key={topic.id} onClick={() => setSelectedTopicId(topic.id)} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all truncate", selectedTopicId === topic.id ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                <span className="font-bold text-xs uppercase tracking-tighter truncate">{topic.name}</span>
                <span className="text-[10px] font-black opacity-50">{posts.filter(p => p.topic_id === topic.id).length}</span>
              </button>
            ))}
          </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 pb-24 scroll-smooth custom-scrollbar">
        <div className="max-w-5xl mx-auto p-4 sm:p-8">
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                <Sparkles size={16} className="text-amber-500" /> 
                {selectedTopicId ? `Ghi chép: ${topics.find(t => t.id === selectedTopicId)?.name}` : 'Tất cả ghi chép'}
              </h3>
              {loading && <Loader2 size={16} className="animate-spin text-slate-300" />}
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tiêu đề hoặc nội dung..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 ring-indigo-500/50 font-medium text-sm transition-all shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={16} /></button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {filteredPosts.map(post => {
              const topicColor = getTopicColor(post.topic_id);
              const snippet = getSearchSnippet(stripHtml(post.content), searchQuery);
              return (
                <div 
                  key={post.id} onClick={() => openFullscreenEdit(post)} 
                  className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-3 min-h-[160px]"
                >
                  <span className={cn("inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-tighter border shadow-sm", topicColor.bg, topicColor.text, topicColor.border)}>
                    {post.journal_topic?.name || 'Ghi chép'}
                  </span>
                  <div className="space-y-1.5 flex-1 overflow-hidden">
                    <h4 className="text-[11px] sm:text-[13px] font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                      {renderHighlightedSnippet(post.title || 'Không tiêu đề', searchQuery)}
                    </h4>
                    <p className="text-[10px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 italic opacity-80">
                      {renderHighlightedSnippet(snippet, searchQuery)}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50 text-[8px] sm:text-[10px] font-bold text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Calendar size={10} /> {isValid(parseISO(post.entry_date)) ? format(parseISO(post.entry_date), 'dd/MM/yyyy') : 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {!fullscreenEdit && (
        <button onClick={handleNewPost} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-95 hover:scale-105 transition-all z-[200]">
          <Plus size={28} />
        </button>
      )}

      {fullscreenEdit && (
        <div className="fixed inset-0 z-[250] bg-white dark:bg-[#131314] flex flex-col overflow-hidden animate-in fade-in duration-300">
          <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1e1f20] sticky top-0 z-[60]">
            <div className="flex items-center gap-3">
              <button onClick={handleCloseEdit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-all"><ArrowLeft size={20}/></button>
              <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-1 hidden sm:block" />
              <select 
                value={postTopicId} onChange={(e) => setPostTopicId(e.target.value)} 
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 outline-none border-none cursor-pointer hover:underline"
              >
                {topics.map(t => <option key={t.id} value={t.id} className="dark:bg-slate-900">{t.name}</option>)}
              </select>
              <div className="flex items-center gap-1.5 ml-4">
                 {saveStatus === 'saving' ? (
                   <div className="flex items-center gap-1.5 text-amber-500 animate-pulse"><CloudUpload size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Đang lưu...</span></div>
                 ) : saveStatus === 'saved' ? (
                   <div className="flex items-center gap-1.5 text-slate-400"><CloudCheck size={14} className="text-emerald-500" /><span className="text-[9px] font-black uppercase tracking-widest">Đã đồng bộ</span></div>
                 ) : saveStatus === 'error' ? (
                   <div className="flex items-center gap-1.5 text-red-500"><AlertCircle size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Lỗi lưu</span></div>
                 ) : (
                   <div className="flex items-center gap-1.5 text-slate-300"><RefreshCw size={12} className="animate-spin" /><span className="text-[9px] font-black uppercase tracking-widest">Chờ</span></div>
                 )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editingPostId && (
                <button 
                  onClick={async () => { if(confirm('Xoá ghi chép này?')){ await supabase.from('journal_post').delete().eq('id', editingPostId!).eq('user_id', user!.id); fetchPosts(); handleCloseEdit(); } }} 
                  className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-transparent">
            <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 space-y-8">
              <div className="flex flex-col gap-4">
                <input 
                  type="date" value={postDate} onChange={e => setPostDate(e.target.value)} 
                  className="bg-transparent border-none outline-none font-bold text-xs uppercase tracking-widest cursor-pointer text-slate-400 hover:text-indigo-500 transition-colors" 
                />
                <input 
                  type="text" autoFocus value={postTitle} onChange={(e) => setPostTitle(e.target.value)} 
                  placeholder="Tiêu đề..." 
                  className="w-full bg-transparent text-2xl sm:text-5xl font-black text-slate-800 dark:text-white outline-none tracking-tighter placeholder:opacity-20" 
                />
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
              <RichTextEditor 
                content={postContent} 
                onChange={(html) => setPostContent(html)} 
                placeholder="Bắt đầu viết nội dung của bạn..." 
                isFullscreen={true} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}