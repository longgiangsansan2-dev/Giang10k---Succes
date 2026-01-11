"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { LayoutGrid, Loader2, Trash2, Clock, Edit3, X, CheckCircle2, BookText, AlignLeft, Filter, AlertCircle, Plus } from 'lucide-react';
import { DailyTask, TaskQuadrant, QUADRANT_UI, TaskStatus, Tag, JournalPost } from './types';
import { getSupabaseClient } from './lib/supabase/client';
import { ensureDailyTasksForDate } from './actions/template-actions';
import AddTaskScreen from './components/AddTaskScreen';
import { useTags } from './hooks/useTags';
import { TagChip } from './components/TagChip';
import { useAuth } from './contexts/AuthContext';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const getProgressEmoji = (percent: number) => {
  if (percent >= 100) return '🚀';
  if (percent >= 70) return '🐥';
  if (percent >= 40) return '🐣';
  if (percent >= 10) return '🌱';
  return '🥚';
};

const DraggableTask: React.FC<{ 
  task: DailyTask; 
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ task, children, disabled }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: disabled
  });

  return (
    <div 
      ref={setNodeRef} 
      {...(disabled ? {} : listeners)} 
      {...(disabled ? {} : attributes)}
      className={cn(
        "transition-opacity",
        !disabled && "touch-none select-none cursor-grab",
        isDragging ? "opacity-20 grayscale cursor-grabbing" : ""
      )}
    >
      {children}
    </div>
  );
};

const DroppableQuadrant: React.FC<{ 
  quadrant: TaskQuadrant; 
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ quadrant, children, className, disabled }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: quadrant,
    disabled: disabled
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        className,
        "transition-all duration-300 relative",
        !disabled && isOver && "ring-4 ring-indigo-500/50 bg-indigo-500/10 scale-[1.01] z-10"
      )}
    >
      {children}
    </div>
  );
};

const SortableTaskCard: React.FC<{ 
  task: DailyTask; 
  onToggle: (t: DailyTask) => void;
  onDelete: (t: DailyTask) => void;
  onEdit: (t: DailyTask) => void;
  tags: Tag[];
  isOverlay?: boolean;
}> = ({ task, onToggle, onDelete, onEdit, tags, isOverlay }) => {
  const isDone = task.status === TaskStatus.DONE;
  const isDMO = !!task.sourceTemplateId;
  const now = new Date();
  const isOverdue = !!task.deadlineAt && new Date(task.deadlineAt) < now && !isDone;
  const taskTag = tags.find(t => t.id === task.tag_id);
  const navigate = useNavigate();

  return (
    <div className={cn(
      "bg-white dark:bg-[#1c1c1c] p-3.5 rounded-xl border flex flex-col gap-2 group transition-all relative",
      "border-slate-200 dark:border-[#333] shadow-sm hover:shadow-md",
      isDone && !isOverlay && "opacity-60",
      isOverlay ? "shadow-2xl ring-2 ring-indigo-500 rotate-2 scale-105" : ""
    )}>
      <div className="flex items-start gap-3">
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onToggle(task)}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5",
            isDone ? "bg-green-500 border-green-500 text-white" : "border-slate-300 dark:border-slate-600 hover:border-green-500"
          )}
        >
          {isDone && <CheckCircle2 size={14} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={cn("text-[13px] font-bold leading-tight", isDone ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100")}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 italic">
              {task.description}
            </p>
          )}
        </div>

        {!isOverlay && (
          <div className="flex items-center gap-1 shrink-0 opacity-100">
            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onEdit(task)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit3 size={14} /></button>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDelete(task)} className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={14} /></button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-8">
        {isDMO && <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-widest border border-indigo-100 dark:border-transparent">DMO</span>}
        
        {task.linkedPostId && (
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => navigate(`/journal?post=${task.linkedPostId}`)}
            className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tight hover:underline transition-all border border-amber-100 dark:border-transparent"
          >
            < BookText size={10} /> Note
          </button>
        )}

        {taskTag && <TagChip tag={taskTag} className="!text-[8px] !px-1.5 !py-0.5" />}
        
        {task.deadlineAt && (
          <span className={cn("flex items-center gap-1 px-1 py-0.5 rounded font-bold text-[8px] uppercase", isOverdue ? "text-red-500" : "text-slate-400")}>
            <Clock size={10} /> {format(new Date(task.deadlineAt), 'HH:mm dd/MM')}
          </span>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const viewDate = dateParam || todayStr;
  
  const { tags } = useTags('task');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [journalPosts, setJournalPosts] = useState<JournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formTagId, setFormTagId] = useState<string | null>(null);
  const [formLinkedPostId, setFormLinkedPostId] = useState<string | null>(null);
  const [formQuadrant, setFormQuadrant] = useState<TaskQuadrant>(TaskQuadrant.DO_NOW);
  const [saving, setSaving] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const [activeTask, setActiveTask] = useState<DailyTask | null>(null);
  
  const dmoInitialized = useRef<string | null>(null);

  const supabase = getSupabaseClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchJournalPosts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('journal_post')
      .select('id, title, topic_id, journal_topic(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setJournalPosts(data);
  }, [supabase, user]);

  const refreshTasks = useCallback(async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    try {
      if (dmoInitialized.current !== viewDate) {
        dmoInitialized.current = viewDate;
        await ensureDailyTasksForDate(viewDate);
      }

      const { data, error: fetchError } = await supabase
        .from('daily_task')
        .select(`*`)
        .eq('user_id', user.id)
        .or(`status.eq.pending,date.eq.${viewDate}`)
        .order('order_index', { ascending: true });

      if (!fetchError && data) {
        const mappedData = data.map((t: any) => ({
          ...t, 
          status: t.status as TaskStatus, 
          deadlineAt: t.deadline_at, 
          tag_id: t.tag_id, 
          linkedPostId: t.linked_post_id,
          sourceTemplateId: t.source_template_id, // Quan trọng: Ánh xạ source_template_id sang sourceTemplateId
          createdAt: t.created_at, 
          updatedAt: t.updated_at
        })) as DailyTask[];

        const filteredTasks = mappedData.filter(task => {
          const isDMO = !!task.sourceTemplateId;
          const isSameDay = task.date === viewDate;
          if (task.status === TaskStatus.DONE) return isSameDay;
          if (task.status === TaskStatus.TODO) return isDMO ? isSameDay : true;
          return false;
        });
        setTasks(filteredTasks);
      }
    } catch (err) {} finally {
      setLoading(false);
    }
  }, [viewDate, supabase, user]);

  useEffect(() => { 
    if (user) {
      refreshTasks(); 
      fetchJournalPosts();
    }
  }, [refreshTasks, fetchJournalPosts, user]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !user || isMobile) return;
    const taskId = active.id as string;
    const newQuadrant = over.id as TaskQuadrant;
    if (active.data.current?.task.quadrant !== newQuadrant) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, quadrant: newQuadrant } : t));
      await supabase.from('daily_task').update({ quadrant: newQuadrant }).eq('id', taskId).eq('user_id', user.id);
    }
  };

  const toggleTask = async (task: DailyTask) => {
    if (!user) return;
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    await supabase.from('daily_task').update({ status: newStatus }).eq('id', task.id).eq('user_id', user.id);
    
    // Ghi vào task_completions khi hoàn thành task (để hiện notification và leaderboard)
    if (newStatus === TaskStatus.DONE) {
      await supabase.from('task_completions').insert({
        user_id: user.id,
        task_id: task.id,
        task_title: task.title,
        quadrant: task.quadrant,
        completed_at: new Date().toISOString()
      });
    } else {
      // Nếu undo (chuyển về TODO), xóa record completion gần nhất
      await supabase
        .from('task_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('task_id', task.id)
        .order('completed_at', { ascending: false })
        .limit(1);
    }
  };

  const deleteTask = async (task: DailyTask) => {
    if (!user || !confirm('Xoá nhiệm vụ này?')) return;
    setTasks(prev => prev.filter(t => t.id !== task.id));
    await supabase.from('daily_task').delete().eq('id', task.id).eq('user_id', user.id);
  };

  const openEditModal = (task: DailyTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormDeadline(task.deadlineAt ? format(new Date(task.deadlineAt), "yyyy-MM-dd'T'HH:mm") : '');
    setFormTagId(task.tag_id || null);
    setFormLinkedPostId(task.linkedPostId || null);
    setFormQuadrant(task.quadrant);
    setErrorInfo(null);
    setShowEditModal(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !formTitle.trim() || !user) return;
    setSaving(true);
    setErrorInfo(null);
    
    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        deadline_at: formDeadline ? new Date(formDeadline).toISOString() : null,
        tag_id: formTagId || null, 
        linked_post_id: formLinkedPostId || null,
        quadrant: formQuadrant
      };

      const { error } = await supabase
        .from('daily_task')
        .update(payload)
        .eq('id', editingTask.id)
        .eq('user_id', user.id);

      if (!error) {
        await refreshTasks(true);
        setShowEditModal(false);
      } else {
        setErrorInfo(error.message);
      }
    } catch (err: any) {
      setErrorInfo(err.message);
    } finally {
      setSaving(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col gap-3 min-h-0">
      <AddTaskScreen onTaskAdded={() => refreshTasks(true)} />
      
      <div className="bg-white dark:bg-[#1e1f20] p-4 rounded-xl border border-slate-200 dark:border-[#333537] shadow-sm">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
          <Filter size={12} /> Lọc theo Tag
        </h3>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => { setSelectedTagId(null); setShowMobileSidebar(false); }}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border shadow-sm",
              !selectedTagId ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-transparent hover:bg-slate-50"
            )}
          >
            Tất cả
          </button>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => { setSelectedTagId(selectedTagId === tag.id ? null : tag.id); setShowMobileSidebar(false); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all border shadow-sm",
                selectedTagId === tag.id 
                  ? "bg-indigo-600 text-white border-indigo-600" 
                  : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-transparent hover:bg-slate-50"
              )}
            >
              <span>{tag.icon}</span> {tag.name}
            </button>
          ))}
        </div>
      </div>

      <Link to="/dmo/setup" onClick={() => setShowMobileSidebar(false)} className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#333537] rounded-2xl text-indigo-600 font-bold text-[10px] uppercase shadow-sm hover:shadow-md transition-all">
        <LayoutGrid size={14} /> Thiết lập DMO lặp lại
      </Link>
    </div>
  );

  const filteredByTagTasks = selectedTagId 
    ? tasks.filter(t => t.tag_id === selectedTagId)
    : tasks;

  if (loading && tasks.length === 0) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100/50 dark:bg-slate-950 transition-colors p-3 lg:p-4 gap-4 relative">
      <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-3 min-h-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
        <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={(e) => !isMobile && setActiveTask(e.active.data.current?.task)} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 pb-24">
            {(Object.keys(QUADRANT_UI) as TaskQuadrant[]).map(q => {
              const qTasks = filteredByTagTasks
                .filter(t => t.quadrant === q)
                .sort((a, b) => {
                  if (a.status !== b.status) return a.status === TaskStatus.TODO ? -1 : 1;
                  if (!!a.deadlineAt !== !!b.deadlineAt) return a.deadlineAt ? -1 : 1;
                  if (a.deadlineAt && b.deadlineAt) {
                    return new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
                  }
                  return 0;
                });
                
              const doneTasks = qTasks.filter(t => t.status === TaskStatus.DONE);
              const total = qTasks.length;
              const percent = total > 0 ? Math.round((doneTasks.length / total) * 100) : 0;
              const ui = QUADRANT_UI[q];
              
              return (
                <DroppableQuadrant key={q} quadrant={q} disabled={isMobile} className={cn("rounded-[1.5rem] border-2 flex flex-col p-4 shadow-sm h-fit transition-all", ui.color.replace('bg-red-50/30', 'bg-red-50/50').replace('bg-blue-50/30', 'bg-blue-50/50').replace('bg-yellow-50/30', 'bg-yellow-50/50').replace('bg-slate-50/30', 'bg-slate-100/30'), "border-slate-300/40 dark:border-transparent")}>
                  <div className="mb-3 flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full shadow-sm", ui.dot)} />
                      <h3 className="font-black uppercase text-[10px] tracking-widest opacity-90">{ui.label}</h3>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black opacity-80">{doneTasks.length}/{total} — {percent}% {getProgressEmoji(percent)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {qTasks.map(task => (
                      <DraggableTask key={task.id} task={task} disabled={isMobile}>
                        <SortableTaskCard task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={openEditModal} tags={tags} />
                      </DraggableTask>
                    ))}
                    {qTasks.length === 0 && (
                      <div className="h-16 border-2 border-dashed border-current opacity-10 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest italic">Trống</div>
                    )}
                  </div>
                </DroppableQuadrant>
              );
            })}
          </div>
          <DragOverlay>
            {!isMobile && activeTask && <div className="w-[280px] pointer-events-none"><SortableTaskCard task={activeTask} onToggle={()=>{}} onDelete={()=>{}} onEdit={()=>{}} tags={tags} isOverlay /></div>}
          </DragOverlay>
        </DndContext>
      </div>

      <button 
        onClick={() => setShowMobileSidebar(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-95 hover:scale-105 transition-all z-[200]"
      >
        <Plus size={28} />
      </button>

      {showMobileSidebar && (
        <div className="fixed inset-0 z-[300] lg:hidden flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)} />
          <div className="relative bg-white dark:bg-[#1e1f20] w-full max-w-lg rounded-t-[2rem] sm:rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Bảng điều khiển</h3>
              <button onClick={() => setShowMobileSidebar(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !saving && setShowEditModal(false)} />
          <div className="relative bg-white dark:bg-[#1e1f20] rounded-[2rem] w-full max-w-sm shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Sửa nhiệm vụ</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={20} className="text-slate-400"/></button>
            </div>
            
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {errorInfo && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-[10px] font-bold border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-in shake duration-300">
                  <AlertCircle size={14} />
                  <span>{errorInfo}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Tiêu đề</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2.5 px-4 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 ring-indigo-500 text-sm font-bold" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1"><AlignLeft size={10}/> Mô tả</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2.5 px-4 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 ring-indigo-500 text-[11px] font-medium resize-none" placeholder="Thêm mô tả..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Hạn chót</label>
                  <input type="datetime-local" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2.5 px-3 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 ring-indigo-500 text-[10px] font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Ma trận</label>
                  <select value={formQuadrant} onChange={e => setFormQuadrant(e.target.value as TaskQuadrant)} className="w-full h-[38px] bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 text-[10px] font-bold uppercase ring-1 ring-slate-200 dark:ring-slate-700 outline-none">
                    {Object.entries(QUADRANT_UI).map(([val, ui]) => <option key={val} value={val}>{ui.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <AddTaskScreen.TagSelectorWrapper 
                  category="task"
                  selectedTagId={formTagId} 
                  onSelect={setFormTagId}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-1"><BookText size={10}/> Liên kết Note</label>
                <select value={formLinkedPostId || ''} onChange={e => setFormLinkedPostId(e.target.value || null)} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2.5 px-4 outline-none ring-1 ring-slate-200 dark:ring-slate-700 text-[11px] font-bold">
                  <option value="">-- Không liên kết --</option>
                  {journalPosts.map(p => <option key={p.id} value={p.id}>[{(p as any).journal_topic?.name}] {p.title || 'Ghi chép'}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black text-[10px] uppercase">Hủy</button>
              <button onClick={handleUpdateTask} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-indigo-500/20">
                {saving ? <Loader2 size={12} className="animate-spin mx-auto"/> : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;