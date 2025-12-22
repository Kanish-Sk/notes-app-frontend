import React from 'react';
import { useEditor, EditorContent, generateJSON } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
    FiBold, FiItalic, FiUnderline, FiCode, FiList, FiLink,
    FiCheckSquare, FiAlignLeft, FiAlignCenter, FiAlignRight,
    FiAlignJustify, FiType
} from 'react-icons/fi';

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Enter URL:', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update link
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleButtonClick = (callback) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800">
            {/* Text Styles */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                {/* Toggle Heading Dropdown */}
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
                    className="px-2 py-1 text-sm rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-900 dark:text-gray-100"
                    title="Text Style"
                >
                    <option value="paragraph">Paragraph</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                </select>

                <button
                    type="button"
                    onMouseDown={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    title="Heading 1"
                >
                    <span className="text-lg font-bold">H1</span>
                </button>
                <button
                    type="button"
                    onMouseDown={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    title="Heading 2"
                >
                    <span className="text-base font-bold">H2</span>
                </button>
                <button
                    type="button"
                    onMouseDown={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    title="Heading 3"
                >
                    <span className="text-sm font-bold">H3</span>
                </button>
            </div>

            {/* Formatting */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                <button
                    type="button"
                    onMouseDown={handleButtonClick(() => editor.chain().focus().toggleBold().run())}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('bold') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    title="Bold"
                >
                    <FiBold />
                </button>
                <button
                    type="button"
                    onMouseDown={handleButtonClick(() => editor.chain().focus().toggleItalic().run())}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('italic') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    title="Italic"
                >
                    <FiItalic />
                </button>
                <button
                    type="button"
                    onMouseDown={handleButtonClick(() => editor.chain().focus().toggleUnderline().run())}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('underline') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    title="Underline"
                >
                    <FiUnderline />
                </button>
                <button
                    type="button"
                    onMouseDown={handleButtonClick(() => editor.chain().focus().toggleCode().run())}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('code') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    title="Inline Code"
                >
                    <FiCode />
                </button>
            </div>

            {/* Lists */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('bulletList') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : ''
                        }`}
                    title="Bullet List"
                >
                    <FiList />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('orderedList') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : ''
                        }`}
                    title="Numbered List"
                >
                    <span className="text-sm font-semibold">1.</span>
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('taskList') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : ''
                        }`}
                    title="Task List"
                >
                    <FiCheckSquare />
                </button>
            </div>

            {/* Alignment */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : ''
                        }`}
                    title="Align Left"
                >
                    <FiAlignLeft />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : ''
                        }`}
                    title="Align Center"
                >
                    <FiAlignCenter />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : ''
                        }`}
                    title="Align Right"
                >
                    <FiAlignRight />
                </button>
            </div>

            {/* Blocks */}
            <div className="flex gap-1">
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('codeBlock') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : ''
                        }`}
                    title="Code Block"
                >
                    <FiCode className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('blockquote') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : ''
                        }`}
                    title="Quote"
                >
                    <span className="text-lg font-bold">"</span>
                </button>
                <button
                    type="button"
                    onMouseDown={handleButtonClick(addLink)}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('link') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    title="Add Link"
                >
                    <FiLink />
                </button>
            </div>
        </div>
    );
};

const RichTextEditor = React.forwardRef(({ content, onChange, placeholder = 'Start writing...', readOnly = false }, ref) => {
    const editor = useEditor({
        editable: !readOnly,
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Highlight,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
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
                console.log('=== INSERT HTML DEBUG ===');
                console.log('HTML to insert (first 200 chars):', html.substring(0, 200));
                console.log('HTML type:', typeof html);

                try {
                    // Define the extensions list (same as editor)
                    const extensions = [
                        StarterKit,
                        Underline,
                        Link,
                        Highlight,
                        TextAlign,
                        TaskList,
                        TaskItem,
                    ];

                    // Parse HTML string to Tiptap JSON using generateJSON
                    const jsonContent = generateJSON(html, extensions);
                    console.log('Parsed JSON:', JSON.stringify(jsonContent).substring(0, 200));

                    // Insert at current cursor position (or at end if no selection)
                    // This respects where the user's cursor is
                    const result = editor.chain()
                        .focus() // Focus the editor first
                        .insertContent(jsonContent) // Insert the parsed content
                        .run();

                    console.log('Insert result:', result);
                    console.log('Insert successful!');
                } catch (error) {
                    console.error('Insert failed:', error);
                    console.error('Error stack:', error.stack);
                }
            } else {
                console.error('Editor is null!');
            }
        },
        getEditor: () => editor
    }));

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
            {!readOnly && <MenuBar editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
