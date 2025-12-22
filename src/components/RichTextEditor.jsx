import React, { useState } from 'react';
import { useEditor, EditorContent, generateJSON } from '@tiptap/react';
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
import {
    FiBold, FiItalic, FiUnderline, FiCode, FiList, FiLink,
    FiCheckSquare, FiAlignLeft, FiAlignCenter, FiAlignRight,
    FiType, FiX, FiCheck, FiMinus, FiArrowDown, FiArrowUp
} from 'react-icons/fi';

// Link Modal Component
const LinkModal = ({ isOpen, onClose, onSave, onRemove, initialUrl = '', initialText = '' }) => {
    const [url, setUrl] = useState(initialUrl);
    const [text, setText] = useState(initialText);

    React.useEffect(() => {
        if (isOpen) {
            setUrl(initialUrl);
            setText(initialText);
        }
    }, [isOpen, initialUrl, initialText]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (url.trim()) {
            onSave(url.trim(), text.trim());
        }
        onClose();
    };

    const handleRemove = () => {
        onRemove();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Add Link
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Link Text
                        </label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter link text (optional)"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-6">
                    {initialUrl && (
                        <button
                            onClick={handleRemove}
                            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                        >
                            Remove Link
                        </button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <FiCheck className="w-4 h-4" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MenuBar = ({ editor }) => {
    const [linkModalOpen, setLinkModalOpen] = useState(false);

    if (!editor) return null;

    const addLink = () => {
        // If already a link, remove it on first click
        if (editor.isActive('link')) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        const { selection } = editor.state;
        const selectedText = editor.state.doc.textBetween(selection.from, selection.to, '');
        setLinkModalOpen(true);
    };

    const saveLink = (url, linkText) => {
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // If link text is provided and there's a selection, replace the selection
        if (linkText) {
            editor.chain()
                .focus()
                .insertContent({
                    type: 'text',
                    text: linkText,
                    marks: [{ type: 'link', attrs: { href: url } }]
                })
                .run();
        } else {
            // Just add link to current selection
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
    };

    const ToolbarButton = ({ onClick, isActive, title, children, className = '' }) => (
        <button
            type="button"
            onClick={onClick}
            onMouseDown={(e) => e.preventDefault()}
            className={`
                p-2 rounded-md transition-all duration-150
                ${isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                ${className}
            `}
            title={title}
        >
            {children}
        </button>
    );

    const Divider = () => (
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
    );

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/95 backdrop-blur-sm">
                <div className="flex items-center gap-1 p-2 flex-wrap">
                    {/* Text Style Dropdown */}
                    <select
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'paragraph') {
                                editor.chain().focus().setParagraph().run();
                            } else {
                                const level = parseInt(value);
                                editor.chain().focus().toggleHeading({ level }).run();
                            }
                        }}
                        value={
                            editor.isActive('heading', { level: 1 }) ? '1' :
                                editor.isActive('heading', { level: 2 }) ? '2' :
                                    editor.isActive('heading', { level: 3 }) ? '3' :
                                        'paragraph'
                        }
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="paragraph">Paragraph</option>
                        <option value="1">Heading 1</option>
                        <option value="2">Heading 2</option>
                        <option value="3">Heading 3</option>
                    </select>

                    <Divider />

                    {/* Heading Quick Buttons */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    >
                        <span className="text-sm font-bold">H1</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    >
                        <span className="text-sm font-bold">H2</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                    >
                        <span className="text-sm font-bold">H3</span>
                    </ToolbarButton>

                    <Divider />

                    {/* Text Formatting */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        title="Bold (Ctrl+B)"
                    >
                        <FiBold className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        title="Italic (Ctrl+I)"
                    >
                        <FiItalic className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        title="Underline (Ctrl+U)"
                    >
                        <FiUnderline className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        title="Strikethrough"
                    >
                        <span className="text-sm font-bold line-through">S</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        isActive={editor.isActive('code')}
                        title="Inline Code"
                    >
                        <FiCode className="w-4 h-4" />
                    </ToolbarButton>

                    <Divider />

                    {/* Subscript & Superscript */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleSubscript().run()}
                        isActive={editor.isActive('subscript')}
                        title="Subscript"
                    >
                        <span className="text-xs">X<sub>2</sub></span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleSuperscript().run()}
                        isActive={editor.isActive('superscript')}
                        title="Superscript"
                    >
                        <span className="text-xs">X<sup>2</sup></span>
                    </ToolbarButton>

                    <Divider />

                    {/* Lists */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        title="Bullet List"
                    >
                        <FiList className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        title="Numbered List"
                    >
                        <span className="text-sm font-semibold">1.</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        isActive={editor.isActive('taskList')}
                        title="Task List"
                    >
                        <FiCheckSquare className="w-4 h-4" />
                    </ToolbarButton>

                    <Divider />

                    {/* Alignment */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        isActive={editor.isActive({ textAlign: 'left' })}
                        title="Align Left"
                    >
                        <FiAlignLeft className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        isActive={editor.isActive({ textAlign: 'center' })}
                        title="Align Center"
                    >
                        <FiAlignCenter className="w-4 h-4" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        isActive={editor.isActive({ textAlign: 'right' })}
                        title="Align Right"
                    >
                        <FiAlignRight className="w-4 h-4" />
                    </ToolbarButton>

                    <Divider />

                    {/* Blocks */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        isActive={editor.isActive('codeBlock')}
                        title="Code Block"
                        className="hidden sm:inline-flex"
                    >
                        <span className="text-xs font-mono font-bold">{`</>`}</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        title="Quote"
                    >
                        <span className="text-lg font-bold">"</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={addLink}
                        isActive={editor.isActive('link')}
                        title="Add Link"
                    >
                        <FiLink className="w-4 h-4" />
                    </ToolbarButton>

                    <Divider />

                    {/* Highlight */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        isActive={editor.isActive('highlight')}
                        title="Highlight"
                    >
                        <span className="inline-block px-1 bg-yellow-300 dark:bg-yellow-600 text-gray-900 text-xs rounded font-semibold">A</span>
                    </ToolbarButton>

                    {/* Horizontal Rule */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        isActive={false}
                        title="Horizontal Rule"
                        className="hidden sm:inline-flex"
                    >
                        <FiMinus className="w-4 h-4" />
                    </ToolbarButton>

                    <Divider />

                    {/* Clear Formatting */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                        isActive={false}
                        title="Clear Formatting"
                        className="hidden lg:inline-flex"
                    >
                        <FiType className="w-4 h-4" />
                    </ToolbarButton>

                    {/* Undo/Redo */}
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        isActive={false}
                        title="Undo (Ctrl+Z)"
                        className="hidden md:inline-flex"
                    >
                        <FiArrowDown className="w-4 h-4 transform rotate-90" />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        isActive={false}
                        title="Redo (Ctrl+Y)"
                        className="hidden md:inline-flex"
                    >
                        <FiArrowUp className="w-4 h-4 transform rotate-90" />
                    </ToolbarButton>
                </div>
            </div>

            <LinkModal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onSave={saveLink}
                onRemove={removeLink}
                initialUrl={editor.getAttributes('link').href || ''}
                initialText=""
            />
        </>
    );
};

const RichTextEditor = React.forwardRef(({ content, onChange, placeholder = 'Start writing...', readOnly = false }, ref) => {
    const editor = useEditor({
        editable: !readOnly,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            Strike,
            Subscript,
            Superscript,
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: true,
                HTMLAttributes: {
                    class: 'text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer',
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
                HTMLAttributes: {
                    class: 'flex items-start gap-2',
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6 bg-white dark:bg-gray-900',
            },
        },
    });

    // Update editable state when readOnly prop changes
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [editor, readOnly]);

    // Update editor content when prop changes
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    // Expose editor instance via ref
    React.useImperativeHandle(ref, () => ({
        insertHTML: (html) => {
            if (editor) {
                try {
                    const extensions = [
                        StarterKit,
                        Underline,
                        Strike,
                        Subscript,
                        Superscript,
                        Link,
                        Highlight,
                        TextAlign,
                        TaskList,
                        TaskItem,
                    ];

                    const jsonContent = generateJSON(html, extensions);
                    editor.chain().focus().insertContent(jsonContent).run();
                } catch (error) {
                    console.error('Insert failed:', error);
                }
            }
        },
        getEditor: () => editor
    }));

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            {!readOnly && <MenuBar editor={editor} />}
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
