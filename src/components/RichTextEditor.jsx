import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
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
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import {
    FiBold, FiItalic, FiUnderline, FiCode, FiLink, FiHighlight,
    FiList, FiCheckSquare, FiAlignLeft, FiAlignCenter, FiAlignRight,
    FiX, FiMinus, FiGrid, FiPlus
} from 'react-icons/fi';
import { MdStrikethroughS, MdSubscript, MdSuperscript } from 'react-icons/md';

const TableModal = ({ onInsert, onClose }) => {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [withHeaderRow, setWithHeaderRow] = useState(true);
    const [withHeaderColumn, setWithHeaderColumn] = useState(false);

    const handleInsert = () => {
        onInsert({ rows, cols, withHeaderRow, withHeaderColumn });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Insert Table</h3>

                <div className="space-y-4">
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

const RichTextEditor = forwardRef(({ content, onChange, placeholder = 'Start writing...', readOnly = false }, ref) => {
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [linkData, setLinkData] = useState({ url: '', text: '' });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Underline,
            Strike,
            Link.configure({
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
                class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-screen p-8',
            },
        },
    });

    useImperativeHandle(ref, () => ({
        insertHTML: (html) => {
            if (editor) {
                const { from } = editor.state.selection;
                editor.chain().focus().setContent(editor.getHTML() + html).run();
                editor.commands.focus('end');
            }
        },
    }));

    const handleLinkClick = () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        const href = editor.getAttributes('link').href;

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

    const handleTableInsert = ({ rows, cols, withHeaderRow, withHeaderColumn }) => {
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
        // Note: withHeaderColumn would require custom extension or post-processing
    };

    const isInTable = editor?.isActive('table');

    if (!editor) {
        return null;
    }

    return (
        <div className="h-full flex flex-col">
            {!readOnly && (
                <>
                    <BubbleMenu
                        editor={editor}
                        tippyOptions={{ duration: 100, placement: 'top' }}
                        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-1 flex items-center gap-1"
                    >
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            active={editor.isActive('bold')}
                            title="Bold"
                        >
                            <FiBold className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            active={editor.isActive('italic')}
                            title="Italic"
                        >
                            <FiItalic className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            active={editor.isActive('underline')}
                            title="Underline"
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
                            active={editor.isActive('link')}
                            title="Link"
                        >
                            <FiLink className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleHighlight().run()}
                            active={editor.isActive('highlight')}
                            title="Highlight"
                        >
                            <FiHighlight className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            active={editor.isActive('code')}
                            title="Code"
                        >
                            <FiCode className="w-4 h-4" />
                        </MenuButton>
                    </BubbleMenu>

                    {isInTable && (
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
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                title="Delete table"
                            >
                                <FiX className="w-4 h-4" />
                                <span className="text-xs ml-1">Table</span>
                            </MenuButton>
                        </div>
                    )}

                    <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 p-2 flex items-center gap-2 shadow-sm">
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
                    </div>
                </>
            )}

            <EditorContent editor={editor} className="flex-1 overflow-auto" />

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
        </div>
    );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
