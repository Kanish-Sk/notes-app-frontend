import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import RichTextEditor from './RichTextEditor';

const NotionEditor = forwardRef(({ note, onUpdateNote, onDeleteNote }, ref) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const saveTimeoutRef = useRef(null);
    const titleInputRef = useRef(null);
    const editorRef = useRef(null);

    const isReadOnly = note?.is_shared && note?.original_owner_id !== note?.user_id;

    useEffect(() => {
        if (note) {
            setTitle(note.title || '');
            setContent(note.content || '');
        }
    }, [note?._id]);

    const handleTitleChange = async (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        if (isReadOnly || !note) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

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

    const handleContentChange = async (newContent) => {
        setContent(newContent);

        if (isReadOnly || !note) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                await onUpdateNote(note._id, { content: newContent });
                setLastSaved(new Date());
            } catch (error) {
                console.error('Failed to save content:', error);
            } finally {
                setIsSaving(false);
            }
        }, 1000);
    };

    useImperativeHandle(ref, () => ({
        insertHTML: (html) => {
            if (editorRef.current) {
                editorRef.current.insertHTML(html);
            }
        },
        getContent: () => content,
    }));

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
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full">
            <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4">
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Untitled"
                        disabled={isReadOnly}
                        className="text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 disabled:cursor-not-allowed min-w-[200px]"
                    />
                    {isReadOnly && (
                        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md font-medium">
                            Read Only
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {isSaving && <span className="animate-pulse">Saving...</span>}
                    {!isSaving && lastSaved && (
                        <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                    )}

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
            </div>

            <div className="flex-1 overflow-auto">
                <div className="max-w-full h-full">
                    <RichTextEditor
                        ref={editorRef}
                        content={content}
                        onChange={handleContentChange}
                        placeholder="Start writing..."
                        readOnly={isReadOnly}
                    />
                </div>
            </div>
        </div>
    );
});

NotionEditor.displayName = 'NotionEditor';

export default NotionEditor;
