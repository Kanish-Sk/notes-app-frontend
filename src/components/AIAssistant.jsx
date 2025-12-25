import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiSend, FiZap, FiPlus, FiMessageSquare, FiTrash2, FiMaximize2, FiMinimize2, FiList, FiSettings, FiFileText } from 'react-icons/fi';
import { aiAPI, chatsAPI, settingsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const AIAssistant = ({
    isOpen,
    onClose,
    onSendMessage,
    onInsertContent,
    currentContent,
    onOpenSettings,
    isSidebarMode,
    setIsSidebarMode,
    width,
    setWidth,
    settingsUpdateTrigger,
    prefillMessage
}) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [showChatList, setShowChatList] = useState(false);
    const [savedChats, setSavedChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [chatTitle, setChatTitle] = useState('New Chat');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [hasProviders, setHasProviders] = useState(false);
    const [configuredProviders, setConfiguredProviders] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState(null);

    const { addToast } = useToast();
    const { accessToken } = useAuth();
    const messagesEndRef = useRef(null);
    const sidebarRef = useRef(null);
    const textareaRef = useRef(null);
    const abortStreamRef = useRef(null);

    // Robust auto-resize textarea
    useEffect(() => {
        const triggerResize = () => {
            if (textareaRef.current) {
                const el = textareaRef.current;

                // Forcing layout recalculation
                el.style.height = '0px';
                const scrollHeight = el.scrollHeight;

                const maxHeight = 250;
                const minHeight = 44;
                const finalHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

                el.style.height = finalHeight + 'px';
                el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
            }
        };

        // Always trigger when message or isOpen changes
        triggerResize();

        // Multi-stage trigger to overcome CSS transition delays
        const frames = [
            requestAnimationFrame(triggerResize),
            requestAnimationFrame(() => requestAnimationFrame(triggerResize)),
            setTimeout(triggerResize, 100),
            setTimeout(triggerResize, 300)
        ];

        return () => {
            frames.forEach(f => typeof f === 'number' ? clearTimeout(f) : cancelAnimationFrame(f));
        };
    }, [message, isOpen, isSidebarMode, width]);



    // Insert into notes function - now uses the direct insert
    const handleInsert = async (text) => {
        console.log('=== AIASSISTANT: handleInsert called ===');
        console.log('Text:', text.substring(0, 100));
        console.log('onInsertContent exists:', !!onInsertContent);

        if (onInsertContent) {
            console.log('Calling onInsertContent...');
            await onInsertContent(text);
            console.log('onInsertContent call complete');
        } else {
            console.error('onInsertContent is not defined!');
            addToast('Insert function not available', 'error');
        }
    };

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isLoading, streamingMessageId]);

    // Cleanup streaming on unmount
    useEffect(() => {
        return () => {
            if (abortStreamRef.current) {
                abortStreamRef.current();
            }
        };
    }, []);

    useEffect(() => {
        if (prefillMessage) {
            setMessage(prefillMessage);
            // Just focus, resizing is handled by the other useEffect
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = prefillMessage.length;
                }
            });
        }
    }, [prefillMessage]);

    const checkProviders = async () => {
        setIsChecking(true);
        try {
            console.log('Checking providers...');
            // Timeout after 5 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            const apiPromise = settingsAPI.getSettings(accessToken);

            const response = await Promise.race([apiPromise, timeoutPromise]);
            console.log('Provider check response:', response);

            const providers = response.data?.providers || [];
            setConfiguredProviders(providers);
            // Check if there is at least one ACTIVE provider
            const hasActive = providers.some(p => p.is_active);
            setHasProviders(hasActive);

            // Set default provider
            if (response.data.default_model) {
                const defaultP = providers.find(p => p.name === response.data.default_model);
                if (defaultP && defaultP.is_active) {
                    setSelectedProvider(defaultP);
                } else {
                    // Fallback if default is not active or found
                    const activeProvider = providers.find(p => p.is_active);
                    if (activeProvider) setSelectedProvider(activeProvider);
                }
            } else {
                // Fallback logic
                const activeProvider = providers.find(p => p.is_active);
                if (activeProvider && !selectedProvider) {
                    setSelectedProvider(activeProvider);
                }
            }
        } catch (error) {
            console.error('Error checking providers:', error);
            setHasProviders(false);
            setConfiguredProviders([]);
        } finally {
            setIsChecking(false);
        }
    };

    const loadChats = async () => {
        try {
            const response = await chatsAPI.getAllChats(accessToken);
            setSavedChats(response.data);
        } catch (error) {
            console.error('Error loading chats:', error);
            addToast('Failed to load chat history', 'error');
        }
    };

    // Load saved chats and check providers
    useEffect(() => {
        if (isOpen) {
            loadChats();
            checkProviders();
        }
    }, [isOpen, settingsUpdateTrigger]);

    // Resizing Logic (Only for Sidebar Mode)
    const startResizing = useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((mouseMoveEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - mouseMoveEvent.clientX;
            const maxWidth = window.innerWidth * 0.5; // Max 50%
            const minWidth = 300; // Min 300px

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        }
    }, [isResizing, setWidth]);

    useEffect(() => {
        if (isSidebarMode) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            return () => {
                window.removeEventListener('mousemove', resize);
                window.removeEventListener('mouseup', stopResizing);
            };
        }
    }, [resize, stopResizing, isSidebarMode]);


    const handleSend = async () => {
        if (!message.trim()) return;

        // Double check providers
        const hasActive = configuredProviders.some(p => p.is_active);
        if (!hasActive) {
            addToast('Please configure and activate an LLM provider first', 'error');
            setHasProviders(false);
            return;
        }

        // Determine title for new chat
        let newTitle = chatTitle;
        if (chatHistory.length === 0) {
            newTitle = message.length > 30 ? message.substring(0, 30) + '...' : message;
            setChatTitle(newTitle);
        }

        const userMessage = { role: 'user', content: message, timestamp: new Date() };
        const streamingMsgId = Date.now().toString();
        const aiPlaceholder = {
            role: 'assistant',
            content: '', // Empty to show thinking dots initially
            timestamp: new Date(),
            id: streamingMsgId,
            isStreaming: true
        };

        const newHistory = [...chatHistory, userMessage, aiPlaceholder];
        setChatHistory(newHistory);
        setStreamingMessageId(streamingMsgId);

        // Clear input immediately
        const currentMessage = message;
        setMessage('');
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
        }
        setIsLoading(true);

        // Use refs for performance - avoid state updates on every chunk
        const fullResponseRef = { current: '' };
        let updateScheduled = false;
        let lastUpdateTime = 0;
        const UPDATE_INTERVAL = 50; // Update UI every 50ms max

        // Build the messages array for streaming
        const historyForAPI = [...chatHistory, userMessage].map(m => ({
            role: m.role,
            content: m.content
        }));

        // Helper to strip COMMAND lines from display
        const stripCommands = (text) => {
            // Remove any line that contains COMMAND:
            return text.split('\n')
                .filter(line => !line.includes('COMMAND:'))
                .join('\n')
                .trim();
        };

        // Batched UI update function
        const scheduleUpdate = () => {
            if (updateScheduled) return;

            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTime;

            if (timeSinceLastUpdate >= UPDATE_INTERVAL) {
                // Update immediately with commands stripped
                lastUpdateTime = now;
                setChatHistory(prev => prev.map(msg =>
                    msg.id === streamingMsgId
                        ? { ...msg, content: stripCommands(fullResponseRef.current) }
                        : msg
                ));
            } else {
                // Schedule update
                updateScheduled = true;
                setTimeout(() => {
                    updateScheduled = false;
                    lastUpdateTime = Date.now();
                    setChatHistory(prev => prev.map(msg =>
                        msg.id === streamingMsgId
                            ? { ...msg, content: stripCommands(fullResponseRef.current) }
                            : msg
                    ));
                }, UPDATE_INTERVAL - timeSinceLastUpdate);
            }
        };

        // Start streaming
        const onChunk = (chunk) => {
            fullResponseRef.current += chunk;
            scheduleUpdate();
        };

        const onComplete = async () => {
            setIsLoading(false);
            setStreamingMessageId(null);

            // Strip COMMAND: lines from display
            const displayMessage = fullResponseRef.current.split('\n')
                .filter(line => !line.includes('COMMAND:'))
                .join('\n')
                .trim();

            // Final update with complete content
            setChatHistory(prev => {
                const updated = prev.map(msg =>
                    msg.id === streamingMsgId
                        ? { ...msg, content: displayMessage, isStreaming: false }
                        : msg
                );
                // Save chat after updating
                saveCurrentChat(updated, newTitle);
                return updated;
            });

            // Pass the full response to parent for command parsing
            try {
                await onSendMessage(currentMessage, currentContent, false, historyForAPI, fullResponseRef.current);
            } catch (e) {
                console.error('Error in command parsing:', e);
            }
        };

        const onError = (error) => {
            setIsLoading(false);
            setStreamingMessageId(null);
            console.error('Streaming error:', error);

            // Extract user-friendly error message
            let errorMessage = 'Sorry, I encountered an error. Please try again.';
            if (error && typeof error === 'string') {
                errorMessage = error;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            setChatHistory(prev => prev.map(msg =>
                msg.id === streamingMsgId
                    ? { ...msg, content: errorMessage, isStreaming: false }
                    : msg
            ));
            addToast('Failed to get AI response', 'error');
        };

        // Abort any previous stream
        if (abortStreamRef.current) {
            abortStreamRef.current();
        }

        abortStreamRef.current = aiAPI.chatStream(
            currentMessage,
            currentContent,
            false,
            accessToken,
            historyForAPI,
            onChunk,
            onComplete,
            onError
        );
    };

    const saveCurrentChat = async (messages = chatHistory, title = chatTitle) => {
        try {
            if (currentChatId) {
                await chatsAPI.updateChat(currentChatId, {
                    messages: messages,
                    title: title
                }, accessToken);
            } else if (messages.length > 0) {
                const response = await chatsAPI.createChat({
                    title: title,
                    messages: messages
                }, accessToken);
                setCurrentChatId(response.data._id);
                await loadChats();
            }
        } catch (error) {
            console.error('Error saving chat:', error);
            addToast('Failed to save chat', 'error');
        }
    };

    const handleNewChat = () => {
        setChatHistory([]);
        setCurrentChatId(null);
        setChatTitle('New Chat');
        setShowChatList(false);
    };

    const handleLoadChat = async (chatId) => {
        try {
            const response = await chatsAPI.getChat(chatId, accessToken);
            setChatHistory(response.data.messages);
            setCurrentChatId(chatId);
            setChatTitle(response.data.title);
            setShowChatList(false);
        } catch (error) {
            console.error('Error loading chat:', error);
            addToast('Failed to load chat', 'error');
        }
    };

    const handleDeleteClick = (chatId, e) => {
        e.stopPropagation();
        setChatToDelete(chatId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (chatToDelete) {
            try {
                await chatsAPI.deleteChat(chatToDelete, accessToken);
                if (currentChatId === chatToDelete) {
                    handleNewChat();
                }
                await loadChats();
                addToast('Chat deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting chat:', error);
                addToast('Failed to delete chat', 'error');
            }
        }
        setShowDeleteModal(false);
        setChatToDelete(null);
    };

    return (
        <>
            <div
                ref={sidebarRef}
                className={`fixed bg-white dark:bg-gray-800 shadow-2xl transform transition-all duration-300 ease-in-out z-50 flex flex-col border-gray-200 dark:border-gray-700
                    ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
                    ${isSidebarMode
                        ? 'top-0 right-0 h-full border-l rounded-none'
                        : 'bottom-6 right-6 w-[400px] h-[600px] rounded-2xl border'
                    }
                `}
                style={{ width: isSidebarMode ? `${width}px` : undefined }}
            >
                {/* Resize Handle (Only in Sidebar Mode) */}
                {isSidebarMode && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-purple-500 transition-colors z-50"
                        onMouseDown={startResizing}
                    />
                )}

                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 ${!isSidebarMode ? 'rounded-t-2xl' : ''}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                            <img src="/notefusion-robot.jpg" alt="Note Fusion AI" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                Note Fusion Assistant
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {selectedProvider ? `${selectedProvider.name} - ${selectedProvider.model || selectedProvider.provider}` : 'No provider selected'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsSidebarMode(!isSidebarMode)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title={isSidebarMode ? "Switch to Floating Mode" : "Expand to Sidebar"}
                        >
                            {isSidebarMode ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {isChecking ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : !hasProviders ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <FiSettings className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Setup Required
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                            Please configure an LLM provider (like OpenAI or Gemini) to start chatting with the AI Assistant.
                        </p>
                        <button
                            onClick={() => {
                                onOpenSettings();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-md"
                        >
                            <FiSettings className="w-4 h-4" />
                            Configure Settings
                        </button>
                        <button
                            onClick={checkProviders}
                            className="mt-4 text-xs text-purple-500 hover:underline"
                        >
                            I've updated settings, try again
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Chat List Sidebar (Toggleable) */}
                        {showChatList && (
                            <div className={`absolute inset-0 z-10 bg-white dark:bg-gray-800 flex flex-col ${!isSidebarMode ? 'rounded-2xl' : ''}`}>
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Chat History</h3>
                                    <button onClick={() => setShowChatList(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                        <FiX className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2">
                                    {savedChats.map(chat => (
                                        <div
                                            key={chat._id}
                                            onClick={() => handleLoadChat(chat._id)}
                                            className="group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all mb-2"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FiMessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{chat.title}</p>
                                                    <p className="text-xs text-gray-400 truncate">{new Date(chat.updated_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteClick(chat._id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Toolbar */}
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowChatList(true)}
                                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2 text-xs font-medium"
                                    >
                                        <FiList className="w-4 h-4" />
                                        History
                                    </button>
                                    <button
                                        onClick={handleNewChat}
                                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2 text-xs font-medium"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        New Chat
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                            {chatHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-1 mb-4">
                                        <img src="/notefusion-robot.jpg" alt="Note Fusion AI" className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">How can I help you?</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                        Ask me to write code, summarize notes, or help you brainstorm ideas.
                                    </p>
                                </div>
                            ) : (
                                chatHistory.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl overflow-hidden shadow-sm ${msg.role === 'user'
                                                ? 'bg-purple-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                                                }`}
                                        >
                                            <div className="px-4 py-3">
                                                {msg.role === 'user' ? (
                                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                ) : msg.isStreaming && !msg.content ? (
                                                    // Show typing indicator when streaming starts but no content yet
                                                    <div className="flex items-center gap-1 py-1">
                                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                ) : (
                                                    // Render markdown (both during streaming and after completion)
                                                    <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
                                                        <ReactMarkdown
                                                            rehypePlugins={[rehypeRaw]}
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                code({ node, inline, className, children, ...props }) {
                                                                    const match = /language-(\w+)/.exec(className || '');
                                                                    return !inline && match ? (
                                                                        <SyntaxHighlighter
                                                                            style={vscDarkPlus}
                                                                            language={match[1]}
                                                                            PreTag="div"
                                                                            className="rounded-lg my-4 text-sm"
                                                                            {...props}
                                                                        >
                                                                            {String(children).replace(/\n$/, '')}
                                                                        </SyntaxHighlighter>
                                                                    ) : (
                                                                        <code className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                                            {children}
                                                                        </code>
                                                                    );
                                                                },
                                                                h1: ({ children }) => (
                                                                    <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-white">
                                                                        {children}
                                                                    </h1>
                                                                ),
                                                                h2: ({ children }) => (
                                                                    <h2 className="text-xl font-bold mt-5 mb-2 text-gray-900 dark:text-white">
                                                                        {children}
                                                                    </h2>
                                                                ),
                                                                h3: ({ children }) => (
                                                                    <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white">
                                                                        {children}
                                                                    </h3>
                                                                ),
                                                                p: ({ children, node }) => {
                                                                    const hasCodeBlock = node?.children?.some(
                                                                        child => child.tagName === 'code' && child.properties?.className?.includes('language-')
                                                                    );
                                                                    if (hasCodeBlock) {
                                                                        return (
                                                                            <div className="my-3 leading-7 text-gray-800 dark:text-gray-200">
                                                                                {children}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <p className="my-3 leading-7 text-gray-800 dark:text-gray-200">
                                                                            {children}
                                                                        </p>
                                                                    );
                                                                },
                                                                ul: ({ children }) => (
                                                                    <ul className="my-3 list-disc pl-6 space-y-1">
                                                                        {children}
                                                                    </ul>
                                                                ),
                                                                ol: ({ children }) => (
                                                                    <ol className="my-3 list-decimal pl-6 space-y-1">
                                                                        {children}
                                                                    </ol>
                                                                ),
                                                                li: ({ children }) => (
                                                                    <li className="leading-7 text-gray-800 dark:text-gray-200">
                                                                        {children}
                                                                    </li>
                                                                ),
                                                                strong: ({ children }) => (
                                                                    <strong className="font-bold text-gray-900 dark:text-white">
                                                                        {children}
                                                                    </strong>
                                                                ),
                                                                a: ({ children, href }) => (
                                                                    <a href={href} className="text-indigo-600 dark:text-indigo-400 underline font-medium hover:text-indigo-800 dark:hover:text-indigo-300" target="_blank" rel="noopener noreferrer">
                                                                        {children}
                                                                    </a>
                                                                ),
                                                                blockquote: ({ children }) => (
                                                                    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 my-4">
                                                                        {children}
                                                                    </blockquote>
                                                                ),
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                                <p className={`text-[10px] mt-1.5 opacity-70 ${msg.role === 'user' ? 'text-purple-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>

                                            {/* Action buttons for AI responses */}
                                            {msg.role === 'assistant' && !msg.isStreaming && (
                                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleInsert(msg.content)}
                                                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                                        title="Insert into current note"
                                                    >
                                                        <FiFileText className="w-3 h-3" />
                                                        Insert
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className={`p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${!isSidebarMode ? 'rounded-b-2xl' : ''}`}>
                            {/* Model Selector (Bottom) */}
                            {configuredProviders.filter(p => p.is_active).length > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <select
                                        value={selectedProvider?.name || ''}
                                        onChange={(e) => {
                                            const provider = configuredProviders.find(p => p.name === e.target.value);
                                            setSelectedProvider(provider);
                                        }}
                                        className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        {configuredProviders.filter(p => p.is_active).map(provider => (
                                            <option key={provider.name} value={provider.name}>
                                                {provider.name} - {provider.model || provider.provider}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedProvider?.name === configuredProviders.find(p => p.name === selectedProvider?.name)?.name && (
                                        <span className="text-[10px] text-gray-400">
                                            Using {selectedProvider.name}
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-900 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-none overflow-y-auto"
                                    rows="1"
                                    style={{ minHeight: '44px', maxHeight: '250px', lineHeight: '24px' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!message.trim() || isLoading}
                                    className="absolute right-2 bottom-3.5 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <FiSend className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-gray-400 mt-2">
                                AI can make mistakes. Consider checking important information.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Delete Chat?
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to delete this conversation? This action cannot be undone.
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
        </>
    );
};

export default AIAssistant;
