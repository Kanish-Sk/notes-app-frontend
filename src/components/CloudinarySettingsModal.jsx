import React, { useState } from 'react';
import { FiX, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

const CloudinarySettingsModal = ({ isOpen, onClose, onSuccess }) => {
    const { user, accessToken, updateUser } = useAuth();
    const { addToast } = useToast();

    const [cloudName, setCloudName] = useState(user?.cloudinary_cloud_name || '');
    const [apiKey, setApiKey] = useState(user?.cloudinary_api_key || '');
    const [apiSecret, setApiSecret] = useState(user?.cloudinary_api_secret || '');
    const [showSecret, setShowSecret] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testPassed, setTestPassed] = useState(false);

    if (!isOpen) return null;

    const validateCloudName = (value) => {
        // Only allow lowercase letters, numbers, hyphens, and underscores
        return /^[a-z0-9_-]+$/.test(value);
    };

    const handleTest = async () => {
        if (!cloudName.trim() || !apiKey.trim() || !apiSecret.trim()) {
            addToast('Please fill in all fields', 'error');
            setTestPassed(false);
            return;
        }

        // Validate cloud name format
        if (!validateCloudName(cloudName.trim())) {
            setTestResult({
                success: false,
                message: 'Cloud name can only contain lowercase letters, numbers, hyphens, and underscores (no spaces)'
            });
            addToast('Invalid cloud name format', 'error');
            setTestPassed(false);
            return;
        }

        setTesting(true);
        setTestResult(null);
        setTestPassed(false);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            // Call backend to test credentials (no CORS issues!)
            const response = await axios.post(
                `${API_URL}/api/test-cloudinary`,
                {
                    cloudinary_cloud_name: cloudName.trim(),
                    cloudinary_api_key: apiKey.trim(),
                    cloudinary_api_secret: apiSecret.trim()
                }
            );

            setTestResult(response.data);

            if (response.data.success) {
                setTestPassed(true);
                addToast('Credentials verified successfully! You can now save.', 'success');
            } else {
                setTestPassed(false);
                addToast(response.data.message || 'Test failed', 'error');
            }
        } catch (error) {
            console.error('Cloudinary test error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to test credentials';
            setTestResult({ success: false, message: errorMsg });
            setTestPassed(false);
            addToast(errorMsg, 'error');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!testPassed) {
            addToast('Please test and verify your credentials first', 'warning');
            return;
        }

        if (!cloudName.trim() || !apiKey.trim() || !apiSecret.trim()) {
            addToast('Please fill in all fields', 'error');
            return;
        }

        // Validate cloud name format
        if (!validateCloudName(cloudName.trim())) {
            addToast('Invalid cloud name format. No spaces or special characters allowed.', 'error');
            return;
        }

        setSaving(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await axios.patch(
                `${API_URL}/api/users/me/cloudinary`,
                {
                    cloudinary_cloud_name: cloudName.trim(),
                    cloudinary_api_key: apiKey.trim(),
                    cloudinary_api_secret: apiSecret.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            // Update user context with new cloudinary settings
            updateUser({
                ...user,
                cloudinary_cloud_name: cloudName.trim(),
                cloudinary_api_key: apiKey.trim(),
                cloudinary_api_secret: apiSecret.trim()
            });

            addToast('Cloudinary settings saved successfully!', 'success');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Save cloudinary settings error:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to save Cloudinary settings';
            addToast(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Cloudinary Settings
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Configure your Cloudinary account to upload images
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                            📸 How to get your Cloudinary credentials:
                        </h3>
                        <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                            <li>Go to <a href="https://cloudinary.com/users/register/free" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">cloudinary.com</a> and create a free account</li>
                            <li>From your dashboard, copy the <strong>Cloud Name</strong>, <strong>API Key</strong>, and <strong>API Secret</strong></li>
                            <li>Paste them below and click "Test Connection" (optional but recommended)</li>
                            <li>Click "Save Settings" to start uploading images!</li>
                        </ol>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cloud Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={cloudName}
                                onChange={(e) => setCloudName(e.target.value)}
                                placeholder="your-cloud-name"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API Key <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="123456789012345"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API Secret <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showSecret ? "text" : "password"}
                                    value={apiSecret}
                                    onChange={(e) => setApiSecret(e.target.value)}
                                    placeholder="••••••••••••••••••••"
                                    className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    title={showSecret ? "Hide API Secret" : "Show API Secret"}
                                >
                                    {showSecret ? (
                                        <FiEyeOff className="w-5 h-5" />
                                    ) : (
                                        <FiEye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`p-4 rounded-lg border ${testResult.success
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                {testResult.success ? (
                                    <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                ) : (
                                    <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                )}
                                <p className={`text-sm font-medium ${testResult.success
                                    ? 'text-green-800 dark:text-green-300'
                                    : 'text-red-800 dark:text-red-300'
                                    }`}>
                                    {testResult.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleTest}
                        disabled={testing || !cloudName.trim() || !apiKey.trim() || !apiSecret.trim()}
                        className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {testing ? 'Testing...' : 'Test Connection'}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !testPassed || !cloudName.trim() || !apiKey.trim() || !apiSecret.trim()}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            title={!testPassed ? "Please test and verify credentials first" : "Save Cloudinary settings"}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudinarySettingsModal;
