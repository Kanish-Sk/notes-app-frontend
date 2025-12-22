// Sidebar.jsx – Note sharing feature with clean UI and proper styling
import React, { useEffect, useState, useRef } from 'react';
import {
    FiPlus,
    FiFileText,
    FiMoon,
    FiSun,
    FiSettings,
    FiLogOut,
    FiFolder,
    FiTrash2,
    FiEdit2,
    FiCheck,
    FiX,
    FiChevronRight,
    FiChevronDown,
    FiShare2,
    FiMoreVertical
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { foldersAPI, notesAPI } from '../services/api';
import FolderModal from './FolderModal';
import DeleteFolderModal from './DeleteFolderModal';
import DeleteNoteModal from './DeleteNoteModal';
import ShareModal from './ShareNoteModal';

const Sidebar = ({
    notes,
    selectedNote,
    onSelectNote,
    onCreateNote,
    onOpenSettings,
    onUpdateNote,
    onDeleteNote,
    onNotesChanged,
}) => {
    const { isDark, toggleTheme } = useTheme();
    const { user, accessToken, logout } = useAuth();
    const { addToast } = useToast();

    const [folders, setFolders] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);
    const [deleteNoteModalOpen, setDeleteNoteModalOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [itemToShare, setItemToShare] = useState(null);
    const [shareItemType, setShareItemType] = useState('note');
    const editInputRef = useRef(null);

    // Load folders on auth change
    useEffect(() => {
        const fetchFolders = async () => {
            try {
                const response = await foldersAPI.getAllFolders(accessToken);
                setFolders(response.data);
            } catch (err) {
                console.error('Failed to load folders', err);
            }
        };
        if (user) fetchFolders();
    }, [user, accessToken]);

    // Focus edit input when editing starts
    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleCreateFolder = async (name) => {
        try {
            const folderData = { name };
            if (selectedFolder) folderData.parent_id = selectedFolder._id || selectedFolder.id;
            const response = await foldersAPI.createFolder(folderData, accessToken);
            const newFolder = response.data;
            setFolders((prev) => [...prev, newFolder]);
            if (selectedFolder) {
                setExpandedFolders((prev) => new Set([...prev, selectedFolder._id || selectedFolder.id]));
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to create folder';
            addToast(errorMsg, 'error');
        }
    };

    const openDeleteModal = (folder) => {
        setFolderToDelete(folder);
        setDeleteModalOpen(true);
        setContextMenu(null);
    };

    const handleDeleteFolder = async (moveToRoot) => {
        if (!folderToDelete) return;
        const folderId = folderToDelete._id || folderToDelete.id;
        const folderName = folderToDelete.name;
        try {
            await foldersAPI.deleteFolder(folderId, accessToken, moveToRoot);
            const response = await foldersAPI.getAllFolders(accessToken);
            setFolders(response.data);
            if ((selectedFolder?._id || selectedFolder?.id) === folderId) setSelectedFolder(null);
            if (selectedNote && selectedNote.folder_id === folderId) onSelectNote(null);
            if (onNotesChanged) onNotesChanged();
            setDeleteModalOpen(false);
            setFolderToDelete(null);
            addToast(`Folder "${folderName}" deleted successfully`, 'success');
        } catch (err) {
            console.error('Delete folder error', err);
            const errorMsg = err.response?.data?.detail || 'Failed to delete folder';
            addToast(errorMsg, 'error');
        }
    };

    const handleCreateNoteInFolder = () => {
        if (onCreateNote) onCreateNote(selectedFolder);
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
            return newSet;
        });
    };

    const startEditing = (item, type) => {
        setEditingId(`${type}-${item._id || item.id}`);
        setEditingName(type === 'folder' ? item.name : item.title);
        setContextMenu(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const saveEditing = async (item, type) => {
        if (!editingName.trim()) return cancelEditing();
        try {
            if (type === 'folder') {
                await foldersAPI.updateFolder(item._id || item.id, { name: editingName }, accessToken);
                setFolders((prev) =>
                    prev.map((f) => ((f._id || f.id) === (item._id || item.id) ? { ...f, name: editingName } : f))
                );
            } else if (type === 'note' && onUpdateNote) {
                await onUpdateNote(item._id, { title: editingName });
            }
            cancelEditing();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to update name';
            addToast(errorMsg, 'error');
            // Don't cancel editing on error - let user try again
        }
    };

    // Share handler for notes and folders
    const handleShare = (item, type = 'note') => {
        setItemToShare(item);
        setShareItemType(type);
        setShareModalOpen(true);
    };

    const handleContextMenu = (e, item, type) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, item, type });
    };

    // Drag & Drop helpers (simplified)
    const onDragStart = (e, item, itemType) => {
        setDraggedItem({ item, type: itemType });
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };
    const onDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedItem(null);
        setDragOverItem(null);
    };
    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const onDragEnter = (item, type) => setDragOverItem({ item, type });
    const onDragLeave = () => setDragOverItem(null);
    const onDrop = async (e, targetFolder) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem) return;
        const { item, type } = draggedItem;
        const targetFolderId = targetFolder ? targetFolder._id || targetFolder.id : null;
        // Prevent dropping folder into itself
        if (type === 'folder' && targetFolderId === (item._id || item.id)) {
            setDraggedItem(null);
            return;
        }
        try {
            if (type === 'note' && onUpdateNote) {
                await onUpdateNote(item._id, { folder_id: targetFolderId });
            } else if (type === 'folder') {
                await foldersAPI.updateFolder(item._id || item.id, { parent_id: targetFolderId }, accessToken);
                const response = await foldersAPI.getAllFolders(accessToken);
                setFolders(response.data);
                if (targetFolderId) setExpandedFolders((prev) => new Set([...prev, targetFolderId]));
            }
        } catch (err) {
            console.error('Error moving item:', err);
        }
        setDraggedItem(null);
    };

    // Build folder tree for rendering
    const buildFolderTree = (foldersToUse) => {
        const map = {};
        const roots = [];
        foldersToUse.forEach((f) => {
            const id = f._id || f.id;
            map[id] = { ...f, children: [] };
        });
        foldersToUse.forEach((f) => {
            const id = f._id || f.id;
            if (f.parent_id && map[f.parent_id]) {
                map[f.parent_id].children.push(map[id]);
            } else {
                roots.push(map[id]);
            }
        });
        return roots;
    };

    // Separate owned and shared folders
    const ownedFolders = folders.filter(f => !f.is_shared);
    const sharedFolders = folders.filter(f => f.is_shared);

    const ownedFolderTree = buildFolderTree(ownedFolders);
    const sharedFolderTree = buildFolderTree(sharedFolders);

    const getNotesForFolder = (folderId) => notes.filter((n) => n.folder_id === folderId);
    const rootNotes = getNotesForFolder(null);

    // Compute existing names for duplicate folder validation
    const currentParentId = selectedFolder ? selectedFolder._id || selectedFolder.id : null;
    const existingNames = folders
        .filter((f) => (currentParentId ? f.parent_id === currentParentId : !f.parent_id))
        .map((f) => f.name);

    return (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    📔 {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'My'} notes
                </h1>
                <button onClick={onOpenSettings} className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <FiSettings className="w-4 h-4" />
                </button>
            </div>
            {/* New Note & Folder Buttons */}
            <div className="p-4 space-y-2">
                <button
                    onClick={handleCreateNoteInFolder}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg shadow-md text-sm font-medium"
                >
                    <FiPlus className="w-4 h-4" />
                    <span>{selectedFolder ? 'New Note in Folder' : 'New Note'}</span>
                </button>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-lg shadow-md text-sm font-medium"
                >
                    <FiFolder className="w-4 h-4" />
                    <span>{selectedFolder ? 'New Subfolder' : 'New Folder'}</span>
                </button>
            </div>
            {/* Folder & Note Tree */}
            <div
                className="flex-1 overflow-y-auto p-2"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, null)}
                onClick={(e) => {
                    const target = e.target;
                    const empty = target.classList.contains('p-2') || target === e.currentTarget;
                    if (empty) setSelectedFolder(null);
                }}
            >
                {/* My Folders Section */}
                {ownedFolderTree.length > 0 && (
                    <div>
                        <h2 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">My Folders</h2>
                        {ownedFolderTree.map((folder) => (
                            <FolderNode
                                key={folder._id || folder.id}
                                folder={folder}
                                level={0}
                                expandedFolders={expandedFolders}
                                selectedFolder={selectedFolder}
                                editingId={editingId}
                                editingName={editingName}
                                dragOverItem={dragOverItem}
                                setEditingName={setEditingName}
                                editInputRef={editInputRef}
                                notes={notes}
                                selectedNote={selectedNote}
                                onToggle={toggleFolder}
                                onSelect={setSelectedFolder}
                                onSelectNote={onSelectNote}
                                onContextMenu={handleContextMenu}
                                onSave={saveEditing}
                                onCancel={cancelEditing}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                                onDragOver={onDragOver}
                                onDragEnter={onDragEnter}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onShareNote={handleShare}
                                handleShare={handleShare}
                                startEditing={startEditing}
                                openDeleteModal={openDeleteModal}
                                setNoteToDelete={setNoteToDelete}
                                setDeleteNoteModalOpen={setDeleteNoteModalOpen}
                                authUser={user}
                            />
                        ))}
                    </div>
                )}

                {/* Shared Folders Section */}
                {sharedFolderTree.length > 0 && (
                    <div className="mt-4">
                        <h2 className="px-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1 flex items-center gap-1">
                            <FiShare2 className="w-3 h-3" />
                            Shared Folders ({sharedFolderTree.length})
                        </h2>
                        {sharedFolderTree.map((folder) => (
                            <FolderNode
                                key={folder._id || folder.id}
                                folder={folder}
                                level={0}
                                expandedFolders={expandedFolders}
                                selectedFolder={selectedFolder}
                                editingId={editingId}
                                editingName={editingName}
                                dragOverItem={dragOverItem}
                                setEditingName={setEditingName}
                                editInputRef={editInputRef}
                                notes={notes}
                                selectedNote={selectedNote}
                                onToggle={toggleFolder}
                                onSelect={setSelectedFolder}
                                onSelectNote={onSelectNote}
                                onContextMenu={handleContextMenu}
                                onSave={saveEditing}
                                onCancel={cancelEditing}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                                onDragOver={onDragOver}
                                onDragEnter={onDragEnter}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onShareNote={handleShare}
                                handleShare={handleShare}
                                startEditing={startEditing}
                                openDeleteModal={openDeleteModal}
                                setNoteToDelete={setNoteToDelete}
                                setDeleteNoteModalOpen={setDeleteNoteModalOpen}
                                authUser={user}
                            />
                        ))}
                    </div>
                )}
                {/* Root notes - separate owned and shared */}
                {(() => {
                    const myRootNotes = rootNotes.filter(n => !n.is_shared);
                    // Only show shared notes that are NOT in folders (to avoid duplication)
                    const sharedNotes = notes.filter(n => n.is_shared && !n.folder_id);

                    return (
                        <>
                            {/* My Notes Section */}
                            <div className="mt-4">
                                <h2 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">My Notes</h2>
                                {myRootNotes.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">No notes yet. Create one!</div>
                                ) : (
                                    <div className="space-y-1">
                                        {myRootNotes.map((note) => (
                                            <NoteItem
                                                key={note._id}
                                                note={note}
                                                level={0}
                                                selectedNote={selectedNote}
                                                editingId={editingId}
                                                editingName={editingName}
                                                setEditingName={setEditingName}
                                                editInputRef={editInputRef}
                                                onSelect={onSelectNote}
                                                onContextMenu={handleContextMenu}
                                                onSave={saveEditing}
                                                onCancel={cancelEditing}
                                                onDragStart={onDragStart}
                                                onDragEnd={onDragEnd}
                                                onShare={handleShare}
                                                startEditing={startEditing}
                                                setNoteToDelete={setNoteToDelete}
                                                setDeleteNoteModalOpen={setDeleteNoteModalOpen}
                                                authUser={user}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Shared with me Section */}
                            {sharedNotes.length > 0 && (
                                <div className="mt-4">
                                    <h2 className="px-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1 flex items-center gap-1">
                                        <FiShare2 className="w-3 h-3" />
                                        Shared with me ({sharedNotes.length})
                                    </h2>
                                    <div className="space-y-1">
                                        {sharedNotes.map((note) => (
                                            <NoteItem
                                                key={note._id}
                                                note={note}
                                                level={0}
                                                selectedNote={selectedNote}
                                                editingId={editingId}
                                                editingName={editingName}
                                                setEditingName={setEditingName}
                                                editInputRef={editInputRef}
                                                onSelect={onSelectNote}
                                                onContextMenu={handleContextMenu}
                                                onSave={saveEditing}
                                                onCancel={cancelEditing}
                                                onDragStart={onDragStart}
                                                onDragEnd={onDragEnd}
                                                onShare={handleShare}
                                                startEditing={startEditing}
                                                setNoteToDelete={setNoteToDelete}
                                                setDeleteNoteModalOpen={setDeleteNoteModalOpen}
                                                authUser={user}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
            {/* Footer – User Profile, Theme & Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {/* User Profile */}
                <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {user?.picture ? (
                        <img
                            src={user.picture}
                            alt={user.full_name || user.email}
                            className="w-10 h-10 rounded-full border-2 border-indigo-500"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                            {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                        </p>
                    </div>
                </div>

                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                >
                    {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                >
                    <FiLogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </div>
            {/* Modals */}
            {isModalOpen && (
                <FolderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    existingNames={existingNames}
                    onSubmit={(name) => {
                        handleCreateFolder(name);
                        setIsModalOpen(false);
                    }}
                />
            )}
            {deleteModalOpen && (
                <DeleteFolderModal
                    isOpen={deleteModalOpen}
                    folderName={folderToDelete?.name || ''}
                    folderId={folderToDelete?._id || folderToDelete?.id}
                    parentFolder={
                        folderToDelete?.parent_id
                            ? folders.find((f) => (f._id || f.id) === folderToDelete.parent_id)
                            : null
                    }
                    hasChildren={
                        folderToDelete &&
                        (folders.some((f) => f.parent_id === (folderToDelete._id || folderToDelete.id)) ||
                            notes.some((n) => n.folder_id === (folderToDelete._id || folderToDelete.id)))
                    }
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setFolderToDelete(null);
                    }}
                    onConfirm={handleDeleteFolder}
                />
            )}
            {deleteNoteModalOpen && (
                <DeleteNoteModal
                    isOpen={deleteNoteModalOpen}
                    noteTitle={noteToDelete?.title || 'Untitled'}
                    onClose={() => {
                        setDeleteNoteModalOpen(false);
                        setNoteToDelete(null);
                    }}
                    onConfirm={async () => {
                        await onDeleteNote(noteToDelete._id);
                        setDeleteNoteModalOpen(false);
                        setNoteToDelete(null);
                    }}
                />
            )}
            {/* Share Modal */}
            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => {
                    setShareModalOpen(false);
                    setItemToShare(null);
                }}
                item={itemToShare}
                itemType={shareItemType}
            />
        </div>
    );
};

// Recursive folder node component
const FolderNode = ({
    folder,
    level,
    expandedFolders,
    selectedFolder,
    editingId,
    editingName,
    dragOverItem,
    setEditingName,
    editInputRef,
    notes,
    selectedNote,
    onToggle,
    onSelect,
    onSelectNote,
    onContextMenu,
    onSave,
    onCancel,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onShareNote,
    handleShare,
    startEditing,
    openDeleteModal,
    setNoteToDelete,
    setDeleteNoteModalOpen,
    authUser // Current logged-in user
}) => {
    const folderId = folder._id || folder.id;
    const isExpanded = expandedFolders.has(folderId);
    const isEditing = editingId === `folder-${folderId}`;
    const isSelected = (selectedFolder?._id || selectedFolder?.id) === folderId;
    const folderNotes = notes.filter((n) => n.folder_id === folderId);
    const isDragOver = dragOverItem?.type === 'folder' && (dragOverItem?.item?._id || dragOverItem?.item?.id) === folderId;

    return (
        <div>
            <div
                draggable={!isEditing}
                onDragStart={(e) => onDragStart(e, folder, 'folder')}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragEnter={() => onDragEnter(folder, 'folder')}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, folder)}
                onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition-colors group ${isSelected
                    ? 'bg-indigo-100 dark:bg-indigo-900/30'
                    : isDragOver
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => {
                    onSelect(folder);
                    onToggle(folderId);
                }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(folderId);
                    }}
                    className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                >
                    {isExpanded ? <FiChevronDown className="w-3 h-3" /> : <FiChevronRight className="w-3 h-3" />}
                </button>
                {isEditing ? (
                    <input
                        ref={editInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSave(folder, 'folder');
                            if (e.key === 'Escape') onCancel();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-600 border border-indigo-500 rounded outline-none"
                    />
                ) : (
                    <span className={`flex-1 ${isSelected ? 'font-medium' : ''}`}>{folder.name}</span>
                )}
                {/* Actions */}
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <button onClick={() => onSave(folder, 'folder')} className="p-1 text-green-600">
                            <FiCheck />
                        </button>
                        <button onClick={onCancel} className="p-1 text-red-600">
                            <FiX />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Only show edit/delete/share/add if user owns the folder (or if we can't determine ownership) */}
                        {(!folder.user_id || !authUser || folder.user_id === (authUser.id || authUser._id)) && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); startEditing(folder, 'folder'); }} className="p-1 text-gray-500 hover:text-indigo-600">
                                    <FiEdit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleShare(folder, 'folder'); }} className="p-1 text-gray-500 hover:text-purple-600">
                                    <FiShare2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); openDeleteModal(folder); }} className="p-1 text-gray-500 hover:text-red-600">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onSelect(folder); }} className="p-1 text-gray-500 hover:text-green-600">
                                    <FiPlus className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            {isExpanded && (
                <div className="ml-4">
                    {/* Subfolders */}
                    {folder.children && folder.children.map((sub) => (
                        <FolderNode
                            key={sub._id || sub.id}
                            folder={sub}
                            level={level + 1}
                            expandedFolders={expandedFolders}
                            selectedFolder={selectedFolder}
                            editingId={editingId}
                            editingName={editingName}
                            dragOverItem={dragOverItem}
                            setEditingName={setEditingName}
                            editInputRef={editInputRef}
                            notes={notes}
                            selectedNote={selectedNote}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            onSelectNote={onSelectNote}
                            onContextMenu={onContextMenu}
                            onSave={onSave}
                            onCancel={onCancel}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onDragOver={onDragOver}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onShareNote={onShareNote}
                            handleShare={handleShare}
                            startEditing={startEditing}
                            openDeleteModal={openDeleteModal}
                            setNoteToDelete={setNoteToDelete}
                            setDeleteNoteModalOpen={setDeleteNoteModalOpen}
                            authUser={authUser}
                        />
                    ))}
                    {/* Notes inside this folder */}
                    {folderNotes.map((note) => (
                        <NoteItem
                            key={note._id}
                            note={note}
                            level={level + 1}
                            selectedNote={selectedNote}
                            editingId={editingId}
                            editingName={editingName}
                            setEditingName={setEditingName}
                            editInputRef={editInputRef}
                            onSelect={onSelectNote}
                            onContextMenu={onContextMenu}
                            onSave={onSave}
                            onCancel={onCancel}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onShare={onShareNote}
                            startEditing={startEditing}
                            setNoteToDelete={setNoteToDelete}
                            setDeleteNoteModalOpen={setDeleteNoteModalOpen}
                            authUser={authUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Note item component with share button and shared indicator
const NoteItem = ({
    note,
    level,
    selectedNote,
    editingId,
    editingName,
    setEditingName,
    editInputRef,
    onSelect,
    onContextMenu,
    onSave,
    onCancel,
    onDragStart,
    onDragEnd,
    onShare,
    startEditing,
    setNoteToDelete,
    setDeleteNoteModalOpen,
    authUser  // Current logged-in user
}) => {
    const isEditing = editingId === `note-${note._id}`;
    const isSelected = selectedNote?._id === note._id;
    const isSharedWithMe = note.is_shared === true;
    const isOwner = !note.user_id || !authUser || note.user_id === (authUser.id || authUser._id);

    return (
        <div
            draggable={!isEditing && !isSharedWithMe}
            onDragStart={(e) => !isSharedWithMe && onDragStart(e, note, 'note')}
            onDragEnd={onDragEnd}
            onContextMenu={(e) => onContextMenu(e, note, 'note')}
            onClick={() => !isEditing && onSelect(note)}
            className={`flex items-center py-1.5 px-2 cursor-pointer group rounded-md transition-colors ${isSelected
                ? isSharedWithMe
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'bg-gray-200 dark:bg-gray-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            style={{ paddingLeft: `${level * 12 + 24}px` }}
        >
            {/* Icon - different for shared notes */}
            {isSharedWithMe ? (
                <div className="relative mr-2">
                    <FiFileText className="w-4 h-4 text-purple-500" />
                    <FiShare2 className="w-2.5 h-2.5 text-purple-600 absolute -bottom-0.5 -right-0.5" />
                </div>
            ) : (
                <FiFileText className="w-4 h-4 mr-2 text-gray-500" />
            )}

            {isEditing ? (
                <input
                    ref={editInputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onSave(note, 'note');
                        if (e.key === 'Escape') onCancel();
                    }}
                    className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-600 border border-indigo-500 rounded outline-none"
                />
            ) : (
                <div className="flex-1 min-w-0">
                    <span className={`block truncate ${isSharedWithMe ? 'text-purple-700 dark:text-purple-300' : ''}`}>
                        {note.title || 'Untitled'}
                    </span>
                    {isSharedWithMe && note.shared_by && (
                        <span className="text-[10px] text-purple-500 dark:text-purple-400 truncate block">
                            Shared by {note.shared_by_name || note.shared_by.split('@')[0]}
                        </span>
                    )}
                </div>
            )}

            <div className="flex items-center gap-1 ml-2">
                {isEditing ? (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); onSave(note, 'note'); }} className="text-green-600">
                            <FiCheck />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="text-red-600">
                            <FiX />
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Only show edit/delete/share if user owns the note */}
                        {isOwner && !isSharedWithMe && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); startEditing(note, 'note'); }} className="text-gray-500 hover:text-indigo-600">
                                    <FiEdit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setNoteToDelete(note); setDeleteNoteModalOpen(true); }} className="text-gray-500 hover:text-red-600">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onShare(note); }} className="text-gray-500 hover:text-purple-600">
                                    <FiShare2 className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
