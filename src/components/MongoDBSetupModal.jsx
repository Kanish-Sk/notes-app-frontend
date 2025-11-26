import React, { useState } from 'react';
import { FiX, FiDatabase, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { mongodbAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const MongoDBSetupModal = ({ isOpen, onClose, onSuccess, accessToken }) => {
    const [connectionString, setConnectionString] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleVerify = async () => {
        if (!connectionString.trim()) {
            setError('Please enter a connection string');
            return;
        }

        setVerifying(true);
        setError('');
        setVerified(false);

        try {
            const response = await mongodbAPI.verifyConnection(connectionString);
            if (response.data.success) {
                setVerified(true);
                addToast('Connection verified successfully!', 'success');
            } else {
                setError(response.data.message);
                addToast(response.data.message, 'error');
            }
        } catch (err) {
            const errorMsg = 'Failed to verify connection. Please check your connection string.';
            setError(errorMsg);
            addToast(errorMsg, 'error');
        } finally {
            setVerifying(false);
        }
    };

    const handleSave = async () => {
        if (!verified) {
            setError('Please verify your connection first');
            return;
        }

        setSaving(true);
        try {
            const response = await mongodbAPI.updateUserDatabase(connectionString, accessToken);
            // Pass updated user object to parent
            onSuccess(response.data.user);
        } catch (err) {
            addToast('Failed to save database configuration', 'error');
            setError('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FiDatabase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Setup Your Database
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Configure where your notes will be stored
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Info Box */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r">
                        <div className="flex gap-3">
                            <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900 dark:text-blue-100">
                                <p className="font-semibold mb-1">Why configure a database?</p>
                                <p className="text-blue-700 dark:text-blue-200">
                                    You can use your own MongoDB cluster to store your notes privately and securely.
                                    This gives you full control over your data. If you skip this step, we'll use a shared database.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Connection String Input */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                MongoDB Connection String
                            </label>
                            <div className="relative">
                                <FiDatabase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={connectionString}
                                    onChange={(e) => setConnectionString(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                    placeholder="mongodb+srv://user:password@cluster.mongodb.net/"
                                />
                                {verified && (
                                    <FiCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Get your connection string from{' '}
                                <a
                                    href="https://www.mongodb.com/cloud/atlas/register"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    MongoDB Atlas
                                </a>
                            </p>
                        </div>

                        {/* Verify Button */}
                        {connectionString && (
                            <button
                                onClick={handleVerify}
                                disabled={verifying || verified}
                                className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {verifying ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 dark:border-t-gray-300 rounded-full animate-spin" />
                                        Verifying...
                                    </>
                                ) : verified ? (
                                    <>
                                        <FiCheck className="w-5 h-5 text-green-500" />
                                        Verified
                                    </>
                                ) : (
                                    <>
                                        <FiDatabase className="w-5 h-5" />
                                        Verify Connection
                                    </>
                                )}
                            </button>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r flex items-start gap-2">
                                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {verified && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r flex items-start gap-2">
                                <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Connection verified! Your data will be stored in your own cluster.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* How to Get Connection String */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            How to get your connection string:
                        </h3>
                        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
                            <li>Create a free account on MongoDB Atlas</li>
                            <li>Create a new cluster (M0 free tier works great)</li>
                            <li>Go to "Database Access" and create a user</li>
                            <li>Go to "Network Access" and allow your IP</li>
                            <li>Click "Connect" → "Connect your application"</li>
                            <li>Copy the connection string</li>
                        </ol>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleSkip}
                        className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!verified || saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FiCheck className="w-5 h-5" />
                                Save & Continue
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MongoDBSetupModal;
