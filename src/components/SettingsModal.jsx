import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiTrash2, FiCheck, FiSettings, FiAlertCircle, FiMessageSquare } from 'react-icons/fi';
import { settingsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const SettingsModal = ({ isOpen, onClose }) => {
    const [providers, setProviders] = useState([]);
    const [defaultModel, setDefaultModel] = useState(null);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState(null);
    const { addToast } = useToast();
    const { accessToken } = useAuth();

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await settingsAPI.getSettings(accessToken);
            if (response.data) {
                if (response.data.providers) {
                    setProviders(response.data.providers);
                }
                if (response.data.default_model) {
                    setDefaultModel(response.data.default_model);
                } else if (response.data.providers && response.data.providers.length > 0) {
                    // Fallback: use the first active provider or first provider as default
                    const active = response.data.providers.find(p => p.is_active);
                    setDefaultModel(active ? active.name : response.data.providers[0].name);
                }
                if (response.data.system_prompt) {
                    setSystemPrompt(response.data.system_prompt);
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            addToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validate
        const invalidProvider = providers.find(p => !p.api_key.trim() || !p.name.trim());
        if (invalidProvider) {
            addToast('All providers must have a Name and API Key', 'error');
            return;
        }

        setSaving(true);
        try {
            await settingsAPI.updateSettings({
                providers,
                default_model: defaultModel,
                system_prompt: systemPrompt
            }, accessToken);
            addToast('Settings saved successfully', 'success');
            onClose();
        } catch (error) {
            console.error('Error saving settings:', error);
            addToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addProvider = () => {
        setProviders([
            ...providers,
            {
                name: `Provider ${providers.length + 1}`,
                provider: 'openrouter',
                api_key: '',
                model: 'openai/gpt-4o-mini',
                is_active: providers.length === 0
            }
        ]);
    };

    const handleDeleteClick = (index) => {
        setProviderToDelete(index);
    };

    const confirmDelete = async () => {
        if (providerToDelete !== null) {
            const newProviders = providers.filter((_, i) => i !== providerToDelete);
            // If we removed the active provider, make the first one active
            if (providers[providerToDelete].is_active && newProviders.length > 0) {
                newProviders[0].is_active = true;
            }
            setProviders(newProviders);
            setProviderToDelete(null);

            // Auto-save the changes to backend
            try {
                await settingsAPI.updateSettings({ providers: newProviders }, accessToken);
                addToast('Provider deleted successfully', 'success');
            } catch (error) {
                console.error('Error saving after deletion:', error);
                addToast('Provider removed from list, but failed to save. Please click Save Settings.', 'error');
            }
        }
    };

    const updateProvider = (index, field, value) => {
        const newProviders = [...providers];
        newProviders[index] = { ...newProviders[index], [field]: value };
        setProviders(newProviders);
    };

    const toggleActiveProvider = (index) => {
        const newProviders = [...providers];
        newProviders[index] = { ...newProviders[index], is_active: !newProviders[index].is_active };
        setProviders(newProviders);
    };

    const handleSetDefault = (name) => {
        setDefaultModel(name);
    };

    const isValid = providers.length === 0 || providers.every(p => p.api_key.trim().length > 0 && p.name.trim().length > 0);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage LLM providers and API keys</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Global System Prompt Section */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                        <FiMessageSquare className="w-4 h-4" />
                                        Global System Prompt
                                    </h3>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                        This prompt applies to all AI providers unless overridden at the provider level.
                                    </p>
                                    <textarea
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        placeholder="You are a helpful AI assistant. Be concise and accurate..."
                                        rows={4}
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                                    />
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                        💡 Tip: Define the AI's role, tone, and behavior here. Provider-specific prompts will override this.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">LLM Providers</h3>
                                    <button
                                        onClick={addProvider}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        Add Provider
                                    </button>
                                </div>

                                {providers.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                        <p className="text-gray-500 dark:text-gray-400 mb-2">No providers configured</p>
                                        <button
                                            onClick={addProvider}
                                            className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline"
                                        >
                                            Add your first LLM provider
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {providers.map((provider, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-xl border transition-all ${provider.is_active
                                                    ? 'bg-white dark:bg-gray-800 border-purple-500 ring-1 ring-purple-500 shadow-sm'
                                                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="pt-1 flex flex-col gap-2 items-center">
                                                        {/* Active Toggle */}
                                                        <button
                                                            onClick={() => toggleActiveProvider(index)}
                                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${provider.is_active
                                                                ? 'border-purple-500 bg-purple-500 text-white'
                                                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                                                                }`}
                                                            title={provider.is_active ? "Enabled" : "Disabled"}
                                                        >
                                                            {provider.is_active && <FiCheck className="w-3 h-3" />}
                                                        </button>

                                                        {/* Default Radio */}
                                                        <button
                                                            onClick={() => handleSetDefault(provider.name)}
                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${defaultModel === provider.name
                                                                ? 'border-blue-500 bg-blue-500'
                                                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                                                }`}
                                                            title="Set as Default"
                                                        >
                                                            {defaultModel === provider.name && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </button>
                                                    </div>

                                                    <div className="flex-1 space-y-4">
                                                        {/* Name Field */}
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                                Name <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={provider.name || ''}
                                                                onChange={(e) => updateProvider(index, 'name', e.target.value)}
                                                                placeholder="My AI Provider"
                                                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                            />
                                                        </div>

                                                        {/* API Key Field */}
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                                API Key <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="password"
                                                                    value={provider.api_key}
                                                                    onChange={(e) => updateProvider(index, 'api_key', e.target.value)}
                                                                    placeholder="sk-..."
                                                                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border rounded-lg outline-none transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-mono ${!provider.api_key.trim() && providers.length > 0
                                                                        ? 'border-red-300 dark:border-red-800 focus:border-red-500'
                                                                        : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400'
                                                                        }`}
                                                                />
                                                                {!provider.api_key.trim() && (
                                                                    <FiAlertCircle className="absolute right-3 top-2.5 w-4 h-4 text-red-500" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                                    Provider
                                                                </label>
                                                                <select
                                                                    value={provider.provider}
                                                                    onChange={(e) => updateProvider(index, 'provider', e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors text-gray-900 dark:text-gray-100"
                                                                >
                                                                    <option value="openrouter">OpenRouter</option>
                                                                    <option value="openai">OpenAI</option>
                                                                    <option value="anthropic">Anthropic</option>
                                                                    <option value="gemini">Google Gemini</option>
                                                                    <option value="mistral">Mistral AI</option>
                                                                    <option value="groq">Groq</option>
                                                                    <option value="local">Local (Ollama/LM Studio)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                                    Model Name (Optional)
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={provider.model || ''}
                                                                    onChange={(e) => updateProvider(index, 'model', e.target.value)}
                                                                    placeholder="e.g. gpt-4-turbo"
                                                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Use Global System Prompt Option */}
                                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={provider.use_global_prompt || false}
                                                                    onChange={(e) => updateProvider(index, 'use_global_prompt', e.target.checked)}
                                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    Use Global System Prompt
                                                                </span>
                                                            </label>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                                                                If checked, this provider will use the global prompt instead of its own
                                                            </p>
                                                        </div>

                                                        {/* System Prompt Field */}
                                                        {!provider.use_global_prompt && (
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                                    System Prompt (Optional)
                                                                </label>
                                                                <textarea
                                                                    value={provider.system_prompt || ''}
                                                                    onChange={(e) => updateProvider(index, 'system_prompt', e.target.value)}
                                                                    placeholder="You are a helpful AI assistant..."
                                                                    rows={3}
                                                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                                                                />
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                                    Custom instructions for this AI model
                                                                </p>
                                                            </div>
                                                        )}

                                                        {defaultModel !== provider.name && (
                                                            <button
                                                                onClick={() => handleSetDefault(provider.name)}
                                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                            >
                                                                Set as Default
                                                            </button>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteClick(index)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Remove Provider"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !isValid}
                            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg transition-all ${saving || !isValid
                                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-lg'
                                }`}
                            title={!isValid ? "Please fill in all required fields" : "Save Settings"}
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-4 h-4" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {providerToDelete !== null && (
                <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 transform transition-all scale-100">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Remove Provider?
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to remove <strong>{providers[providerToDelete]?.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setProviderToDelete(null)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SettingsModal;
