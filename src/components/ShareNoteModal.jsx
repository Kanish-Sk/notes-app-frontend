import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUser, FiMail, FiShare2, FiFolder } from 'react-icons/fi';
import { usersAPI, notesAPI, foldersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const ShareModal = ({ isOpen, onClose, item, itemType }) => {
    const [email, setEmail] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const { accessToken } = useAuth();
    const { addToast } = useToast();
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setSearchResults([]);
        }
    }, [isOpen]);

    const handleSearch = (query) => {
        setEmail(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                const response = await usersAPI.searchUsers(query, accessToken);
                setSearchResults(response.data);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const handleShare = async (recipientEmail) => {
        if (!recipientEmail) return;

        try {
            setSharing(true);

            if (itemType === 'note') {
                await notesAPI.shareNote(item._id || item.id, { email: recipientEmail }, accessToken);
            } else if (itemType === 'folder') {
                await foldersAPI.shareFolder(item._id || item.id, { email: recipientEmail }, accessToken);
            }

            const itemName = itemType === 'note' ? (item?.title || 'Untitled') : (item?.name || 'Untitled');
            addToast(`${itemType === 'note' ? 'Note' : 'Folder'} shared with ${recipientEmail}`, 'success');
            onClose();
        } catch (error) {
            console.error('Error sharing:', error);
            const errorMsg = error.response?.data?.detail || `Failed to share ${itemType}`;
            addToast(errorMsg, 'error');
        } finally {
            setSharing(false);
        }
    };

    if (!isOpen || !item) return null;

    const itemTitle = itemType === 'note' ? (item?.title || 'Untitled') : (item?.name || 'Untitled');
    const itemIcon = itemType === 'note' ? 'Note' : 'Folder';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {itemType === 'note' ? <FiShare2 className="text-indigo-500" /> : <FiFolder className="text-green-500" />}
                        Share {itemIcon}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Share <span className="font-medium text-gray-900 dark:text-white">"{itemTitle}"</span> with others. They will receive read-only access.
                    </p>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiMail className="text-gray-400" />
                        </div>
                        <input
                            type="email"
                            placeholder="Enter email address..."
                            value={email}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Search Results / Invite Option */}
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {searchResults.length > 0 ? (
                            searchResults.map(user => (
                                <button
                                    key={user._id || user.id}
                                    onClick={() => handleShare(user.email)}
                                    disabled={sharing}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-left group border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                                        {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {user.full_name || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 dark:text-indigo-400 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                                        Select
                                    </div>
                                </button>
                            ))
                        ) : email.trim() && !loading ? (
                            <button
                                onClick={() => handleShare(email)}
                                disabled={sharing}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-left group border border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                    <FiMail />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Invite <span className="text-indigo-600 dark:text-indigo-400">{email}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Send an invitation email
                                    </p>
                                </div>
                                <FiShare2 className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                            </button>
                        ) : null}

                        {loading && (
                            <div className="text-center py-4 text-gray-400 text-sm">
                                Searching...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
