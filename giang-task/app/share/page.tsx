
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { BookText, Calendar, Eye, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';

interface SharedTopic {
  id: string;
  name: string;
  share_token: string;
  is_public: boolean;
}

interface SharedPost {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  created_at: string;
}

const TOPIC_COLORS = [
  { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-500' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
];

export default function SharedTopicPage() {
  const { token } = useParams<{ token: string }>();
  const [topic, setTopic] = useState<SharedTopic | null>(null);
  const [posts, setPosts] = useState<SharedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<SharedPost | null>(null);

  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchSharedTopic = async () => {
      if (!token) return;
      
      try {
        // Lấy topic theo share_token và trạng thái public
        const { data: topicData, error: topicError } = await supabase
          .from('journal_topic')
          .select('*')
          .eq('share_token', token)
          .eq('is_public', true)
          .single();

        if (topicError || !topicData) {
          setError('Nội dung không tồn tại hoặc link đã bị vô hiệu hóa.');
          setLoading(false);
          return;
        }

        setTopic(topicData);

        // Lấy danh sách bài viết thuộc topic
        const { data: postsData, error: postsError } = await supabase
          .from('journal_post')
          .select('id, title, content, entry_date, created_at')
          .eq('topic_id', topicData.id)
          .order('entry_date', { ascending: false });

        if (!postsError && postsData) {
          setPosts(postsData);
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi kết nối máy chủ.');
      }
      setLoading(false);
    };

    fetchSharedTopic();
  }, [token, supabase]);

  // Lấy màu sắc mặc định cho trang share (Indigo)
  const color = TOPIC_COLORS[4]; 

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-neutral-500 font-black uppercase tracking-widest text-[10px]">Đang chuẩn bị nội dung...</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-[#171717] p-10 rounded-[2.5rem] border border-neutral-800 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-500" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Truy cập bị từ chối</h1>
          <p className="text-neutral-500 text-sm mb-8 font-medium leading-relaxed">{error}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-white font-bold transition-all text-[11px] uppercase tracking-widest">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] text-white flex flex-col transition-colors">
      <header className="border-b border-neutral-800 bg-[#1c1c1c] sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full shadow-lg ${color.dot}`} />
            <h1 className="text-lg font-black uppercase tracking-tighter">{topic.name}</h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${color.bg} ${color.text} border border-indigo-500/20`}>
              {posts.length} Bài viết
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-700">
            <Eye size={14} className="text-indigo-400" /> 
            <span>Chế độ chỉ đọc</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex-1 w-full flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar bài viết */}
        <aside className="w-full md:w-80 shrink-0 border-r border-neutral-800 bg-[#171717] flex flex-col">
          <div className="p-6">
            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <BookText size={14} /> Danh sách ghi chép
            </h2>
            <div className="space-y-2 overflow-y-auto max-h-[40vh] md:max-h-[calc(100vh-160px)] custom-scrollbar pr-1">
              {posts.map((post, index) => (
                <button
                  key={post.id}
                  onClick={() => {
                    setSelectedPost(post);
                    if (window.innerWidth < 768) {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all border group ${
                    selectedPost?.id === post.id
                      ? `${color.bg} ${color.text} ${color.border} shadow-lg shadow-indigo-500/5`
                      : 'hover:bg-neutral-800/50 text-neutral-400 border-transparent'
                  }`}
                >
                  <p className="font-bold text-[13px] line-clamp-2 mb-2 leading-snug group-hover:text-neutral-200 transition-colors">
                    {post.title || `Ghi chép #${posts.length - index}`}
                  </p>
                  <p className="text-[10px] text-neutral-600 flex items-center gap-1.5 font-black uppercase tracking-tighter group-hover:text-neutral-500">
                    <Calendar size={12} />
                    {format(new Date(post.entry_date), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Nội dung chi tiết */}
        <main className="flex-1 overflow-y-auto bg-[#0f0f0f] custom-scrollbar">
          {selectedPost ? (
            <article className="max-w-3xl mx-auto p-8 md:p-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-8 bg-neutral-900/50 w-fit px-4 py-2 rounded-full border border-neutral-800">
                <Calendar size={14} className="text-indigo-500" />
                {format(new Date(selectedPost.entry_date), 'EEEE, dd MMMM yyyy', { locale: vi })}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black mb-8 leading-tight tracking-tighter text-neutral-100">
                {selectedPost.title || 'Ghi chép không tiêu đề'}
              </h1>
              
              <div className="w-20 h-1.5 bg-indigo-600 rounded-full mb-12 shadow-lg shadow-indigo-500/20" />
              
              <div 
                className="prose prose-invert max-w-none prose-p:text-neutral-400 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg prose-headings:tracking-tighter prose-img:rounded-2xl prose-img:shadow-2xl prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-neutral-800/50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-neutral-700 shadow-xl group hover:scale-110 transition-transform">
                <BookText size={40} className="text-neutral-500 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-neutral-400">Chọn một bài viết</h3>
              <p className="text-sm text-neutral-600 font-medium mt-2 max-w-xs mx-auto">Vui lòng duyệt danh sách bên trái để đọc nội dung chi tiết của ghi chép.</p>
              
              <div className="mt-12 opacity-20 hidden md:block">
                <div className="w-64 h-px bg-gradient-to-r from-transparent via-neutral-500 to-transparent mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Chỉ xem nội dung chia sẻ</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-neutral-800 py-8 text-center bg-[#1c1c1c]">
        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-1">
          Giang Task • Hệ thống quản lý năng suất
        </p>
        <p className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest italic">
          Nội dung này được chia sẻ ở chế độ bảo mật chỉ đọc.
        </p>
      </footer>
    </div>
  );
}
