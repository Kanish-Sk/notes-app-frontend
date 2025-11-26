import React, { useState, useEffect } from 'react';
import { FiZap } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import AIAssistant from '../components/AIAssistant';
import SettingsModal from '../components/SettingsModal';
import MongoDBSetupModal from '../components/MongoDBSetupModal';
import { notesAPI, aiAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Home() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [aiOpen, setAiOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [aiSidebarMode, setAiSidebarMode] = useState(false);
    const [aiSidebarWidth, setAiSidebarWidth] = useState(450);
    const [settingsUpdateTrigger, setSettingsUpdateTrigger] = useState(0);
    const [showMongoModal, setShowMongoModal] = useState(false);
    const [pendingNoteCreation, setPendingNoteCreation] = useState(null);

    const { accessToken, user } = useAuth();
    const { addToast } = useToast();
    const editorRef = React.useRef(null);

    // Load notes on mount
    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            const apiPromise = notesAPI.getAllNotes(accessToken);

            const response = await Promise.race([apiPromise, timeoutPromise]);
            setNotes(response.data);
            if (response.data.length > 0 && !selectedNote) {
                setSelectedNote(response.data[0]);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async (folder = null) => {
        // Check if user has database configured and has no notes (first note)
        if (user && !user.has_database && notes.length === 0) {
            // Store the folder for later use after MongoDB setup
            setPendingNoteCreation(folder);
            setShowMongoModal(true);
            return;
        }

        try {
            const newNote = {
                title: `Untitled ${new Date().toLocaleTimeString()}`,
                content: '# New Note\n\nStart writing here...',
            };
            // If folder is provided, add folder_id
            if (folder) {
                newNote.folder_id = folder._id || folder.id;
            }
            const response = await notesAPI.createNote(newNote, accessToken);
            setNotes([response.data, ...notes]);
            setSelectedNote(response.data);
            addToast('Note created successfully', 'success');
        } catch (error) {
            console.error('Error creating note:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to create note';
            addToast(errorMsg, 'error');
        }
    };

    const handleSelectNote = (note) => {
        setSelectedNote(note);
    };

    const handleUpdateNote = async (id, updates) => {
        try {
            const response = await notesAPI.updateNote(id, updates, accessToken);
            setNotes(notes.map((note) => (note._id === id ? response.data : note)));
            if (selectedNote?._id === id) {
                setSelectedNote(response.data);
            }
        } catch (error) {
            console.error('Error updating note:', error);
            // Re-throw error so Sidebar can handle it and show toast
            throw error;
        }
    };

    const handleDeleteNote = async (id) => {
        try {
            await notesAPI.deleteNote(id, accessToken);
            const updatedNotes = notes.filter((note) => note._id !== id);
            setNotes(updatedNotes);
            // If the deleted note was selected, clear selection or select the next note
            if (selectedNote?._id === id) {
                setSelectedNote(updatedNotes[0] || null);
            }
            addToast('Note deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting note:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to delete note';
            addToast(errorMsg, 'error');
            throw error;
        }
    };

    const handleAIMessage = async (message, currentContent, editMode) => {
        try {
            const response = await aiAPI.chat(message, currentContent, editMode, accessToken);

            if (editMode && response.data.updated_content && selectedNote) {
                console.log('=== EDIT MODE: Converting markdown to HTML ===');
                console.log('Received markdown:', response.data.updated_content.substring(0, 200));

                // Convert markdown to HTML using marked
                const { marked } = await import('marked');
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: false,
                    mangle: false
                });

                const htmlContent = marked.parse(response.data.updated_content);
                console.log('Converted to HTML:', htmlContent.substring(0, 200));

                await handleUpdateNote(selectedNote._id, {
                    content: htmlContent,  // Save as HTML, not markdown
                });
            }

            return response.data;
        } catch (error) {
            console.error('Error with AI chat:', error);
            throw error;
        }
    };

    // Direct content insertion without AI processing
    const handleInsertContent = async (textToInsert) => {
        console.log('=== HOME.JSX: INSERT CONTENT CALLED ===');
        console.log('Text to insert:', textToInsert);

        if (!selectedNote) {
            console.error('No note selected!');
            addToast('Please select a note first', 'error');
            return;
        }

        if (!editorRef.current) {
            console.error('Editor ref is null!');
            addToast('Editor not ready', 'error');
            return;
        }

        console.log('editorRef.current exists:', !!editorRef.current);
        console.log('editorRef.current.insertHTML exists:', !!editorRef.current.insertHTML);

        try {
            // Use marked library for proper markdown to HTML conversion
            const { marked } = await import('marked');

            // Configure marked to be compatible with Tiptap
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });

            // Convert markdown to HTML
            let htmlContent = marked.parse(textToInsert);

            console.log('=== CONVERSION RESULTS ===');
            console.log('Input (markdown):', textToInsert);
            console.log('Output (HTML):', htmlContent);
            console.log('HTML length:', htmlContent.length);
            console.log('First 200 chars:', htmlContent.substring(0, 200));

            // Insert directly into the editor
            console.log('Calling editorRef.current.insertHTML...');
            editorRef.current.insertHTML(htmlContent);
            console.log('Insert complete!');

            addToast('Content inserted successfully', 'success');
        } catch (error) {
            console.error('=== INSERT ERROR ===');
            console.error('Error inserting content:', error);
            console.error('Stack:', error.stack);
            addToast('Failed to insert content', 'error');
        }
    };

    const handleMongoSetupSuccess = async () => {
        setShowMongoModal(false);

        // Update user's has_database status locally
        if (user) {
            user.has_database = true;
        }

        addToast('Database configured successfully!', 'success');

        // Create the pending note if there was one
        if (pendingNoteCreation !== null) {
            await handleCreateNote(pendingNoteCreation);
            setPendingNoteCreation(null);
        }
    };

    const handleMongoModalClose = () => {
        setShowMongoModal(false);
        setPendingNoteCreation(null);
    };

    const handleCloseSettings = () => {
        setShowSettings(false);
        setSettingsUpdateTrigger(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">📝</div>
                    <p className="text-gray-500 dark:text-gray-400">Loading your notes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-white dark:bg-gray-900 overflow-hidden relative">
            {/* Main Content Wrapper - Adjusts width when AI sidebar is open */}
            <div
                className="flex-1 flex h-full transition-all duration-300 ease-in-out"
                style={{
                    marginRight: aiOpen && aiSidebarMode ? `${aiSidebarWidth}px` : '0'
                }}
            >
                {/* Sidebar */}
                <Sidebar
                    notes={notes}
                    selectedNote={selectedNote}
                    onSelectNote={handleSelectNote}
                    onCreateNote={handleCreateNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    onNotesChanged={loadNotes}
                    onOpenSettings={() => setShowSettings(true)}
                />

                {/* Editor */}
                <Editor
                    ref={editorRef}
                    note={selectedNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                />
            </div>

            {/* AI Assistant Toggle Button */}
            {!aiOpen && (
                <button
                    onClick={() => setAiOpen(true)}
                    className="fixed bottom-12 right-10 w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-110 z-40"
                    title="AI Assistant"
                >
                    <FiZap className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {/* AI Assistant Panel */}
            <AIAssistant
                isOpen={aiOpen}
                onClose={() => setAiOpen(false)}
                onSendMessage={handleAIMessage}
                onInsertContent={handleInsertContent}
                currentContent={selectedNote?.content || ''}
                onOpenSettings={() => setShowSettings(true)}
                isSidebarMode={aiSidebarMode}
                setIsSidebarMode={setAiSidebarMode}
                width={aiSidebarWidth}
                setWidth={setAiSidebarWidth}
                settingsUpdateTrigger={settingsUpdateTrigger}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={showSettings}
                onClose={handleCloseSettings}
            />

            {/* MongoDB Setup Modal */}
            <MongoDBSetupModal
                isOpen={showMongoModal}
                onClose={handleMongoModalClose}
                onSuccess={handleMongoSetupSuccess}
                accessToken={accessToken}
            />
        </div>
    );
}

export default Home;
