// Arquivo: frontend/src/components/Editor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { useEffect } from 'react';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const getActiveHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return '1';
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    return '0';
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2 border-b border-border bg-secondary/50">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1 rounded font-bold ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1 rounded italic ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-3 py-1 rounded line-through ${editor.isActive('strike') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>S</button>
      
      <div className="h-6 border-l border-border mx-1"></div>

      <select
        value={getActiveHeading()}
        onChange={(e) => {
          const level = parseInt(e.target.value);
          if (level === 0) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: level as any }).run();
          }
        }}
        className="px-2 py-1 rounded bg-input border border-border text-sm"
      >
        <option value="0">Normal</option>
        <option value="1">Título 1</option>
        <option value="2">Título 2</option>
        <option value="3">Título 3</option>
      </select>

      <select
        value={editor.getAttributes('textStyle').fontFamily || ''}
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="px-2 py-1 rounded bg-input border border-border text-sm"
      >
        <option value="">Fonte Padrão</option>
        <option value="Arial">Arial</option>
        <option value="Verdana">Verdana</option>
        <option value="Times New Roman">Times New Roman</option>
      </select>
      
      <div className="h-6 border-l border-border mx-1"></div>

      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`px-2 py-1 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>Esq</button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`px-2 py-1 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>Cen</button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`px-2 py-1 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>Dir</button>
    </div>
  );
};

interface EditorProps {
    content: string;
    onChange: (richText: string) => void;
}

const TiptapEditor = ({ content, onChange }: EditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            FontFamily,
        ],
        content: content,
        // --- ALTERAÇÃO 1: Adiciona a propriedade para corrigir o erro de SSR <<<< ---
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none min-h-[200px] p-4 focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && editor.getHTML() !== content) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    return (
        <div className="border border-border rounded-md bg-input text-foreground">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default TiptapEditor;