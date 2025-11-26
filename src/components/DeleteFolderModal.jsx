import React, { useState } from 'react';
import { FiX, FiAlertTriangle, FiFolder, FiFileText } from 'react-icons/fi';

const DeleteFolderModal = ({ isOpen, folderName, folderId, parentFolder, hasChildren, onClose, onConfirm }) => {
    const [moveChildrenToRoot, setMoveChildrenToRoot] = useState(true);

    if (!isOpen) return null;

    // Determine destination message
    const getDestinationMessage = () => {
        if (parentFolder) {
            return `Child folders and notes will be moved to "${parentFolder.name}"`;
        } else {
            return 'Child folders and notes will be moved to Notes Section (root)';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(moveChildrenToRoot ? true : false);
        setMoveChildrenToRoot(true);
    };

    const handleClose = () => {
        setMoveChildrenToRoot(true);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <FiAlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Delete Folder
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                        <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="p-4 space-y-4">
                        <p className="text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">"{folderName}"</span>?
                        </p>

                        {/* Show options only if folder has children */}
                        {hasChildren ? (
                            <div className="space-y-3">
                                {/* Option 1: Move to parent/root */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={moveChildrenToRoot}
                                            onChange={() => setMoveChildrenToRoot(true)}
                                            className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 focus:ring-2"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Move child items
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1.5">
                                                {parentFolder ? (
                                                    <>
                                                        <FiFolder className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                        <span>Will be moved to <span className="font-medium text-gray-700 dark:text-gray-300">"{parentFolder.name}"</span></span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiFileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                        <span>Will be moved to <span className="font-medium text-gray-700 dark:text-gray-300">Notes Section</span> (root level)</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {/* Option 2: Delete everything */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!moveChildrenToRoot}
                                            onChange={() => setMoveChildrenToRoot(false)}
                                            className="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 focus:ring-2"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Delete everything
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                All child folders and notes will be permanently deleted
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                {/* Warning when deleting all */}
                                {!moveChildrenToRoot && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                                        <p className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                                            <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span className="font-medium">
                                                Warning: All nested folders and notes will be permanently deleted. This action cannot be undone.
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* No children - just show warning */
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    This folder is empty and will be permanently deleted.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            {hasChildren && moveChildrenToRoot ? 'Delete Folder' : 'Delete Everything'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteFolderModal;
