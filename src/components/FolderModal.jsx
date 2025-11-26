import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Simple modal for creating / renaming a folder.
 * Props:
 *   isOpen: boolean – whether the modal is visible
 *   onClose: () => void – called when user cancels or clicks backdrop
 *   onSubmit: (name: string) => void – called with the folder name when user confirms
 *   initialName?: string – optional pre‑filled name (for rename use‑case)
 */
const FolderModal = ({ isOpen, onClose, onSubmit, initialName = '', existingNames = [] }) => {
    const [name, setName] = useState(initialName);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = name.trim();

        if (trimmedName) {
            if (existingNames.includes(trimmedName)) {
                setError('A folder with this name already exists.');
                return;
            }

            onSubmit(trimmedName);
            setName('');
            setError('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 p-6 relative">
                <button
                    onClick={() => {
                        setError('');
                        onClose();
                    }}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Close"
                >
                    <FiX className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {initialName ? 'Rename Folder' : 'Create New Folder'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Folder name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError('');
                            }}
                            className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${error
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                            autoFocus
                        />
                        {error && (
                            <p className="mt-1 text-xs text-red-500">{error}</p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => {
                                setError('');
                                onClose();
                            }}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
                        >
                            {initialName ? 'Rename' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FolderModal;
