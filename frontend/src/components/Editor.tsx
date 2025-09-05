// Arquivo: frontend/src/components/Editor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Paintbrush } from 'lucide-react';

const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            'data-cid': {
                default: null,
                renderHTML: attributes => {
                    if (!attributes['data-cid']) {
                        return {};
                    }
                    return {
                        'data-cid': attributes['data-cid'],
                    };
                },
            },
        };
    },
});

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

    // Paleta de cores rápidas
    const quickColors = ['#E6EDF3', '#DA3633', '#238636', '#2F81F7', '#F1E05A'];

    return (
        <div className="tiptap-editor-toolbar flex flex-wrap items-center gap-x-4 gap-y-2 p-2 border-b border-border bg-secondary/50">
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

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                title="Marca-texto"
            >
                <Paintbrush size={16} />
            </button>

            <div className="h-6 border-l border-border mx-1"></div>

            <div className="flex items-center gap-2">
                <input
                    type="color"
                    onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                    value={editor.getAttributes('textStyle').color || '#E6EDF3'}
                    className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                    title="Mais cores"
                />
                {quickColors.map(color => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => editor.chain().focus().setColor(color).run()}
                        className={`w-5 h-5 rounded-full border-2 ${editor.isActive('textStyle', { color }) ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        title={`Cor ${color}`}
                    />
                ))}
            </div>

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
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            FontFamily,
            CustomImage,
            Color,
            Highlight,
        ],
        content: content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none min-h-[200px] p-4 focus:outline-none',
            },
            handlePaste: (view, event, slice) => {
                const items = Array.from(event.clipboardData?.items || []);
                let imagePasted = false;

                items.forEach(item => {
                    if (item.type.indexOf('image') === 0) {
                        imagePasted = true;
                        const file = item.getAsFile();
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = (readerEvent) => {
                            const imageBase64 = readerEvent.target?.result;
                            if (typeof imageBase64 === 'string') {
                                const uploadPromise = api.post('/attachments/paste', { image: imageBase64 })
                                    .then(response => {
                                        const { url, cid } = response.data;
                                        if (url && cid) {
                                            editor?.chain().focus().insertContent({
                                                type: 'image',
                                                attrs: {
                                                    src: url,
                                                    'data-cid': cid,
                                                },
                                            }).run();
                                        }
                                    });

                                toast.promise(uploadPromise, {
                                    loading: 'A enviar imagem...',
                                    success: 'Imagem inserida!',
                                    error: 'Falha ao enviar a imagem.',
                                });
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
                return imagePasted;
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