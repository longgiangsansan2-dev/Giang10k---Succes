"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu, NodeViewWrapper, ReactNodeViewRenderer, Node, mergeAttributes } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Heading } from '@tiptap/extension-heading';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import { FloatingMenu as FloatingMenuExtension } from '@tiptap/extension-floating-menu';
import { 
  Bold, Italic, Underline as UnderlineIcon,
  Highlighter, Image as ImageIcon,
  List, ListOrdered, ListChecks, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, Trash2, AlignLeft, AlignCenter, AlignRight,
  Table as TableIcon, Code, Terminal,
  X, ZoomIn, PanelRight, PanelLeft, PanelLeftClose, Download,
  Type, Box, Info, AlertTriangle, CheckCircle2, XCircle, Lightbulb,
  Minus, MoreHorizontal, ChevronDown
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  isFullscreen?: boolean;
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const generateSlug = (text: string) => {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

// ============ HIGHLIGHT COLORS ============
const HIGHLIGHT_COLORS = [
  { name: 'Vàng', color: '#FEF08A', textColor: '#713F12' },
  { name: 'Xanh lá', color: '#BBF7D0', textColor: '#14532D' },
  { name: 'Xanh dương', color: '#BFDBFE', textColor: '#1E3A8A' },
  { name: 'Tím', color: '#DDD6FE', textColor: '#4C1D95' },
  { name: 'Hồng', color: '#FBCFE8', textColor: '#831843' },
  { name: 'Cam', color: '#FED7AA', textColor: '#7C2D12' },
  { name: 'Đỏ nhạt', color: '#FECACA', textColor: '#7F1D1D' },
  { name: 'Xám', color: '#E5E7EB', textColor: '#1F2937' },
];

// ============ TEXT COLORS ============
const TEXT_COLORS = [
  { name: 'Mặc định', color: null },
  { name: 'Xám', color: '#9CA3AF' },
  { name: 'Nâu', color: '#D97706' },
  { name: 'Cam', color: '#EA580C' },
  { name: 'Vàng', color: '#EAB308' },
  { name: 'Xanh lá', color: '#22C55E' },
  { name: 'Xanh dương', color: '#3B82F6' },
  { name: 'Tím', color: '#8B5CF6' },
  { name: 'Hồng', color: '#EC4899' },
  { name: 'Đỏ', color: '#EF4444' },
];

// ============ CALLOUT TYPES ============
const CALLOUT_TYPES = [
  { type: 'info', icon: Info, label: 'Thông tin', bg: '#1E3A5F', border: '#3B82F6', iconColor: '#60A5FA' },
  { type: 'success', icon: CheckCircle2, label: 'Thành công', bg: '#14432A', border: '#22C55E', iconColor: '#4ADE80' },
  { type: 'warning', icon: AlertTriangle, label: 'Cảnh báo', bg: '#422006', border: '#F59E0B', iconColor: '#FBBF24' },
  { type: 'error', icon: XCircle, label: 'Lỗi', bg: '#450A0A', border: '#EF4444', iconColor: '#F87171' },
  { type: 'tip', icon: Lightbulb, label: 'Mẹo hay', bg: '#2E1065', border: '#8B5CF6', iconColor: '#A78BFA' },
];

// ============ CALLOUT EXTENSION ============
const CalloutComponent = ({ node, updateAttributes, deleteNode, editor }: any) => {
  const calloutType = CALLOUT_TYPES.find(c => c.type === node.attrs.type) || CALLOUT_TYPES[0];
  const Icon = calloutType.icon;
  
  return (
    <NodeViewWrapper className="my-4 group">
      <div 
        className="rounded-xl border-l-4 p-4 flex gap-3 relative"
        style={{ backgroundColor: calloutType.bg, borderLeftColor: calloutType.border }}
      >
        <div className="shrink-0 mt-0.5" style={{ color: calloutType.iconColor }}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0 text-neutral-200 text-sm leading-relaxed" data-node-view-content="" />
        <button 
          onClick={deleteNode} 
          className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all absolute top-2 right-2"
        >
          <X size={16} />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  
  addAttributes() {
    return {
      type: { default: 'info' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },
});

// ============ IMAGE COMPONENT ============
const compressImage = (file: File, maxWidth = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Cannot get canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

let draggingImageData: { src: string; width: string; align: string; pos: number } | null = null;

const ImageComponent = ({ node, deleteNode, selected, updateAttributes, getPos }: any) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const openLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('editor:open-lightbox', { detail: node.attrs.src }));
  };

  const openPreviewPanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('editor:preview-image', { detail: node.attrs.src }));
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    draggingImageData = { src: node.attrs.src, width: node.attrs.width || '100%', align: node.attrs.align || 'center', pos: getPos() };
    e.dataTransfer.setData('application/x-tiptap-image', 'true');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setTimeout(() => { draggingImageData = null; }, 100);
  };

  return (
    <NodeViewWrapper className={cn("relative my-6 group flex transition-all", node.attrs.align === 'center' ? "justify-center" : node.attrs.align === 'right' ? "justify-end" : "justify-start", isDragging && "opacity-30")}>
      <div 
        className="relative inline-block overflow-visible" 
        onMouseEnter={() => setShowToolbar(true)} 
        onMouseLeave={() => setShowToolbar(false)} 
        draggable 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className={cn("absolute -top-3 -left-3 w-8 h-8 bg-neutral-900 text-white rounded-xl flex items-center justify-center cursor-grab z-10 transition-all shadow-xl border border-neutral-700 hover:scale-110", (showToolbar || selected) ? "opacity-100 scale-100" : "opacity-0 scale-75")} title="Kéo để di chuyển">
          <span className="text-xs">⋮⋮</span>
        </div>

        {(showToolbar || selected) && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 text-white px-2 py-1.5 rounded-2xl shadow-2xl z-[60] animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-0.5 border-r border-neutral-800 pr-1 mr-1">
              {['25%', '50%', '75%', '100%'].map((size) => (
                <button key={size} type="button" onClick={() => updateAttributes({ width: size })} className={cn("px-2 py-1 text-[9px] font-black rounded-lg hover:bg-neutral-800 transition-colors uppercase tracking-tight", node.attrs.width === size ? "text-indigo-400 bg-neutral-800" : "text-neutral-500")}>
                  {size === '25%' ? 'S' : size === '50%' ? 'M' : size === '75%' ? 'L' : 'XL'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 border-r border-neutral-800 pr-1 mr-1">
              <button type="button" onClick={() => updateAttributes({ align: 'left' })} className={cn("p-1.5 rounded-lg hover:bg-neutral-800", node.attrs.align === 'left' ? "text-indigo-400 bg-neutral-800" : "text-neutral-500")}><AlignLeft size={14} /></button>
              <button type="button" onClick={() => updateAttributes({ align: 'center' })} className={cn("p-1.5 rounded-lg hover:bg-neutral-800", node.attrs.align === 'center' ? "text-indigo-400 bg-neutral-800" : "text-neutral-500")}><AlignCenter size={14} /></button>
              <button type="button" onClick={() => updateAttributes({ align: 'right' })} className={cn("p-1.5 rounded-lg hover:bg-neutral-800", node.attrs.align === 'right' ? "text-indigo-400 bg-neutral-800" : "text-neutral-500")}><AlignRight size={14} /></button>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={openPreviewPanel} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500" title="Xem chi tiết"><PanelRight size={14} /></button>
              <button type="button" onClick={openLightbox} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500" title="Phóng to"><ZoomIn size={14} /></button>
              <button type="button" onClick={deleteNode} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Xóa"><Trash2 size={14} /></button>
            </div>
          </div>
        )}

        <img 
          src={node.attrs.src} 
          alt="" 
          onClick={openPreviewPanel} 
          onDoubleClick={openLightbox} 
          style={{ width: node.attrs.width || '100%', maxWidth: '100%', cursor: 'pointer' }} 
          className={cn(
            "rounded-2xl shadow-lg border-2 transition-all duration-300", 
            selected ? "border-indigo-500 ring-8 ring-indigo-500/10 scale-[0.99]" : "border-transparent group-hover:shadow-2xl"
          )} 
          draggable={false} 
        />
      </div>
    </NodeViewWrapper>
  );
};

const CustomImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), width: { default: '100%', renderHTML: a => ({ style: `width: ${a.width}` }) }, align: { default: 'center', renderHTML: a => ({ 'data-align': a.align }) } }; },
  addNodeView() { return ReactNodeViewRenderer(ImageComponent); },
});

const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = this.options.levels.includes(node.attrs.level) ? node.attrs.level : this.options.levels[0];
    return [`h${level}`, { ...HTMLAttributes, id: generateSlug(node.textContent) }, 0];
  },
});

// ============ MENU BUTTON ============
const MenuButton = ({ onClick, isActive, children, title, disabled }: { onClick: () => void; isActive?: boolean; children?: React.ReactNode; title: string; disabled?: boolean }) => (
  <button 
    type="button" 
    onClick={onClick} 
    title={title} 
    disabled={disabled}
    className={cn(
      "p-2 rounded-xl transition-all", 
      isActive ? "bg-indigo-600/20 text-indigo-400" : "hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200",
      disabled && "opacity-30 cursor-not-allowed"
    )}
  >
    {children}
  </button>
);

// ============ COLOR PICKER DROPDOWN ============
const ColorPickerDropdown = ({ type, onSelect, children }: { type: 'text' | 'highlight'; onSelect: (color: string | null, textColor?: string) => void; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = type === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS;
  
  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl transition-all hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 flex items-center gap-1">
        {children}
        <ChevronDown size={12} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[400]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-2xl z-[401] min-w-[200px] animate-in fade-in slide-in-from-top-2">
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 px-1">
              {type === 'text' ? 'Màu chữ' : 'Highlight màu nền'}
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {colors.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (type === 'highlight') {
                      onSelect(c.color, (c as any).textColor);
                    } else {
                      onSelect(c.color);
                    }
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded-lg border-2 border-neutral-700 transition-all hover:scale-110 hover:border-white flex items-center justify-center"
                  style={{ backgroundColor: c.color || '#374151' }}
                  title={c.name}
                >
                  {!c.color && <X size={12} className="text-neutral-400" />}
                </button>
              ))}
            </div>
            {type === 'highlight' && (
              <button
                type="button"
                onClick={() => { onSelect(null); setIsOpen(false); }}
                className="w-full mt-2 px-3 py-2 text-[10px] font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all border border-neutral-700"
              >
                Xóa highlight
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============ CALLOUT PICKER ============
const CalloutPicker = ({ onSelect }: { onSelect: (type: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl transition-all hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 flex items-center gap-1" title="Callout box">
        <Box size={18} />
        <ChevronDown size={12} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[400]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-xl p-2 shadow-2xl z-[401] min-w-[180px] animate-in fade-in slide-in-from-top-2">
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2 px-2">Callout Box</p>
            {CALLOUT_TYPES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.type}
                  type="button"
                  onClick={() => { onSelect(c.type); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition-all"
                >
                  <Icon size={16} style={{ color: c.iconColor }} />
                  <span className="text-xs font-semibold text-neutral-300">{c.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ============ MAIN EDITOR ============
export default function RichTextEditor({ content, onChange, onBlur, placeholder, isFullscreen: isFullscreenProp = false }: RichTextEditorProps) {
  const [localIsFullscreen, setLocalIsFullscreen] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('editorPreviewPanelWidth') || '450');
    }
    return 450;
  });
  const [isResizing, setIsResizing] = useState(false);

  const isFullscreen = isFullscreenProp || localIsFullscreen;

  useEffect(() => {
    setMounted(true);
    const handleOpenLightbox = (e: any) => setLightboxImage(e.detail);
    const handlePreviewImage = (e: any) => { setPreviewImage(e.detail); setShowTOC(false); };
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') { setLightboxImage(null); setPreviewImage(null); setShowTOC(false); } 
    };
    window.addEventListener('editor:open-lightbox', handleOpenLightbox);
    window.addEventListener('editor:preview-image', handlePreviewImage);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('editor:open-lightbox', handleOpenLightbox);
      window.removeEventListener('editor:preview-image', handlePreviewImage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Scroll Spy
  useEffect(() => {
    if (!mounted || !isFullscreen) return;
    
    let observer: IntersectionObserver | null = null;
    const timeout = setTimeout(() => {
      const headings = document.querySelectorAll('.ProseMirror h1[id], .ProseMirror h2[id], .ProseMirror h3[id]');
      if (headings.length === 0) return;
      
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter(e => e.isIntersecting);
          if (visible.length > 0) {
            const sorted = [...visible].sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
            setActiveHeadingId(sorted[0].target.id);
          }
        },
        { rootMargin: '-100px 0% -60% 0%', threshold: [0, 0.25, 0.5, 0.75, 1] }
      );
      headings.forEach((h) => observer?.observe(h));
    }, 200);

    return () => { clearTimeout(timeout); observer?.disconnect(); };
  }, [mounted, isFullscreen, content, showTOC]);

  // Resize Handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 900) setPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('editorPreviewPanelWidth', panelWidth.toString());
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, panelWidth]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      CustomHeading.configure({ levels: [1, 2, 3] }),
      Underline,
      CustomImage.configure({ allowBase64: true }),
      Dropcursor.configure({ color: '#6366f1', width: 2 }),
      Highlight.configure({ multicolor: true }),
      TextStyle, 
      Color,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-indigo-400 underline font-semibold hover:text-indigo-300' } }),
      Placeholder.configure({ placeholder: placeholder || 'Bắt đầu viết...' }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      TaskList.configure({ HTMLAttributes: { class: 'not-prose' } }),
      TaskItem.configure({ nested: true }),
      Callout,
      BubbleMenuExtension,
      FloatingMenuExtension,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: { 
        class: cn(
          'prose prose-invert max-w-none focus:outline-none',
          'prose-headings:font-black prose-headings:tracking-tight',
          'prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8',
          'prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6',
          'prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4',
          'prose-p:text-neutral-300 prose-p:leading-relaxed',
          'prose-strong:text-white prose-strong:font-bold',
          'prose-code:text-indigo-400 prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
          'prose-pre:bg-neutral-900 prose-pre:rounded-xl prose-pre:p-4',
          'prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/10 prose-blockquote:pl-4 prose-blockquote:py-3 prose-blockquote:my-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-neutral-300',
          'prose-ul:list-disc prose-ol:list-decimal',
          'prose-li:text-neutral-300 prose-li:marker:text-neutral-500',
          isFullscreen ? 'min-h-[60vh]' : 'min-h-[300px] p-4'
        ) 
      },
      handlePaste: (v, e) => {
        if (draggingImageData) return true;
        const items = e.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            e.preventDefault();
            const file = items[i].getAsFile();
            if (file) compressImage(file).then(base64 => editor?.chain().focus().setImage({ src: base64 }).run());
            return true;
          }
        }
        return false;
      },
      handleDrop: (v, e) => {
        if (e.dataTransfer?.getData('application/x-tiptap-image') && draggingImageData) {
          e.preventDefault();
          const coords = v.posAtCoords({ left: e.clientX, top: e.clientY });
          if (coords) {
            const tr = v.state.tr;
            const oldNode = v.state.doc.nodeAt(draggingImageData.pos);
            if (oldNode) {
              let dropPos = coords.pos;
              if (dropPos > draggingImageData.pos) dropPos -= oldNode.nodeSize;
              tr.delete(draggingImageData.pos, draggingImageData.pos + oldNode.nodeSize);
              tr.insert(Math.min(dropPos, tr.doc.content.size), v.state.schema.nodes.image.create({ src: draggingImageData.src, width: draggingImageData.width, align: draggingImageData.align }));
              v.dispatch(tr);
              draggingImageData = null;
            }
          }
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => { if (editor && content !== editor.getHTML()) editor.commands.setContent(content); }, [content, editor]);

  const getTableOfContents = useCallback(() => {
    if (!editor) return [];
    const headings: { level: number; text: string; id: string }[] = [];
    editor.state.doc.descendants((n) => { if (n.type.name === 'heading') headings.push({ level: n.attrs.level, text: n.textContent, id: generateSlug(n.textContent) }); });
    return headings;
  }, [editor]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveHeadingId(id);
  };

  const uploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) for (const file of Array.from(files)) {
        try { editor?.chain().focus().setImage({ src: await compressImage(file) }).run(); } catch {}
      }
    };
    input.click();
  };

  const insertCallout = (type: string) => {
    editor?.chain().focus().insertContent({ type: 'callout', attrs: { type } }).run();
  };

  if (!editor) return null;

  const currentTOC = getTableOfContents();

  return (
    <div className={cn("flex flex-col bg-transparent overflow-hidden", isFullscreen && !isFullscreenProp && "fixed inset-0 z-[100] bg-[#131314]")}>
      
      {/* TOOLBAR */}
      {isFullscreenProp && (
        <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-neutral-800 bg-transparent overflow-x-auto">
          <div className="flex items-center gap-0.5 flex-wrap">
            <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác"><Undo size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Làm lại"><Redo size={18} /></MenuButton>
            
            <div className="w-px h-5 bg-neutral-800 mx-1.5" />
            
            <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="In đậm"><Bold size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="In nghiêng"><Italic size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Gạch chân"><UnderlineIcon size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Gạch ngang"><Minus size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code"><Code size={18} /></MenuButton>
            
            <div className="w-px h-5 bg-neutral-800 mx-1.5" />
            
            <ColorPickerDropdown 
              type="text" 
              onSelect={(color) => color ? editor.chain().focus().setColor(color).run() : editor.chain().focus().unsetColor().run()}
            >
              <Type size={18} />
            </ColorPickerDropdown>
            
            <ColorPickerDropdown 
              type="highlight" 
              onSelect={(color, textColor) => {
                if (color) {
                  editor.chain().focus().setHighlight({ color }).run();
                  if (textColor) editor.chain().focus().setColor(textColor).run();
                } else {
                  editor.chain().focus().unsetHighlight().run();
                }
              }}
            >
              <Highlighter size={18} />
            </ColorPickerDropdown>
            
            <div className="w-px h-5 bg-neutral-800 mx-1.5" />
            
            <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="H1"><Heading1 size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="H2"><Heading2 size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="H3"><Heading3 size={18} /></MenuButton>
            
            <div className="w-px h-5 bg-neutral-800 mx-1.5" />
            
            <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Danh sách"><List size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Số thứ tự"><ListOrdered size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Checklist"><ListChecks size={18} /></MenuButton>
            
            <div className="w-px h-5 bg-neutral-800 mx-1.5" />
            
            <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Trích dẫn"><Quote size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code block"><Terminal size={18} /></MenuButton>
            <CalloutPicker onSelect={insertCallout} />
            <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ"><MoreHorizontal size={18} /></MenuButton>
            
            <div className="w-px h-5 bg-neutral-800 mx-1.5" />
            
            <MenuButton onClick={uploadImage} title="Chèn ảnh"><ImageIcon size={18} /></MenuButton>
            <MenuButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Bảng"><TableIcon size={18} /></MenuButton>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {currentTOC.length > 0 && (
              <button onClick={() => setShowTOC(!showTOC)} className={cn("p-2 rounded-xl transition-all flex items-center gap-2", showTOC ? "bg-indigo-600/20 text-indigo-400" : "text-neutral-500 hover:text-white")}>
                {showTOC ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                <span className="text-[10px] font-bold hidden sm:inline">{currentTOC.length}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* TOC Sidebar */}
        {mounted && showTOC && isFullscreen && !previewImage && createPortal(
          <div className="fixed left-0 top-[60px] bottom-0 w-72 bg-[#171717] border-r border-neutral-800 flex flex-col z-[300] shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">📑 Mục lục</span>
              <button onClick={() => setShowTOC(false)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {currentTOC.map((h, i) => (
                <button 
                  key={i} 
                  onClick={() => scrollToHeading(h.id)} 
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-xs truncate block mb-1 transition-all relative",
                    activeHeadingId === h.id ? "bg-indigo-600/20 text-indigo-400 font-bold" : "hover:bg-neutral-800 text-neutral-400",
                    h.level === 1 ? "font-black" : h.level === 2 ? "pl-6" : "pl-9"
                  )}
                >
                  {activeHeadingId === h.id && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-full" />}
                  {h.text}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}

        {/* Floating TOC */}
        {mounted && isFullscreen && currentTOC.length > 2 && !showTOC && !previewImage && createPortal(
          <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[300] flex flex-col items-end gap-1 group">
            {currentTOC.map((h, i) => (
              <button
                key={i}
                onClick={() => scrollToHeading(h.id)}
                className={cn(
                  "transition-all rounded-full hover:scale-150",
                  activeHeadingId === h.id ? "w-3 h-3 bg-indigo-500 shadow-lg shadow-indigo-500/50" : "w-2 h-2 bg-neutral-600 hover:bg-indigo-400",
                  h.level === 1 ? "" : h.level === 2 ? "mr-1" : "mr-2"
                )}
                title={h.text}
              />
            ))}
          </div>,
          document.body
        )}

        {/* Editor Normal Mode */}
        {!previewImage && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <EditorContent editor={editor} />
          </div>
        )}

        {/* Split View Mode */}
        {mounted && previewImage && createPortal(
          <div className="fixed inset-0 z-[300] flex bg-[#131314] animate-in fade-in duration-200">
            {isResizing && <div className="fixed inset-0 z-[350] cursor-col-resize" />}
            
            <div className={cn("flex-1 overflow-y-auto custom-scrollbar bg-[#131314]", isResizing && "select-none pointer-events-none")} style={{ marginRight: `${panelWidth}px` }}>
              <div className="max-w-4xl mx-auto px-6 py-8">
                <EditorContent editor={editor} />
              </div>
            </div>

            <div style={{ width: `${panelWidth}px` }} className={cn("fixed right-0 top-0 bottom-0 bg-[#0a0a0a] border-l border-neutral-800 flex flex-col shadow-2xl", isResizing && "transition-none")}>
               <div onMouseDown={handleMouseDown} className={cn("absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-[360] group flex items-center justify-center", isResizing ? "bg-indigo-500/30" : "hover:bg-indigo-500/20")}>
                 <div className={cn("w-1 h-16 rounded-full transition-all", isResizing ? "bg-indigo-500" : "bg-neutral-700 group-hover:bg-indigo-400")} />
               </div>

               <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Xem ảnh</span>
                 <div className="flex items-center gap-2">
                   <span className="text-[9px] text-neutral-600 font-mono">{panelWidth}px</span>
                   <a href={previewImage} download="image.jpg" className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400"><Download size={18} /></a>
                   <button onClick={() => setPreviewImage(null)} className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400"><X size={20} /></button>
                 </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center relative">
                  {isResizing && <div className="absolute inset-0 z-10" />}
                  <img src={previewImage} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-neutral-800 cursor-zoom-in" onClick={() => { setLightboxImage(previewImage); setPreviewImage(null); }} alt="" />
                  <p className="mt-4 text-[9px] text-neutral-600 font-bold uppercase text-center">Click để xem full · Kéo để resize</p>
               </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* LIGHTBOX */}
      {mounted && lightboxImage && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/98 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 p-3 rounded-2xl bg-neutral-900 text-white border border-neutral-700" onClick={() => setLightboxImage(null)}><X size={28} /></button>
          <img src={lightboxImage} alt="" className="max-w-[98vw] max-h-[98vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}

      {/* BUBBLE MENU */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150, zIndex: 500 }}>
          <div className="flex items-center gap-0.5 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 p-1.5 rounded-2xl shadow-2xl">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-2 rounded-xl", editor.isActive('bold') ? "text-indigo-400 bg-indigo-500/20" : "text-neutral-400 hover:text-white")}><Bold size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-2 rounded-xl", editor.isActive('italic') ? "text-indigo-400 bg-indigo-500/20" : "text-neutral-400 hover:text-white")}><Italic size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn("p-2 rounded-xl", editor.isActive('underline') ? "text-indigo-400 bg-indigo-500/20" : "text-neutral-400 hover:text-white")}><UnderlineIcon size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={cn("p-2 rounded-xl", editor.isActive('strike') ? "text-indigo-400 bg-indigo-500/20" : "text-neutral-400 hover:text-white")}><Minus size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleCode().run()} className={cn("p-2 rounded-xl", editor.isActive('code') ? "text-indigo-400 bg-indigo-500/20" : "text-neutral-400 hover:text-white")}><Code size={16} /></button>
            
            <div className="w-px h-4 bg-neutral-800 mx-1" />
            
            {HIGHLIGHT_COLORS.slice(0, 5).map((c, i) => (
              <button key={i} onClick={() => editor.chain().focus().setHighlight({ color: c.color }).setColor(c.textColor).run()} className="w-6 h-6 rounded-lg border border-neutral-700 hover:scale-110 transition-all" style={{ backgroundColor: c.color }} title={c.name} />
            ))}
            <button onClick={() => editor.chain().focus().unsetHighlight().unsetColor().run()} className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800" title="Xóa"><X size={14} /></button>
            
            <div className="w-px h-4 bg-neutral-800 mx-1" />
            
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("p-2 rounded-xl text-[10px] font-black", editor.isActive('heading', { level: 1 }) ? "text-indigo-400 bg-indigo-500/20" : "text-neutral-400 hover:text-white")}>H1</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("p-2 rounded-xl text-[10px] font-black", editor.isActive('heading', { level: 2 }) ? "text-indigo-400 bg-indigo-500/20" : "text-neutral-400 hover:text-white")}>H2</button>
          </div>
        </BubbleMenu>
      )}

      {/* FLOATING MENU */}
      {editor && isFullscreenProp && (
        <FloatingMenu editor={editor} tippyOptions={{ duration: 150, zIndex: 500 }}>
          <div className="flex items-center gap-1 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 p-1.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"><Heading1 size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"><Heading2 size={18} /></button>
            <div className="w-px h-4 bg-neutral-800" />
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"><List size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleTaskList().run()} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"><ListChecks size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"><Quote size={18} /></button>
            <div className="w-px h-4 bg-neutral-800" />
            <button onClick={uploadImage} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"><ImageIcon size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"><Terminal size={18} /></button>
            <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"><TableIcon size={18} /></button>
          </div>
        </FloatingMenu>
      )}
    </div>
  );
}