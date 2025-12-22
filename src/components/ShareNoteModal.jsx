import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUser, FiMail, FiShare2, FiFolder, FiRefreshCw, FiTrash2, FiCheck, FiClock, FiUsers } from 'react-icons/fi';
import { usersAPI, notesAPI, foldersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';

const ShareModal = ({ isOpen, onClose, item, itemType, onSharesUpdated }) => {
    const [email, setEmail] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shares, setShares] = useState([]);
    const [loadingShares, setLoadingShares] = useState(false);
    const [resendingEmail, setResendingEmail] = useState(null);
    const [removingEmail, setRemovingEmail] = useState(null);
    const [activeTab, setActiveTab] = useState('share'); // 'share' or 'manage'
    const [confirmUnshare, setConfirmUnshare] = useState(null); // Email to confirm unsharing
    const { accessToken } = useAuth();
    const { addToast } = useToast();
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setSearchResults([]);
            setActiveTab('share');
        } else if (item) {
            // Load existing shares when modal opens
            loadShares();
        }
    }, [isOpen, item]);

    const loadShares = async () => {
        if (!item) return;

        try {
            setLoadingShares(true);
            const response = itemType === 'note'
                ? await notesAPI.getShares(item._id || item.id, accessToken)
                : await foldersAPI.getShares(item._id || item.id, accessToken);
            setShares(response.data.shares || []);
        } catch (error) {
            console.error('Error loading shares:', error);
            // If 403, user is not owner - that's ok, just don't show manage tab
        } finally {
            setLoadingShares(false);
        }
    };

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

            // Reload shares
            await loadShares();
            setEmail('');
            setSearchResults([]);

            // Notify parent
            if (onSharesUpdated) onSharesUpdated();
        } catch (error) {
            console.error('Error sharing:', error);
            const errorMsg = error.response?.data?.detail || `Failed to share ${itemType}`;
            addToast(errorMsg, 'error');
        } finally {
            setSharing(false);
        }
    };

    const handleResend = async (recipientEmail) => {
        try {
            setResendingEmail(recipientEmail);
            if (itemType === 'note') {
                await notesAPI.resendShareNotification(item._id || item.id, recipientEmail, accessToken);
            } else {
                await foldersAPI.resendShareNotification(item._id || item.id, recipientEmail, accessToken);
            }
            addToast(`Notification resent to ${recipientEmail}`, 'success');
        } catch (error) {
            console.error('Error resending:', error);
            addToast('Failed to resend notification', 'error');
        } finally {
            setResendingEmail(null);
        }
    };

    const handleUnshare = async (recipientEmail) => {
        // Show confirmation modal
        setConfirmUnshare(recipientEmail);
    };

    const confirmUnshareAction = async () => {
        const recipientEmail = confirmUnshare;
        setConfirmUnshare(null);

        if (!recipientEmail) return;

        try {
            setRemovingEmail(recipientEmail);
            if (itemType === 'note') {
                await notesAPI.unshareNote(item._id || item.id, recipientEmail, accessToken);
            } else {
                await foldersAPI.unshareFolder(item._id || item.id, recipientEmail, accessToken);
            }
            addToast(`Removed access for ${recipientEmail}`, 'success');

            // Remove from local state
            const updatedShares = shares.filter(s => s.email !== recipientEmail);
            setShares(updatedShares);

            // If no shares left, switch to Share tab
            if (updatedShares.length === 0) {
                setActiveTab('share');
            }

            // Notify parent
            if (onSharesUpdated) onSharesUpdated();
        } catch (error) {
            console.error('Error unsharing:', error);
            addToast('Failed to remove access', 'error');
        } finally {
            setRemovingEmail(null);
        }
    };

    if (!isOpen || !item) return null;

    const itemTitle = itemType === 'note' ? (item?.title || 'Untitled') : (item?.name || 'Untitled');
    const itemIcon = itemType === 'note' ? 'Note' : 'Folder';
    const isOwner = item?.user_id === item?.current_user_id || !item?.is_shared;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
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

                {/* Tabs */}
                {isOwner && shares.length > 0 && (
                    <div className="flex border-b border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('share')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'share'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <FiShare2 className="inline mr-2" />
                            Share
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'manage'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <FiUsers className="inline mr-2" />
                            Manage ({shares.length})
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Share <span className="font-medium text-gray-900 dark:text-white">"{itemTitle}"</span> with others.
                    </p>

                    {activeTab === 'share' && (
                        <>
                            {/* Email Input */}
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
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm shadow-sm">
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
                                                Share
                                            </div>
                                        </button>
                                    ))
                                ) : email.trim() && !loading ? (
                                    <button
                                        onClick={() => handleShare(email)}
                                        disabled={sharing}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-left group border border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                            <FiMail className="w-5 h-5" />
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

                            {/* Quick view of existing shares */}
                            {shares.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                        <FiUsers className="w-3 h-3" />
                                        Shared with {shares.length} {shares.length === 1 ? 'person' : 'people'}
                                    </p>
                                    <div className="flex -space-x-2">
                                        {shares.slice(0, 5).map((share, idx) => (
                                            <div
                                                key={share.email}
                                                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                                                title={share.email}
                                            >
                                                {share.full_name?.charAt(0).toUpperCase() || share.email.charAt(0).toUpperCase()}
                                            </div>
                                        ))}
                                        {shares.length > 5 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium border-2 border-white dark:border-gray-800">
                                                +{shares.length - 5}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'manage' && (
                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                            {loadingShares ? (
                                <div className="text-center py-8 text-gray-400">
                                    <FiRefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                                    Loading...
                                </div>
                            ) : shares.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No one has access yet</p>
                                </div>
                            ) : (
                                shares.map(share => (
                                    <div
                                        key={share.email}
                                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm overflow-hidden">
                                            {share.picture ? (
                                                <img src={share.picture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                share.full_name?.charAt(0).toUpperCase() || share.email.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {share.full_name || share.email}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                                {share.has_account ? (
                                                    <>
                                                        <FiCheck className="w-3 h-3 text-green-500" />
                                                        Has account
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiClock className="w-3 h-3 text-yellow-500" />
                                                        Pending signup
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleResend(share.email)}
                                                disabled={resendingEmail === share.email}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                title="Resend notification"
                                            >
                                                <FiRefreshCw className={`w-4 h-4 ${resendingEmail === share.email ? 'animate-spin' : ''}`} />
                                            </button>
                                            <button
                                                onClick={() => handleUnshare(share.email)}
                                                disabled={removingEmail === share.email}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                title="Remove access"
                                            >
                                                <FiTrash2 className={`w-4 h-4 ${removingEmail === share.email ? 'animate-pulse' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                        Shared notes update in real-time when you make changes
                    </p>
                </div>
            </div>

            {/* Confirmation Modal for Unsharing */}
            <ConfirmationModal
                isOpen={!!confirmUnshare}
                title="Remove Access"
                message={
                    <>
                        Are you sure you want to remove access for <strong>{confirmUnshare}</strong>?
                    </>
                }
                warningMessage={
                    itemType === 'folder'
                        ? 'This will also remove access to all subfolders and notes inside.'
                        : 'This action cannot be undone.'
                }
                confirmText="Remove Access"
                confirmClass="bg-red-600 hover:bg-red-700"
                onClose={() => setConfirmUnshare(null)}
                onConfirm={confirmUnshareAction}
            />
        </div>
    );
};

export default ShareModal;
