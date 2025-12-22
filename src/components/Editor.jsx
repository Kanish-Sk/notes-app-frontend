import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import {
    FiBold, FiItalic, FiUnderline, FiCode, FiLink,
    FiMoreHorizontal, FiType, FiAlignLeft, FiList,
    FiCheckSquare, FiImage, FiTrash2
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const NotionEditor = forwardRef(({ note, onUpdateNote, onDeleteNote }, ref) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const saveTimeoutRef = useRef(null);
    const titleInputRef = useRef(null);

    // Check if note is shared and user is not the owner
    const isReadOnly = note?.is_shared && note?.original_owner_id !== user?.id;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return `Heading ${node.attrs.level}`;
                    }
                    return "Type '/' for commands...";
                },
            }),
            Underline,
            Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                    class: 'text-blue-500 hover:text-blue-600 underline cursor-pointer',
                },
            }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto',
                },
            }),
        ],
        editable: !isReadOnly,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-24 py-8',
            },
        },
        onUpdate: ({ editor }) => {
            handleContentChange(editor.getHTML());
        },
    });

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        insertHTML: (html) => {
            if (editor && !isReadOnly) {
                editor.chain().focus().insertContent(html).run();
            }
        },
        getContent: () => editor?.getHTML() || '',
    }));

    // Load note content
    useEffect(() => {
        if (note) {
            setTitle(note.title || '');
            if (editor && note.content) {
                editor.commands.setContent(note.content);
            }
        }
    }, [note?._id]);

    // Update editor content when note changes
    useEffect(() => {
        if (editor && note?.content && editor.getHTML() !== note.content) {
            editor.commands.setContent(note.content);
        }
    }, [note?.content, editor]);

    // Focus title on new note
    useEffect(() => {
        if (note && !note.title && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [note?._id]);

    const handleContentChange = (content) => {
        if (isReadOnly || !note) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save
        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                await onUpdateNote(note._id, { content });
                setLastSaved(new Date());
            } catch (error) {
                console.error('Failed to save content:', error);
            } finally {
                setIsSaving(false);
            }
        }, 1000);
    };

    const handleTitleChange = async (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        if (isReadOnly || !note) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save
        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                await onUpdateNote(note._id, { title: newTitle });
                setLastSaved(new Date());
            } catch (error) {
                console.error('Failed to save title:', error);
            } finally {
                setIsSaving(false);
            }
        }, 500);
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            editor?.commands.focus();
        }
    };

    if (!note) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Select a note to start editing
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
            {/* Top Bar - Very minimal */}
            <div className="border-b border-gray-100 dark:border-gray-800 px-24 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {isReadOnly && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md font-medium">
                            Read Only
                        </span>
                    )}
                    {isSaving && <span className="animate-pulse">Saving...</span>}
                    {!isSaving && lastSaved && (
                        <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                    )}
                </div>

                {!isReadOnly && (
                    <button
                        onClick={() => onDeleteNote(note._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete note"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto">
                {/* Title */}
                <div className="px-24 pt-20 pb-4">
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onKeyDown={handleTitleKeyDown}
                        placeholder="Untitled"
                        disabled={isReadOnly}
                        className="w-full text-5xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-700 disabled:cursor-not-allowed"
                        style={{ caretColor: '#6366f1' }}
                    />
                </div>

                {/* Content Editor */}
                <div className="relative">
                    {editor && !isReadOnly && (
                        <BubbleMenu
                            editor={editor}
                            tippyOptions={{ duration: 100 }}
                            className="flex items-center gap-1 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl p-1 border border-gray-700"
                        >
                            <button
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${editor.isActive('bold') ? 'bg-gray-700' : ''
                                    }`}
                                title="Bold"
                            >
                                <FiBold className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${editor.isActive('italic') ? 'bg-gray-700' : ''
                                    }`}
                                title="Italic"
                            >
                                <FiItalic className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${editor.isActive('underline') ? 'bg-gray-700' : ''
                                    }`}
                                title="Underline"
                            >
                                <FiUnderline className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleCode().run()}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${editor.isActive('code') ? 'bg-gray-700' : ''
                                    }`}
                                title="Code"
                            >
                                <FiCode className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-gray-700 mx-1" />
                            <button
                                onClick={() => {
                                    const url = window.prompt('Enter URL:');
                                    if (url) {
                                        editor.chain().focus().setLink({ href: url }).run();
                                    }
                                }}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${editor.isActive('link') ? 'bg-gray-700' : ''
                                    }`}
                                title="Link"
                            >
                                <FiLink className="w-4 h-4" />
                            </button>
                        </BubbleMenu>
                    )}

                    <EditorContent editor={editor} />
                </div>

                {/* Bottom Padding */}
                <div className="h-64" />
            </div>
        </div>
    );
});

NotionEditor.displayName = 'NotionEditor';

export default NotionEditor;
