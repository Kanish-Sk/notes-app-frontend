import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

const DeleteNoteModal = ({ isOpen, noteTitle, onClose, onConfirm }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <FiAlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Delete Note
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                        <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="p-4">
                        <p className="text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">"{noteTitle || 'Untitled'}"</span>?
                        </p>
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                                <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    This action cannot be undone. The note will be permanently deleted.
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Delete Note
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteNoteModal;
