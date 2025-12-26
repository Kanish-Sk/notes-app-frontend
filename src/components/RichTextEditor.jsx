import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Strike from '@tiptap/extension-strike';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import {
    FiBold, FiItalic, FiUnderline, FiCode, FiLink,
    FiList, FiCheckSquare, FiAlignLeft, FiAlignCenter, FiAlignRight,
    FiX, FiMinus, FiGrid, FiPlus, FiRotateCcw, FiRotateCw, FiMessageSquare, FiImage, FiTrash2
} from 'react-icons/fi';
import { MdStrikethroughS, MdSubscript, MdSuperscript } from 'react-icons/md';
import { HiOutlineColorSwatch } from 'react-icons/hi';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// Table Modal Component
const TableModal = ({ onInsert, onClose }) => {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [tableName, setTableName] = useState('');
    const [withHeaderRow, setWithHeaderRow] = useState(true);
    const [withHeaderColumn, setWithHeaderColumn] = useState(false);

    const handleInsert = () => {
        onInsert({ rows, cols, tableName, withHeaderRow, withHeaderColumn });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Table</h3>

                <div className="space-y-4">
                    {/* Table Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Table Name (optional)
                        </label>
                        <input
                            type="text"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder="e.g., Quarterly Results, Feature Comparison"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Add a caption to describe your table
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Rows
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={rows}
                            onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Columns
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={cols}
                            onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="headerRow"
                            checked={withHeaderRow}
                            onChange={(e) => setWithHeaderRow(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="headerRow" className="text-sm text-gray-700 dark:text-gray-300">
                            Include header row
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="headerColumn"
                            checked={withHeaderColumn}
                            onChange={(e) => setWithHeaderColumn(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="headerColumn" className="text-sm text-gray-700 dark:text-gray-300">
                            Include header column
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInsert}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Insert Table
                    </button>
                </div>
            </div>
        </div>
    );
};

// Link Modal Component
const LinkModal = ({ url, text, onSave, onRemove, onClose }) => {
    const [linkUrl, setLinkUrl] = useState(url || '');
    const [linkText, setLinkText] = useState(text || '');

    const handleSave = () => {
        if (linkUrl.trim()) {
            onSave(linkUrl, linkText);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {url ? 'Edit Link' : 'Insert Link'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Link Text
                        </label>
                        <input
                            type="text"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            placeholder="Enter link text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            URL
                        </label>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-6">
                    {url && (
                        <button
                            onClick={() => { onRemove(); onClose(); }}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            Remove Link
                        </button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            {url ? 'Update' : 'Insert'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Image Modal Component
const ImageModal = ({ onInsert, onClose, onConfigureCloudinary, cloudinaryConfig }) => {
    const { addToast } = useToast();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [altText, setAltText] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            if (!selectedFile.type.startsWith('image/')) {
                addToast('Please select an image file', 'error');
                return;
            }

            // Validate file size (max 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                addToast('File size must be less than 10MB', 'error');
                return;
            }

            setFile(selectedFile);
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        // Check if Cloudinary is configured
        if (!cloudinaryConfig?.cloudinary_cloud_name || !cloudinaryConfig?.cloudinary_api_key) {
            if (window.confirm('Cloudinary is not configured. Would you like to configure it now?')) {
                onConfigureCloudinary();
            }
            return;
        }

        setUploading(true);

        try {
            // Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'unsigned'); // You'll need to create this in Cloudinary

            // Alternative: Use signed upload with user's credentials
            const cloudName = cloudinaryConfig.cloudinary_cloud_name;
            const timestamp = Math.floor(Date.now() / 1000);
            const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

            // For unsigned upload (simpler, but requires unsigned preset in Cloudinary)
            // Users need to create an "unsigned" upload preset in their Cloudinary dashboard
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            const imageUrl = data.secure_url;

            // Insert image into editor
            onInsert(imageUrl, altText || file.name);
            onClose();
        } catch (error) {
            console.error('Image upload error:', error);
            addToast('Failed to upload image. Please make sure you have created an "unsigned" upload preset in your Cloudinary dashboard settings.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Insert Image
                </h3>

                <div className="space-y-4">
                    {/* File input */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors flex flex-col items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                        >
                            <FiImage className="w-8 h-8" />
                            <span>{file ? file.name : 'Click to select image'}</span>
                            <span className="text-xs">Max size: 10MB</span>
                        </button>
                    </div>

                    {/* Preview */}
                    {preview && (
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                        </div>
                    )}

                    {/* Alt text */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Alt Text (optional)
                        </label>
                        <input
                            type="text"
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            placeholder="Describe the image"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    {/* Info message */}
                    {(!cloudinaryConfig?.cloudinary_cloud_name || !cloudinaryConfig?.cloudinary_api_key) && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300">
                            ⚠️ Cloudinary not configured. Please configure it first to upload images.
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    {(!cloudinaryConfig?.cloudinary_cloud_name || !cloudinaryConfig?.cloudinary_api_key) ? (
                        <button
                            onClick={() => {
                                onConfigureCloudinary();
                                onClose();
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Configure Cloudinary
                        </button>
                    ) : (
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading...' : 'Upload & Insert'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Menu Button Component
const MenuButton = ({ onClick, active, disabled, title, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 rounded-lg transition-all ${active
            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

// Floating Menu Component
const FloatingMenu = ({ editor, onLinkClick, onAskAI, onDeleteImage }) => {
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    useEffect(() => {
        if (!editor) return;

        const updateMenu = () => {
            const { from, to } = editor.state.selection;
            const hasSelection = from !== to;

            if (hasSelection) {
                // Get the selection coordinates
                const domSelection = window.getSelection();
                if (domSelection && domSelection.rangeCount > 0) {
                    const range = domSelection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    setPosition({
                        top: rect.top - 55, // Position closer above selection
                        left: rect.left + (rect.width / 2), // Center horizontally
                    });
                    setShow(true);
                }
            } else {
                setShow(false);
            }
        };

        editor.on('selectionUpdate', updateMenu);
        editor.on('update', updateMenu);

        return () => {
            editor.off('selectionUpdate', updateMenu);
            editor.off('update', updateMenu);
        };
    }, [editor]);

    if (!show || !editor) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translateX(-50%)',
            }}
        >
            {editor.state.selection.node && editor.state.selection.node.type.name === 'image' && (
                <button
                    onClick={onDeleteImage}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-md m-1 font-medium"
                    title="Delete Image"
                >
                    <FiTrash2 className="w-4 h-4" />
                    <span>Delete Image</span>
                </button>
            )}

            {onAskAI && !(editor.state.selection.node && editor.state.selection.node.type.name === 'image') && (
                <button
                    onClick={() => {
                        const { from, to } = editor.state.selection;
                        // Use '\n\n' as separator to preserve line breaks between blocks
                        const selectedText = editor.state.doc.textBetween(from, to, '\n\n');
                        if (selectedText && onAskAI) {
                            onAskAI(selectedText);
                        }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors rounded-md m-1"
                    title="Ask AI about this selection"
                >
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <FiMessageSquare className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium">Ask AI</span>
                </button>
            )}

        </div>
    );
};

const RichTextEditor = forwardRef(({ noteId, content, onChange, placeholder = 'Start writing...', readOnly = false, onAskAI, onConfigureCloudinary, cloudinaryConfig }, ref) => {
    const [showLinkModal, setShowLinkModal] = useState(false);
    const lastIdRef = useRef(noteId);
    const [showTableModal, setShowTableModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showDeleteTableConfirm, setShowDeleteTableConfirm] = useState(false);
    const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
    const [linkData, setLinkData] = useState({ url: '', text: '' });
    const [editorWidth, setEditorWidth] = useState(896); // Default max-w-4xl = 896px
    const [isResizing, setIsResizing] = useState(false);
    const [resizeEnabled, setResizeEnabled] = useState(false); // Resize disabled by default
    const editorContainerRef = useRef(null);
    const { addToast } = useToast();
    const { accessToken } = useAuth();

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing || !editorContainerRef.current) return;

            const container = editorContainerRef.current;
            const containerRect = container.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            // Min width 600px, max width is viewport width minus some padding
            const minWidth = 600;
            const maxWidth = window.innerWidth - containerRect.left - 50;
            const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

            setEditorWidth(clampedWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                strike: false, // We'll add it separately
                // Note: StarterKit doesn't include Link or Underline by default
            }),
            Placeholder.configure({
                placeholder,
            }),
            Underline.extend({ name: 'customUnderline' }),
            Strike,
            Link.extend({ name: 'customLink' }).configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300',
                },
            }),
            Highlight.configure({
                multicolor: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Subscript,
            Superscript,
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg my-4 cursor-pointer',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full my-4',
                },
            }),
            TableRow,
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-2 font-semibold',
                },
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 dark:border-gray-600 p-2',
                },
            }),
        ],
        content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert w-full focus:outline-none min-h-screen p-8 prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 break-words',
            },
        },
    }, [readOnly]);


    useImperativeHandle(ref, () => ({
        insertHTML: (html) => {
            if (editor) {
                // Insert at current cursor position, not at the end
                editor.chain().focus().insertContent(html).run();
            }
        },
    }));

    // Update editor's editable state when readOnly changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [editor, readOnly]);

    // Update editor content when content prop changes (e.g., when switching notes)
    useEffect(() => {
        if (!editor) return;

        const isNewNote = lastIdRef.current !== noteId;
        const isExternalUpdate = !editor.isFocused;

        if (isNewNote || (isExternalUpdate && content !== editor.getHTML())) {
            editor.commands.setContent(content, false);
            lastIdRef.current = noteId;
        }
    }, [editor, content, noteId]);

    const handleLinkClick = () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        const href = editor.getAttributes('customLink').href;

        if (href) {
            setLinkData({ url: href, text: selectedText });
        } else {
            setLinkData({ url: '', text: selectedText });
        }
        setShowLinkModal(true);
    };

    const handleLinkSave = (url, text) => {
        if (text && text !== editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')) {
            editor.chain().focus().insertContent(text).run();
            const newTo = editor.state.selection.from + text.length;
            editor.chain().setTextSelection({ from: editor.state.selection.from, to: newTo }).setLink({ href: url }).run();
        } else {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const handleLinkRemove = () => {
        editor.chain().focus().unsetLink().run();
    };


    const handleTableInsert = ({ rows, cols, tableName, withHeaderRow, withHeaderColumn }) => {
        // Insert table name as a paragraph before the table if provided
        if (tableName && tableName.trim()) {
            editor.chain()
                .focus()
                .insertContent(`<p style="font-weight: 600; color: #4B5563; margin: 1rem 0 0.5rem 0; font-style: italic; border-bottom: 2px solid #6366F1; display: inline-block; padding: 0 0.5rem 0.25rem 0;">📊 ${tableName}</p>`)
                .insertTable({ rows, cols, withHeaderRow })
                .run();
        } else {
            editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
        }
    };

    const handleDeleteTable = () => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Try to find and delete the caption paragraph before the table
        try {
            // Get position before the current table
            const tableDepth = $from.depth;
            let tablePos = null;

            // Find the table node position
            for (let d = tableDepth; d >= 0; d--) {
                const node = $from.node(d);
                if (node.type.name === 'table') {
                    tablePos = $from.before(d);
                    break;
                }
            }

            if (tablePos !== null && tablePos > 0) {
                // Check for a paragraph immediately before the table
                const resolvedPos = state.doc.resolve(tablePos);
                const nodeBefore = resolvedPos.nodeBefore;

                if (nodeBefore && nodeBefore.type.name === 'paragraph') {
                    // Check if it contains the table emoji (caption)
                    const text = nodeBefore.textContent;
                    if (text && text.includes('📊')) {
                        // Delete both caption and table
                        const captionStart = tablePos - nodeBefore.nodeSize;
                        editor.chain()
                            .focus()
                            .deleteRange({ from: captionStart, to: tablePos })
                            .deleteTable()
                            .run();
                        return;
                    }
                }
            }
        } catch (e) {
            console.log('Could not find caption, deleting table only', e);
        }

        // If no caption found or error, just delete the table
        editor.chain().focus().deleteTable().run();
    };

    const handleDeleteImage = async () => {
        const { state } = editor;
        const { selection } = state;
        let imageUrl = null;

        // Try to get image URL from selected node
        if (selection.node && selection.node.type.name === 'image') {
            imageUrl = selection.node.attrs.src;
        }

        // Delete from editor first (UI responsiveness)
        editor.chain().focus().deleteSelection().run();
        setShowDeleteImageConfirm(false);

        // If it's a Cloudinary image, delete from Cloudinary too
        if (imageUrl && imageUrl.includes('cloudinary.com')) {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                await axios.delete(
                    `${API_URL}/api/cloudinary/image`,
                    {
                        params: { image_url: imageUrl },
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }
                );
                addToast('Image deleted from Cloudinary successfully', 'success');
            } catch (error) {
                console.error('Failed to delete from Cloudinary:', error);
                addToast('Deleted from editor, but failed to remove from Cloudinary storage', 'warning');
            }
        } else {
            addToast('Image removed from document', 'success');
        }
    };

    const handleImageInsert = (url, alt) => {
        editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
    };

    const isInTable = editor?.isActive('table');

    if (!editor) {
        return null;
    }

    return (
        <div className="h-full flex flex-col relative">
            {!readOnly && (
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-2 flex items-center gap-2 flex-wrap">
                    <MenuButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo (Cmd+Z)"
                    >
                        <FiRotateCcw className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo (Cmd+Shift+Z)"
                    >
                        <FiRotateCw className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="Bold (Cmd+B)"
                    >
                        <FiBold className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="Italic (Cmd+I)"
                    >
                        <FiItalic className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        active={editor.isActive('customUnderline')}
                        title="Underline (Cmd+U)"
                    >
                        <FiUnderline className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        active={editor.isActive('strike')}
                        title="Strikethrough"
                    >
                        <MdStrikethroughS className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={handleLinkClick}
                        active={editor.isActive('customLink')}
                        title="Link"
                    >
                        <FiLink className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => setShowImageModal(true)}
                        title="Insert Image"
                    >
                        <FiImage className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        active={editor.isActive('highlight')}
                        title="Highlight"
                    >
                        <HiOutlineColorSwatch className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        active={editor.isActive('code')}
                        title="Inline Code"
                    >
                        <FiCode className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <span className="text-sm font-semibold">H1</span>
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <span className="text-sm font-semibold">H2</span>
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        active={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                    >
                        <span className="text-sm font-semibold">H3</span>
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                        title="Bullet list"
                    >
                        <FiList className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                        title="Numbered list"
                    >
                        <span className="text-sm font-semibold">1.</span>
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        active={editor.isActive('taskList')}
                        title="Task list"
                    >
                        <FiCheckSquare className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={() => setShowTableModal(true)}
                        title="Insert table"
                    >
                        <FiGrid className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal line"
                    >
                        <FiMinus className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        active={editor.isActive({ textAlign: 'left' })}
                        title="Align left"
                    >
                        <FiAlignLeft className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        active={editor.isActive({ textAlign: 'center' })}
                        title="Align center"
                    >
                        <FiAlignCenter className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        active={editor.isActive({ textAlign: 'right' })}
                        title="Align right"
                    >
                        <FiAlignRight className="w-4 h-4" />
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={() => setResizeEnabled(!resizeEnabled)}
                        active={resizeEnabled}
                        title={resizeEnabled ? "Disable resize" : "Enable resize"}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    </MenuButton>
                </div>
            )}

            {!readOnly && isInTable && (
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-2 flex items-center gap-2 shadow-sm">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                        Table:
                    </span>
                    <MenuButton
                        onClick={() => editor.chain().focus().addRowBefore().run()}
                        title="Add row above"
                    >
                        <FiPlus className="w-4 h-4" />
                        <span className="text-xs ml-1">Row Above</span>
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                        title="Add row below"
                    >
                        <FiPlus className="w-4 h-4" />
                        <span className="text-xs ml-1">Row Below</span>
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().deleteRow().run()}
                        title="Delete row"
                    >
                        <FiMinus className="w-4 h-4" />
                        <span className="text-xs ml-1">Row</span>
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={() => editor.chain().focus().addColumnBefore().run()}
                        title="Add column left"
                    >
                        <FiPlus className="w-4 h-4" />
                        <span className="text-xs ml-1">Col Left</span>
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                        title="Add column right"
                    >
                        <FiPlus className="w-4 h-4" />
                        <span className="text-xs ml-1">Col Right</span>
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor.chain().focus().deleteColumn().run()}
                        title="Delete column"
                    >
                        <FiMinus className="w-4 h-4" />
                        <span className="text-xs ml-1">Column</span>
                    </MenuButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <MenuButton
                        onClick={() => setShowDeleteTableConfirm(true)}
                        title="Delete table"
                    >
                        <FiX className="w-4 h-4" />
                        <span className="text-xs ml-1">Table</span>
                    </MenuButton>
                </div>
            )}

            {/* Image Controls - Show when image is selected */}
            {(editor.state.selection.node && editor.state.selection.node.type.name === 'image') && (
                <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
                    <MenuButton
                        onClick={() => setShowDeleteImageConfirm(true)}
                        title="Delete image"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <FiTrash2 className="w-4 h-4" />
                        <span className="text-xs ml-1">Delete Image</span>
                    </MenuButton>
                </div>
            )}

            <div className="flex-1 overflow-auto relative">
                <div
                    ref={editorContainerRef}
                    className="relative h-full"
                    style={resizeEnabled ? { maxWidth: `${editorWidth}px` } : { width: '100%' }}
                >
                    <EditorContent editor={editor} className="h-full" />

                    {/* Floating selection menu - always show for Ask AI on shared notes */}
                    <FloatingMenu
                        editor={editor}
                        onLinkClick={!readOnly ? () => {
                            const { from, to } = editor.state.selection;
                            const text = editor.state.doc.textBetween(from, to, ' ');
                            const url = editor.getAttributes('customLink').href || '';
                            setLinkData({ url, text });
                            setShowLinkModal(true);
                        } : null}
                        onAskAI={onAskAI}
                        onDeleteImage={!readOnly ? () => setShowDeleteImageConfirm(true) : null}
                    />

                    {/* Resize Handle - Only show when resize is enabled */}
                    {!readOnly && resizeEnabled && (
                        <div
                            onMouseDown={handleMouseDown}
                            className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize transition-all ${isResizing
                                ? 'bg-indigo-500 shadow-lg'
                                : 'bg-gray-300 dark:bg-gray-600 hover:bg-indigo-400'
                                }`}
                            title="Drag to resize editor width"
                        >
                            <div className={`absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-4 h-16 bg-gray-400 dark:bg-gray-500 rounded-full transition-all ${isResizing ? 'opacity-100 scale-110' : 'opacity-0 hover:opacity-100'
                                } flex items-center justify-center shadow-md`}>
                                <div className="w-1 h-8 bg-white dark:bg-gray-200 rounded-full"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showLinkModal && (
                <LinkModal
                    url={linkData.url}
                    text={linkData.text}
                    onSave={handleLinkSave}
                    onRemove={handleLinkRemove}
                    onClose={() => setShowLinkModal(false)}
                />
            )}

            {showTableModal && (
                <TableModal
                    onInsert={handleTableInsert}
                    onClose={() => setShowTableModal(false)}
                />
            )}

            {showImageModal && (
                <ImageModal
                    onInsert={handleImageInsert}
                    onClose={() => setShowImageModal(false)}
                    onConfigureCloudinary={onConfigureCloudinary}
                    cloudinaryConfig={cloudinaryConfig}
                />
            )}

            {showDeleteTableConfirm && (
                <ConfirmationModal
                    isOpen={showDeleteTableConfirm}
                    onClose={() => setShowDeleteTableConfirm(false)}
                    onConfirm={handleDeleteTable}
                    title="Delete Table"
                    message="Are you sure you want to delete this table? This action cannot be undone."
                />
            )}
            {showDeleteImageConfirm && (
                <ConfirmationModal
                    isOpen={showDeleteImageConfirm}
                    onClose={() => setShowDeleteImageConfirm(false)}
                    onConfirm={handleDeleteImage}
                    title="Delete Image"
                    message="Are you sure you want to delete this image? This action cannot be undone."
                />
            )}
        </div>
    );
});


RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
