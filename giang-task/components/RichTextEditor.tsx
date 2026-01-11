
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
// @ts-ignore - Workaround for missing exports in some versions of @tiptap/react types
import { useEditor, EditorContent, BubbleMenu, FloatingMenu, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
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
// Fix: Import the extensions specifically required by BubbleMenu and FloatingMenu components
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import { FloatingMenu as FloatingMenuExtension } from '@tiptap/extension-floating-menu';
import { 
  Bold, Italic, Underline as UnderlineIcon,
  Highlighter, Image as ImageIcon, Link as LinkIcon,
  List, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, Trash2, AlignLeft, AlignCenter, AlignRight,
  Maximize2, Table as TableIcon,
  X, ZoomIn, PanelRight, PanelLeft, PanelLeftClose
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

const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
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
    <NodeViewWrapper className={cn("relative my-4 group flex", node.attrs.align === 'center' ? "justify-center" : node.attrs.align === 'right' ? "justify-end" : "justify-start", isDragging && "opacity-30")}>
      <div className="relative inline-block" onMouseEnter={() => setShowToolbar(true)} onMouseLeave={() => setShowToolbar(false)} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={cn("absolute -top-2 -left-2 w-7 h-7 bg-neutral-900 text-white rounded-lg flex items-center justify-center cursor-grab z-10 transition-all shadow-lg border border-neutral-700", (showToolbar || selected) ? "opacity-100 scale-100" : "opacity-0 scale-75")} title="Kéo để di chuyển">
          <span className="text-xs">⋮⋮</span>
        </div>
        {(showToolbar || selected) && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-900 border border-neutral-700 text-white px-2 py-1.5 rounded-xl shadow-2xl z-[60]">
            <div className="flex items-center gap-0.5 border-r border-neutral-700 pr-1 mr-1">
              {['25%', '50%', '75%', '100%'].map((size) => (
                <button key={size} type="button" onClick={() => updateAttributes({ width: size })} className={cn("px-2 py-1 text-[10px] font-bold rounded hover:bg-neutral-700", node.attrs.width === size && "text-indigo-400 bg-neutral-800")}>
                  {size === '25%' ? 'S' : size === '50%' ? 'M' : size === '75%' ? 'L' : 'XL'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 border-r border-neutral-700 pr-1 mr-1">
              <button type="button" onClick={() => updateAttributes({ align: 'left' })} className={cn("p-1.5 rounded hover:bg-neutral-700", node.attrs.align === 'left' && "text-indigo-400 bg-neutral-800")}><AlignLeft size={14} /></button>
              <button type="button" onClick={() => updateAttributes({ align: 'center' })} className={cn("p-1.5 rounded hover:bg-neutral-700", node.attrs.align === 'center' && "text-indigo-400 bg-neutral-800")}><AlignCenter size={14} /></button>
              <button type="button" onClick={() => updateAttributes({ align: 'right' })} className={cn("p-1.5 rounded hover:bg-neutral-700", node.attrs.align === 'right' && "text-indigo-400 bg-neutral-800")}><AlignRight size={14} /></button>
            </div>
            <button type="button" onClick={openPreviewPanel} className="p-1.5 hover:bg-neutral-700 rounded-lg" title="Xem bên phải"><PanelRight size={14} /></button>
            <button type="button" onClick={openLightbox} className="p-1.5 hover:bg-neutral-700 rounded-lg" title="Phóng to"><ZoomIn size={14} /></button>
            <button type="button" onClick={deleteNode} className="p-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg" title="Xóa"><Trash2 size={14} /></button>
          </div>
        )}
        <img src={node.attrs.src} alt="" onClick={openPreviewPanel} onDoubleClick={openLightbox} style={{ width: node.attrs.width || '100%', maxWidth: '100%', cursor: 'pointer' }} className={cn("rounded-xl shadow-lg border-2", selected ? "border-indigo-500 ring-4 ring-indigo-500/20" : "border-transparent")} draggable={false} />
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

const MenuButton = ({ onClick, isActive, children, title }: { onClick: () => void; isActive?: boolean; children?: React.ReactNode; title: string }) => (
  <button type="button" onClick={onClick} title={title} className={cn("p-2 rounded-lg transition-all", isActive ? "bg-indigo-600/20 text-indigo-400" : "hover:bg-neutral-800 text-neutral-400")}>{children}</button>
);

export default function RichTextEditor({ content, onChange, onBlur, placeholder, isFullscreen: isFullscreenProp = false }: RichTextEditorProps) {
  const [localIsFullscreen, setLocalIsFullscreen] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const isFullscreen = isFullscreenProp || localIsFullscreen;

  useEffect(() => {
    setMounted(true);
    const handleOpenLightbox = (e: any) => setLightboxImage(e.detail);
    const handlePreviewImage = (e: any) => {
      setPreviewImage(e.detail);
      setShowTOC(false); 
    };
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') { 
        setLightboxImage(null); 
        setPreviewImage(null); 
        setShowTOC(false); 
      } 
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

  // Emit event when previewImage changes to notify parent component
  useEffect(() => {
    if (mounted) {
      window.dispatchEvent(new CustomEvent('editor:preview-change', { 
        detail: { active: !!previewImage, src: previewImage } 
      }));
    }
  }, [previewImage, mounted]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      CustomHeading.configure({ levels: [1, 2, 3] }),
      Underline,
      CustomImage.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full h-auto my-4 shadow-md' }, allowBase64: true }),
      Dropcursor.configure({ color: '#6366f1', width: 2 }),
      Highlight.configure({ multicolor: true }),
      TextStyle, Color,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-indigo-500 underline font-bold' } }),
      Placeholder.configure({ placeholder: placeholder || 'Bắt đầu viết...' }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      // Fix: Register BubbleMenu and FloatingMenu extensions
      BubbleMenuExtension,
      FloatingMenuExtension,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: { class: cn('prose prose-invert max-w-none focus:outline-none text-neutral-200', isFullscreen ? 'min-h-[70vh]' : 'min-h-[250px] p-4') },
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

  const getTableOfContents = () => {
    if (!editor) return [];
    const headings: { level: number; text: string; id: string }[] = [];
    editor.state.doc.descendants((n) => { if (n.type.name === 'heading') headings.push({ level: n.attrs.level, text: n.textContent, id: generateSlug(n.textContent) }); });
    return headings;
  };

  const scrollToHeading = (id: string) => {
    if (window.innerWidth < 768) setShowTOC(false);
    const el = document.getElementById(id);
    if (!el) return;
    
    let scrollContainer = editorContainerRef.current;
    if (!scrollContainer) {
      scrollContainer = el.closest('.overflow-y-auto') as HTMLDivElement;
    }
    
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = el.getBoundingClientRect();
      const offset = elementRect.top - containerRect.top - 80;
      scrollContainer.scrollBy({ top: offset, behavior: 'smooth' });
      
      el.style.backgroundColor = 'rgba(99, 102, 241, 0.3)';
      el.style.padding = '4px 8px';
      el.style.marginLeft = '-8px';
      el.style.borderRadius = '6px';
      el.style.transition = 'all 0.3s ease';
      
      setTimeout(() => {
        el.style.backgroundColor = '';
        el.style.padding = '';
        el.style.marginLeft = '';
      }, 2000);
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  const addLink = () => {
    const url = window.prompt('Nhập URL:', editor?.getAttributes('link').href);
    if (url === null) return;
    if (url === '') editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className={cn("flex flex-col bg-[#171717] overflow-hidden", isFullscreen && !isFullscreenProp && "fixed inset-0 z-[100]", !isFullscreenProp && !isFullscreen && "rounded-2xl border border-neutral-800")}>
      
      {/* TOOLBAR */}
      {isFullscreenProp && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <button onClick={() => editor.chain().focus().undo().run()} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white"><Undo size={18} /></button>
            <button onClick={() => editor.chain().focus().redo().run()} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white"><Redo size={18} /></button>
            <span className="text-[10px] text-neutral-600 ml-4 hidden md:inline">Bôi đen để format • Click ảnh để xem • Double-click phóng to</span>
          </div>
          <div className="flex items-center gap-2">
            {previewImage && <button onClick={() => setPreviewImage(null)} className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400"><PanelRight size={18} /></button>}
            <button onClick={() => setShowTOC(!showTOC)} className={cn("p-2 rounded-lg", showTOC ? "bg-indigo-600/20 text-indigo-400" : "text-neutral-500 hover:text-white hover:bg-neutral-800")}>
              {showTOC ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
          </div>
        </div>
      )}

      {!isFullscreenProp && (
        <div className="flex items-center gap-1 p-2 border-b border-neutral-800 bg-[#1c1c1c]">
          <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={18} /></MenuButton>
          <div className="w-px h-5 bg-neutral-700 mx-1" />
          <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="H1"><Heading1 size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="H2"><Heading2 size={18} /></MenuButton>
          <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="List"><List size={18} /></MenuButton>
          <MenuButton onClick={uploadImage} title="Ảnh"><ImageIcon size={18} /></MenuButton>
          <div className="flex-1" />
          <MenuButton onClick={() => setLocalIsFullscreen(!localIsFullscreen)} title="Fullscreen"><Maximize2 size={18} /></MenuButton>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden relative flex">
        {/* EDITOR - Now layout is managed more by parent when in fullscreen */}
        <div 
          ref={editorContainerRef}
          className={cn(
            "h-full overflow-y-auto transition-all duration-300 custom-scrollbar w-full",
            isFullscreenProp ? "py-6 px-8" : ""
          )}
        >
          <div className={cn(isFullscreenProp ? "max-w-3xl mx-auto" : "w-full")}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* TOC - PORTAL - Chỉ hiện khi KHÔNG có preview ảnh */}
        {mounted && showTOC && isFullscreen && createPortal(
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#0f0f0f] border-r border-neutral-800 flex flex-col z-[200] shadow-2xl animate-slide-in-left" style={{ top: isFullscreenProp ? '57px' : '0' }}>
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">📑 Mục lục</span>
              <button onClick={() => setShowTOC(false)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {getTableOfContents().length > 0 ? getTableOfContents().map((h, i) => (
                <button key={i} onClick={() => scrollToHeading(h.id)} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-neutral-800 truncate block mb-1 transition-all", h.level === 1 && "font-bold text-white", h.level === 2 && "pl-5 text-neutral-400", h.level === 3 && "pl-8 text-neutral-500 text-xs")}>
                  {h.text || '(Không tiêu đề)'}
                </button>
              )) : <p className="text-xs text-neutral-600 text-center py-8 opacity-40 italic">Dùng H1, H2, H3 để tạo mục lục</p>}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* LIGHTBOX - PORTAL */}
      {mounted && lightboxImage && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 p-3 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-all border border-neutral-700 shadow-xl" onClick={() => setLightboxImage(null)}><X size={28} /></button>
          <img src={lightboxImage} alt="Fullscreen View" className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}

      {/* BUBBLE MENU */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 p-1.5 rounded-xl shadow-2xl">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-2 rounded-lg hover:bg-neutral-800 transition-all", editor.isActive('bold') ? "text-indigo-400" : "text-neutral-400")}><Bold size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-2 rounded-lg hover:bg-neutral-800 transition-all", editor.isActive('italic') ? "text-indigo-400" : "text-neutral-400")}><Italic size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn("p-2 rounded-lg hover:bg-neutral-800 transition-all", editor.isActive('underline') ? "text-indigo-400" : "text-neutral-400")}><UnderlineIcon size={16} /></button>
            
            <div className="w-px h-5 bg-neutral-700 mx-1" />

            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("p-2 rounded-lg hover:bg-neutral-800 text-xs font-black transition-all", editor.isActive('heading', { level: 1 }) ? "text-indigo-400" : "text-neutral-400")}>H1</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("p-2 rounded-lg hover:bg-neutral-800 text-xs font-black transition-all", editor.isActive('heading', { level: 2 }) ? "text-indigo-400" : "text-neutral-400")}>H2</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn("p-2 rounded-lg hover:bg-neutral-800 text-xs font-black transition-all", editor.isActive('heading', { level: 3 }) ? "text-indigo-400" : "text-neutral-400")}>H3</button>

            <div className="w-px h-5 bg-neutral-700 mx-1" />

            <button 
              onClick={() => {
                if (editor.isActive('highlight')) {
                  editor.chain().focus().unsetHighlight().unsetColor().run();
                } else {
                  editor.chain().focus().setHighlight({ color: '#FEF08A' }).setColor('#171717').run();
                }
              }} 
              className={cn("p-2 rounded-lg hover:bg-neutral-800 transition-all", editor.isActive('highlight') ? "text-yellow-400" : "text-neutral-400")}
              title="Highlight (Chữ đen)"
            >
              <Highlighter size={16} />
            </button>
            
            <button onClick={addLink} className={cn("p-2 rounded-lg hover:bg-neutral-800 transition-all", editor.isActive('link') ? "text-indigo-400" : "text-neutral-400")}><LinkIcon size={16} /></button>
            
            <button 
              onClick={() => editor.chain().focus().toggleBlockquote().run()} 
              className={cn("p-2 rounded-lg hover:bg-neutral-800 transition-all", editor.isActive('blockquote') ? "text-amber-400" : "text-neutral-400")}
              title="Ô ghi chú (Callout)"
            >
              <Quote size={16} />
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* FLOATING MENU */}
      {editor && isFullscreenProp && (
        <FloatingMenu editor={editor} tippyOptions={{ duration: 150 }} shouldShow={({ state }) => state.selection.$from.parent.type.name === 'paragraph' && state.selection.$from.parent.content.size === 0}>
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 p-1.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 transition-all"><Heading1 size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 transition-all"><Heading2 size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 transition-all"><List size={18} /></button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 transition-all" title="Ô ghi chú (Callout)"><Quote size={18} /></button>
            <button onClick={uploadImage} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 transition-all"><ImageIcon size={18} /></button>
            <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 transition-all"><TableIcon size={18} /></button>
          </div>
        </FloatingMenu>
      )}
    </div>
  );
}
