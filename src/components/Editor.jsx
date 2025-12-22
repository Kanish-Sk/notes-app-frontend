import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiTrash2, FiEye, FiEdit3, FiRotateCcw, FiRotateCw, FiSave } from 'react-icons/fi';
import { useToast } from '../contexts/ToastContext';
import RichTextEditor from './RichTextEditor';
import { useAuth } from '../contexts/AuthContext';

const Editor = React.forwardRef(({ note, onUpdateNote, onDeleteNote }, ref) => {
    const { user } = useAuth();

    // Check ownership - be permissive: only set read-only if we're CERTAIN it's not owned
    const userId = user?.id || user?._id;
    const noteOwnerId = note?.user_id;

    // Only enable read-only if:
    // 1. We have both user and note
    // 2. The note HAS a user_id (otherwise it's legacy/orphaned)
    // 3. They DON'T match
    const isReadOnly = !!(user && note && noteOwnerId && userId && noteOwnerId !== userId);
    const isOwner = !isReadOnly;

    // Debug logging (remove after testing)
    React.useEffect(() => {
        if (note && user) {
            console.log('Editor Debug:', {
                noteUserId: note.user_id,
                userId: user.id,
                userIdAlt: user._id,
                isOwner,
                isReadOnly,
                userKeys: Object.keys(user)
            });
        }
    }, [note?.user_id, user?.id, user?._id]);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { addToast } = useToast();
    const editorRef = React.useRef(null);

    // Undo/Redo state
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isUndoRedo, setIsUndoRedo] = useState(false);

    // Expose insertHTML method
    React.useImperativeHandle(ref, () => ({
        insertHTML: (html) => {
            if (editorRef.current) {
                editorRef.current.insertHTML(html);
            }
        }
    }));

    useEffect(() => {
        if (note) {
            setTitle(note.title || '');
            setContent(note.content || '');
            setHistory([{ title: note.title || '', content: note.content || '' }]);
            setHistoryIndex(0);
            setUnsavedChanges(false);
        }
    }, [note]);

    // Add to history for undo/redo
    useEffect(() => {
        if (!isUndoRedo && note && (title !== note.title || content !== note.content)) {
            const newState = { title, content };
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newState);
            if (newHistory.length > 50) {
                newHistory.shift();
            } else {
                setHistoryIndex(historyIndex + 1);
            }
            setHistory(newHistory);
            setUnsavedChanges(true);
        }
        setIsUndoRedo(false);
    }, [title, content]);

    // Auto-save effect
    useEffect(() => {
        if (autoSave && note && (title !== note.title || content !== note.content)) {
            const timer = setTimeout(() => {
                onUpdateNote(note._id, { title, content });
                setUnsavedChanges(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [title, content, autoSave]);

    // Disable auto-save if read-only
    useEffect(() => {
        if (isReadOnly) {
            setAutoSave(false);
        }
    }, [isReadOnly]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setIsUndoRedo(true);
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const state = history[newIndex];
            setTitle(state.title);
            setContent(state.content);
        }
    }, [historyIndex, history]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setIsUndoRedo(true);
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const state = history[newIndex];
            setTitle(state.title);
            setContent(state.content);
        }
    }, [historyIndex, history]);

    const handleManualSave = useCallback(() => {
        if (note) {
            onUpdateNote(note._id, { title, content });
            setUnsavedChanges(false);
            addToast('Note saved successfully', 'success');
        }
    }, [note, title, content, onUpdateNote, addToast]);

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        onDeleteNote(note._id);
        setShowDeleteModal(false);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                handleRedo();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleManualSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, handleManualSave]);

    if (!note) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Select a note to start editing
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Or create a new note from the sidebar
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
            {/* Toolbar */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Read Only Badge */}
                    {isReadOnly && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium rounded border border-gray-200 dark:border-gray-700">
                            Read Only
                        </span>
                    )}

                    {/* Edit/Preview Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setShowPreview(false)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!showPreview
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                        >
                            <FiEdit3 className="inline w-4 h-4 mr-1.5" />
                            Edit
                        </button>
                        <button
                            onClick={() => setShowPreview(true)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showPreview
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                        >
                            <FiEye className="inline w-4 h-4 mr-1.5" />
                            Preview
                        </button>
                    </div>

                    {/* Undo/Redo - Hide if read-only */}
                    {!showPreview && !isReadOnly && (
                        <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-3 ml-1">
                            <button
                                onClick={handleUndo}
                                disabled={historyIndex <= 0}
                                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Undo (Cmd/Ctrl + Z)"
                            >
                                <FiRotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleRedo}
                                disabled={historyIndex >= history.length - 1}
                                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Redo (Cmd/Ctrl + Y)"
                            >
                                <FiRotateCw className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-3">
                    {/* Only show Save/Delete if owner */}
                    {isOwner && (
                        <>
                            {/* Auto-save toggle */}
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={autoSave}
                                    onChange={(e) => setAutoSave(e.target.checked)}
                                    className="w-4 h-4 rounded accent-purple-500"
                                />
                                <span className="text-gray-600 dark:text-gray-400">Auto-save</span>
                            </label>

                            {/* Manual Save Button */}
                            {!autoSave && (
                                <button
                                    onClick={handleManualSave}
                                    disabled={!unsavedChanges}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${unsavedChanges
                                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        }`}
                                    title="Save (Cmd/Ctrl + S)"
                                >
                                    <FiSave className="inline w-4 h-4 mr-1.5" />
                                    Save
                                </button>
                            )}

                            {/* Delete Button */}
                            <button
                                onClick={handleDeleteClick}
                                className="px-3 py-1.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800"
                            >
                                <FiTrash2 className="inline w-4 h-4 mr-1.5" />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {showPreview ? (
                    <div className="max-w-4xl mx-auto px-8 py-6">
                        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">
                            {title || 'Untitled'}
                        </h1>
                        <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }}></div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto px-8 py-6">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled"
                            disabled={isReadOnly}
                            className={`w-full text-4xl font-bold mb-6 outline-none border-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${isReadOnly ? 'cursor-default' : ''}`}
                        />
                        <div className={isReadOnly ? 'pointer-events-none' : ''}>
                            <RichTextEditor
                                ref={editorRef}
                                content={content}
                                onChange={setContent}
                                placeholder="Start writing..."
                                readOnly={isReadOnly}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="px-8 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div>
                    {autoSave ? (
                        <span>✓ Auto-saved · {new Date(note.updated_at).toLocaleString()}</span>
                    ) : unsavedChanges ? (
                        <span className="text-orange-500 dark:text-orange-400">● Unsaved changes</span>
                    ) : (
                        <span>Saved · {new Date(note.updated_at).toLocaleString()}</span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <span>{content.length} characters</span>
                    <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 transform transition-all scale-100">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Delete Note?
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete this note? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

Editor.displayName = 'Editor';

export default Editor;
