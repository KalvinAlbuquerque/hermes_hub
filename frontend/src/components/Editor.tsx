// Arquivo: frontend/src/components/Editor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  // Função para obter o valor ativo do menu de Título
  const getActiveHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return '1';
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    return '0'; // '0' representa o parágrafo (texto normal)
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
      {/* Estilos */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1 rounded font-bold ${editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1 rounded italic ${editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-3 py-1 rounded line-through ${editor.isActive('strike') ? 'bg-gray-300 dark:bg-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>S</button>
      
      <div className="h-6 border-l border-gray-300 dark:border-gray-500 mx-1"></div>

      {/* Seletor de Tamanho (Título) - CORRIGIDO */}
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
        className="px-2 py-1 rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-sm"
      >
        <option value="0">Normal</option>
        <option value="1">Título 1</option>
        <option value="2">Título 2</option>
        <option value="3">Título 3</option>
      </select>

      {/* Seletor de Fonte */}
      <select
        value={editor.getAttributes('textStyle').fontFamily || ''}
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        className="px-2 py-1 rounded bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-sm"
      >
        <option value="">Fonte Padrão</option>
        <option value="Arial">Arial</option>
        <option value="Verdana">Verdana</option>
        <option value="Times New Roman">Times New Roman</option>
      </select>
      
      <div className="h-6 border-l border-gray-300 dark:border-gray-500 mx-1"></div>

      {/* Alinhamento */}
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`px-2 py-1 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300 dark:bg-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Esq</button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`px-2 py-1 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300 dark:bg-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Cen</button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`px-2 py-1 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300 dark:bg-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Dir</button>
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
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert min-h-[200px] max-w-none p-4 focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default TiptapEditor;