import React, { useState, useEffect } from 'react';
import { FiZap } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import AIAssistant from '../components/AIAssistant';
import SettingsModal from '../components/SettingsModal';
import MongoDBSetupModal from '../components/MongoDBSetupModal';
import CloudinarySettingsModal from '../components/CloudinarySettingsModal';
import { notesAPI, aiAPI, foldersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Home() {
    const [notes, setNotes] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [aiOpen, setAiOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [aiSidebarMode, setAiSidebarMode] = useState(false);
    const [aiSidebarWidth, setAiSidebarWidth] = useState(450);
    const [settingsUpdateTrigger, setSettingsUpdateTrigger] = useState(0);
    const [showMongoModal, setShowMongoModal] = useState(false);
    const [showCloudinaryModal, setShowCloudinaryModal] = useState(false);
    const [pendingNoteCreation, setPendingNoteCreation] = useState(null);
    const [askAIText, setAskAIText] = useState(null);

    const { accessToken, user, updateUser } = useAuth();
    const { addToast } = useToast();
    const editorRef = React.useRef(null);

    // Load notes and folders on mount
    useEffect(() => {
        if (accessToken) {
            loadNotes();
            loadFolders();
        }
    }, [accessToken]);

    const loadFolders = async () => {
        try {
            const response = await foldersAPI.getAllFolders(accessToken);
            setFolders(response.data);
        } catch (err) {
            console.error('Failed to load folders', err);
        }
    };

    const loadNotes = async () => {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            const apiPromise = notesAPI.getAllNotes(accessToken);

            const response = await Promise.race([apiPromise, timeoutPromise]);
            setNotes(response.data);

            // Always select the first note on load if none is selected or selected note is missing
            if (response.data.length > 0) {
                const currentNoteExists = response.data.find(n => n._id === selectedNote?._id);
                if (!selectedNote || !currentNoteExists) {
                    setSelectedNote(response.data[0]);
                }
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async (folder = null, title = null, content = null) => {
        // Check if user has database configured and has no notes (first note)
        if (user && !user.has_database && notes.length === 0) {
            // Store the folder for later use after MongoDB setup
            setPendingNoteCreation(folder);
            setShowMongoModal(true);
            return;
        }

        try {
            const newNote = {
                title: title || `Untitled ${new Date().toLocaleTimeString()}`,
                content: content || '# New Note\n\nStart writing here...',
            };
            // If folder is provided, add folder_id
            if (folder) {
                newNote.folder_id = folder._id || folder.id;
            }
            const response = await notesAPI.createNote(newNote, accessToken);
            setNotes(prevNotes => [response.data, ...prevNotes]);
            setSelectedNote(response.data);
            addToast('Note created successfully', 'success');
            return response.data;
        } catch (error) {
            console.error('Error creating note:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to create note';
            addToast(errorMsg, 'error');
        }
    };



    const handleDeleteFolder = async (folderId, folderName, moveToRoot = true) => {
        try {
            await foldersAPI.deleteFolder(folderId, accessToken, moveToRoot);
            await loadFolders();

            // If we deleted contents, always reload all notes
            if (!moveToRoot) {
                await loadNotes();
            } else if (selectedNote && (selectedNote.folder_id === folderId || selectedNote.folder_id === (folderId._id || folderId))) {
                // If items were moved to root and current note was in this folder, reload to update its folder_id
                await loadNotes();
            }

            // Clear note selection if the deleted folder contained the current note and contents were deleted
            if (!moveToRoot && selectedNote && (selectedNote.folder_id === folderId || selectedNote.folder_id === (folderId._id || folderId))) {
                setSelectedNote(null);
            }

            addToast(`Folder "${folderName}" deleted successfully`, 'success');
        } catch (error) {
            console.error('Error deleting folder:', error);
            addToast('Failed to delete folder', 'error');
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

    // Helper to find or create folder by name
    const ensureFolderExists = async (folderName, parentName = null) => {
        if (!folderName) return null;

        // Fetch latest folders to ensure we have current list
        try {
            const latestFoldersResponse = await foldersAPI.getAllFolders(accessToken);
            const currentFolders = latestFoldersResponse.data;
            // setFolders(currentFolders); // No need to re-set here, we use loadFolders in handle functions

            let folder = currentFolders.find(f => f.name.toLowerCase() === folderName.trim().toLowerCase());
            if (folder) return folder;

            console.log(`AI: Creating new folder: ${folderName}`);
            const folderData = { name: folderName.trim() };
            if (parentName) {
                const parent = currentFolders.find(f => f.name.toLowerCase() === parentName.trim().toLowerCase());
                if (parent) folderData.parent_id = parent._id || parent.id;
            }
            const response = await foldersAPI.createFolder(folderData, accessToken);
            const newFolder = response.data;
            setFolders(prev => [...prev, newFolder]);
            return newFolder;
        } catch (e) {
            console.error("AI: Failed to auto-create folder", e);
            return null;
        }
    };

    const handleAIMessage = async (message, currentContent, editMode, history = []) => {
        try {
            console.log('=== AI MESSAGE ===');

            // Re-fetch latest data to ensure command processing uses current state
            const foldersRes = await foldersAPI.getAllFolders(accessToken);
            const latestFolders = foldersRes.data;
            const notesRes = await notesAPI.getAllNotes(accessToken);
            const latestNotes = notesRes.data;

            // If editing a selection, prepend instruction to only edit that part
            let finalMessage = message;
            if (editMode && selectedTextInfo && selectedTextInfo.text) {
                finalMessage = `IMPORTANT INSTRUCTIONS:
1. You are ONLY editing this selected portion (do NOT return the entire document):

---SELECTED TEXT TO EDIT---
${selectedTextInfo.text}
---END OF SELECTION---

2. User's modification request: ${message}

3. Your response should ONLY contain:
   - A brief acknowledgment (e.g., "I've updated the selected text to be more professional")
   - ONLY the edited portion (the modified version of the selected text above)
   
DO NOT include the rest of the document. ONLY return the edited selection.`;
            }

            const response = await aiAPI.chat(finalMessage, currentContent, editMode, accessToken, history);
            const aiData = response.data;
            const aiText = aiData.message || "";

            // --- AI ACTION PARSING ---
            console.log('AI Full Response Text:', aiText);
            const foundCommands = [];

            if (aiText.includes('COMMAND:')) {
                const lines = aiText.split('\n');
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    const commandMatch = trimmedLine.match(/COMMAND:([A-Z_]+):\s*(\{.*\})/);
                    if (!commandMatch) continue;
                    
                    const commandType = commandMatch[1];
                    const jsonString = commandMatch[2];
                    console.log('Processing Command:', commandType, 'with data:', jsonString);

                    let data;
                    try {
                        data = JSON.parse(jsonString);
                    } catch (e) {
                        console.error("AI JSON Parse Error:", e, "Line:", trimmedLine);
                        continue;
                    }
                    
                    foundCommands.push(commandType);

                    if (commandType === 'CREATE_FOLDER') {
                        try {
                            await ensureFolderExists(data.name, data.parent_name);
                        } catch (e) { console.error("AI Create Folder Error:", e); }
                    }
                    else if (commandType === 'CREATE_NOTE') {
                        try {
                            let targetFolder = null;
                            if (data.folder_name) targetFolder = await ensureFolderExists(data.folder_name);
                            const { marked } = await import('marked');
                            await handleCreateNote(targetFolder, data.title, marked.parse(data.content || ""));
                        } catch (e) { console.error("AI Create Note Error:", e); }
                    }
                    else if (commandType === 'DELETE_NOTE') {
                        try {
                            console.log('AI ACTION: Attempting to delete note with title:', data.title);
                            const noteToDelete = latestNotes.find(n => n.title?.toString().trim().toLowerCase() === data.title?.toString().trim().toLowerCase());
                            if (noteToDelete) {
                                console.log('AI ACTION: Found note to delete:', noteToDelete);
                                await notesAPI.deleteNote(noteToDelete._id || noteToDelete.id, accessToken);
                                await loadNotes();
                                addToast(`Note "${noteToDelete.title}" deleted`, 'success');
                            } else {
                                console.warn('AI ACTION: Note not found for deletion:', data.title);
                                console.log('Available Notes:', latestNotes.map(n => n.title));
                            }
                        } catch (e) { console.error("AI Delete Note Error:", e); }
                    }
                    else if (commandType === 'DELETE_FOLDER') {
                        try {
                            console.log('AI ACTION: Searching for folder', data.name, 'in', latestFolders.map(f => f.name));
                            const folderToDelete = latestFolders.find(f => f.name?.toString().trim().toLowerCase() === data.name?.toString().trim().toLowerCase());
                            if (folderToDelete) {
                                console.log('AI ACTION: Found folder to delete', folderToDelete);
                                const folderId = folderToDelete._id || folderToDelete.id;
                                const moveToRoot = data.delete_contents === true ? false : true;
                                await handleDeleteFolder(folderId, folderToDelete.name, moveToRoot);
                            } else {
                                console.warn('AI ACTION: Folder not found for deletion:', data.name);
                            }
                        } catch (e) { console.error("AI Delete Folder Error:", e); }
                    }
                    else if (commandType === 'UPDATE_NOTE') {
                        try {
                            const note = latestNotes.find(n => n.title?.toString().trim().toLowerCase() === data.old_title?.toString().trim().toLowerCase());
                            if (note) {
                                let updates = {};
                                if (data.new_title) updates.title = data.new_title;
                                if (data.new_folder) {
                                    const folder = await ensureFolderExists(data.new_folder);
                                    updates.folder_id = folder ? (folder._id || folder.id) : null;
                                }
                                await handleUpdateNote(note._id || note.id, updates);
                                addToast(`Note "${note.title}" updated`, 'success');
                            } else {
                                console.warn('AI ACTION: Note not found for update:', data.old_title);
                            }
                        } catch (e) { console.error("AI Update Note Error:", e); }
                    }
                    else if (commandType === 'UPDATE_FOLDER') {
                        try {
                            const folderToUpdate = latestFolders.find(f => f.name?.toString().trim().toLowerCase() === data.old_name?.toString().trim().toLowerCase());
                            if (folderToUpdate) {
                                let updates = {};
                                if (data.new_name) updates.name = data.new_name;
                                if (data.new_parent) {
                                    const parent = await ensureFolderExists(data.new_parent);
                                    updates.parent_id = parent ? (parent._id || parent.id) : null;
                                }
                                await foldersAPI.updateFolder(folderToUpdate._id || folderToUpdate.id, updates, accessToken);
                                await loadFolders();
                                addToast(`Folder "${folderToUpdate.name}" updated`, 'success');
                            } else {
                                console.warn('AI ACTION: Folder not found for update:', data.old_name);
                            }
                        } catch (e) { console.error("AI Update Folder Error:", e); }
                    }
                }
            }

            if (editMode && response.data.updated_content && selectedNote) {
                // IMPORTANT: If there's a selection, don't auto-update the document
                // The matching is too unreliable - user should use Insert button instead  
                if (selectedTextInfo && selectedTextInfo.text) {
                    console.log('=== SELECTION IN EDIT MODE: Not auto-updating (use Insert button) ===');
                    setSelectedTextInfo(null);
                    return response.data;
                }

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



                // Check if we're editing a selection or the entire document
                if (selectedTextInfo && selectedTextInfo.text) {
                    console.log('=== SELECTIVE EDIT: Replacing selected portion ===');
                    console.log('Selected text:', selectedTextInfo.text.substring(0, 100));
                    console.log('Current content length:', currentContent.length);
                    console.log('AI response:', response.data.updated_content.substring(0, 300));

                    // The AI response might include an acknowledgment + the edited text
                    // Try to extract just the edited portion
                    let editedText = response.data.updated_content;

                    // Remove common acknowledgment patterns
                    const ackPatterns = [
                        /^I've updated.*?\n+/i,
                        /^Updated.*?\n+/i,
                        /^Here's the updated.*?\n+/i,
                        /^I've made.*?\n+/i,
                        /^Done\.?\n+/i
                    ];

                    for (const pattern of ackPatterns) {
                        editedText = editedText.replace(pattern, '');
                    }

                    console.log('Extracted edited text:', editedText.substring(0, 200));

                    // Convert selected text to HTML for matching
                    const selectedHtml = marked.parse(selectedTextInfo.text);
                    console.log('Selected HTML:', selectedHtml.substring(0, 200));

                    const htmlContent = marked.parse(editedText);
                    console.log('AI generated HTML:', htmlContent.substring(0, 200));

                    // Replace only the selected portion in the current content
                    let updatedContent;

                    // Strategy 1: Try exact HTML match
                    if (currentContent.includes(selectedHtml.trim())) {
                        console.log('✅ Found exact HTML match');
                        updatedContent = currentContent.replace(selectedHtml.trim(), htmlContent.trim());
                    }
                    // Strategy 2: Try exact text match
                    else if (currentContent.includes(selectedTextInfo.text)) {
                        console.log('✅ Found exact text match, replacing with HTML');
                        updatedContent = currentContent.replace(selectedTextInfo.text, htmlContent.trim());
                    }
                    // Strategy 3: Extract core text and find first occurrence
                    else {
                        console.log('⚠️ Trying fuzzy match (structure changed)');

                        // Get first meaningful line of selected text (without HTML tags)
                        const selectedTextClean = selectedTextInfo.text.trim().split('\n')[0].substring(0, 50);
                        console.log('Searching for:', selectedTextClean);

                        // Find where the selectedHtml appears in the current content
                        const selectionIndex = currentContent.indexOf(selectedHtml.trim());

                        if (selectionIndex !== -1) {
                            console.log('✅ Found position in document, replacing');
                            const before = currentContent.substring(0, selectionIndex);
                            const after = currentContent.substring(selectionIndex + selectedHtml.trim().length);
                            updatedContent = before + htmlContent.trim() + after;
                        } else {
                            console.warn('⚠️ Could not find selection anywhere, using full document');
                            updatedContent = htmlContent;
                        }
                    }
                    console.log('Updated content length:', updatedContent.length);

                    // Update the note with selective edit
                    await handleUpdateNote(selectedNote._id, {
                        content: updatedContent,
                    });

                    // Update local state
                    const updatedNoteData = {
                        ...selectedNote,
                        content: updatedContent
                    };

                    setSelectedNote(updatedNoteData);
                    setNotes(prevNotes =>
                        prevNotes.map(n =>
                            n._id === selectedNote._id ? updatedNoteData : n
                        )
                    );

                    // Clear selection info after edit
                    setSelectedTextInfo(null);
                } else {
                    console.log('=== FULL DOCUMENT EDIT ===');

                    // Parse full document response
                    const htmlContent = marked.parse(response.data.updated_content);
                    console.log('Converted to HTML:', htmlContent.substring(0, 200));

                    // Update the note with full content
                    await handleUpdateNote(selectedNote._id, {
                        content: htmlContent,
                    });

                    // Update local state - both selectedNote and notes array
                    const updatedNoteData = {
                        ...selectedNote,
                        content: htmlContent
                    };

                    setSelectedNote(updatedNoteData);
                    setNotes(prevNotes =>
                        prevNotes.map(n =>
                            n._id === selectedNote._id ? updatedNoteData : n
                        )
                    );
                }

                console.log('Note updated successfully!');
            }

            return response.data;
        } catch (error) {
            console.error('Error with AI chat:', error);
            throw error;
        }
    };

    // Handle Ask AI from text selection
    const [selectedTextInfo, setSelectedTextInfo] = useState(null);

    const handleAskAI = (selectedText) => {
        console.log('Ask AI with selected text:', selectedText);
        setAskAIText(selectedText);
        // Store selection info for potential editing
        setSelectedTextInfo({
            text: selectedText,
            timestamp: Date.now()
        });
        setAiOpen(true);
        // Clear after a short delay to allow the effect to trigger
        setTimeout(() => setAskAIText(null), 100);
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

    const handleMongoSetupSuccess = async (updatedUser) => {
        setShowMongoModal(false);

        // Update user with the data from backend
        if (updatedUser) {
            updateUser(updatedUser);
        } else if (user) {
            // Fallback: manually set has_database if backend didn't return user
            updateUser({ ...user, has_database: true });
        }

        addToast('Database configured successfully!', 'success');

        // Create the pending note if there was one, otherwise create a welcome note
        if (pendingNoteCreation !== null) {
            await handleCreateNote(pendingNoteCreation);
            setPendingNoteCreation(null);
        } else {
            // Automatically create a welcome note
            try {
                const welcomeNote = {
                    title: 'Welcome to NotesApp! 🎉',
                    content: `
                        <h1>Welcome to Your Personal Database!</h1>
                        <p>Your notes are now stored in your own MongoDB database. You have full control over your data.</p>
                        <h2>What you can do:</h2>
                        <ul>
                            <li>Create unlimited notes and folders</li>
                            <li>Use the AI assistant to help with writing</li>
                            <li>Share notes with others</li>
                            <li>Organize your thoughts effortlessly</li>
                        </ul>
                        <p><strong>Start writing your first note below!</strong></p>
                    `,
                };
                const response = await notesAPI.createNote(welcomeNote, accessToken);
                setNotes([response.data]);
                setSelectedNote(response.data);
            } catch (error) {
                console.error('Error creating welcome note:', error);
            }
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
                    folders={folders}
                    selectedNote={selectedNote}
                    onSelectNote={handleSelectNote}
                    onCreateNote={handleCreateNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    onNotesChanged={loadNotes}
                    onFoldersChanged={loadFolders}
                    onDeleteFolder={handleDeleteFolder}
                    onOpenSettings={() => setShowSettings(true)}
                />

                {/* Editor */}
                <Editor
                    ref={editorRef}
                    note={selectedNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    currentUser={user}
                    onAskAI={handleAskAI}
                    onConfigureCloudinary={() => setShowCloudinaryModal(true)}
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
                prefillMessage={askAIText}
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

            {/* Cloudinary Settings Modal */}
            <CloudinarySettingsModal
                isOpen={showCloudinaryModal}
                onClose={() => setShowCloudinaryModal(false)}
            />
        </div>
    );
}

export default Home;
