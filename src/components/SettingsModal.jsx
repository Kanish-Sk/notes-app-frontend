import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiTrash2, FiCheck, FiSettings, FiAlertCircle, FiMessageSquare, FiCheckCircle, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';
import { settingsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_SYSTEM_PROMPT = `✅ SYSTEM PROMPT — "Respond Like ChatGPT (Technical + Clear)"

You are an AI assistant that responds with:

✅ 1. Clear and Structured Explanations
Break answers into short sections and steps.
Use headings, bullet points, and examples.
Avoid long paragraphs.

✅ 2. Beginner-Friendly Technical Help
Explain concepts simply.
Provide step-by-step instructions.
Include code examples when helpful.

✅ 3. Accurate + Practical Guidance
Provide instructions that realistically work in real-world scenarios.
Avoid generic or vague answers.

✅ 4. Debugging Support
When the user reports an error:
Explain the cause clearly.
Provide exact fixes.
Show corrected code.

✅ 5. No Fluff
No motivational quotes.
No unnecessary chatting.
Only direct, useful information.

✅ 6. Smart Assumptions
If the user gives incomplete info:
Do not ask for clarification unless absolutely needed.
Make a reasonable assumption and continue the solution.

✅ 7. Examples and Templates
When useful:
Provide working templates.
Provide ready-to-copy code.
Provide correct configuration.

✅ 8. Formatting
Always use **Markdown** formatting in your responses.
Use headers (#, ##, ###), **bold**, *italic*, code blocks (\`\`\`), and bullet points.
Never use raw HTML tags like <p>, <strong>, <ul>, etc.

✅ 9. Tone
Friendly and professional.
Confident and reliable.
No slang.

🧠 Example Style
User: "How to fix Invalid Token Audience in Google Login?"
Assistant:
Explain the cause
Show the fix
Provide backend + frontend code
Provide URLs to configure
Use concise step-by-step format`;

const SettingsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('providers');
    const [providers, setProviders] = useState([]);
    const [expandedProvider, setExpandedProvider] = useState(null);
    const [defaultModel, setDefaultModel] = useState(null);
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState(null);
    const [testingProvider, setTestingProvider] = useState(null);
    const [testResults, setTestResults] = useState({});
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
                    const active = response.data.providers.find(p => p.is_active);
                    setDefaultModel(active ? active.name : response.data.providers[0].name);
                }
                if (response.data.system_prompt) {
                    setSystemPrompt(response.data.system_prompt);
                } else {
                    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            addToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleResetPrompt = () => {
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
        addToast('Global prompt reset to default', 'success');
    };

    const handleSave = async () => {
        // Validate required fields
        const invalidProvider = providers.find(p => !p.api_key.trim() || !p.name.trim() || !p.model?.trim());
        if (invalidProvider) {
            addToast('All providers must have a Name, API Key, and Model', 'error');
            return;
        }

        // Validate that all providers have been tested successfully
        const untestedProvider = providers.find((p, index) => !testResults[index]?.success);
        if (untestedProvider) {
            addToast('Please test all providers successfully before saving', 'error');
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
        // Find the highest provider number to generate a unique name
        const existingNumbers = providers
            .map(p => {
                const match = p.name.match(/Provider (\d+)/);
                return match ? parseInt(match[1]) : 0;
            })
            .filter(n => !isNaN(n));

        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

        setProviders([
            ...providers,
            {
                name: `Provider ${nextNumber}`,
                provider: 'openrouter',
                api_key: '',
                model: '',
                use_global_prompt: true,
                is_active: providers.length === 0,
                tested: false  // New providers start untested
            }
        ]);
        setExpandedProvider(providers.length);
    };

    const handleDeleteClick = (index) => {
        setProviderToDelete(index);
    };

    const confirmDelete = async () => {
        if (providerToDelete !== null) {
            const newProviders = providers.filter((_, i) => i !== providerToDelete);
            if (providers[providerToDelete].is_active && newProviders.length > 0) {
                newProviders[0].is_active = true;
            }
            setProviders(newProviders);
            setProviderToDelete(null);

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

        // If critical fields change (provider type, API key, or model), invalidate test status
        const criticalFields = ['provider', 'api_key', 'model'];
        if (criticalFields.includes(field)) {
            // Clear test status for this provider
            const providerId = newProviders[index].name || `provider-${index}`;
            setTestResults(prev => {
                const newResults = { ...prev };
                delete newResults[providerId];
                return newResults;
            });

            // Deactivate the provider until it's tested again
            newProviders[index].is_active = false;
            newProviders[index].tested = false; // Clear tested status

            // Show toast notification
            addToast('Please test the connection again after changing this field', 'info');
        }

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

    const handleTestConnection = async (index) => {
        const provider = providers[index];

        if (!provider.api_key || !provider.model) {
            addToast('Please enter API Key and Model before testing', 'error');
            return;
        }

        setTestingProvider(index);
        setTestResults(prev => ({ ...prev, [index]: null }));

        try {
            const response = await settingsAPI.testLLMConnection(
                provider.provider,
                provider.api_key,
                provider.model,
                accessToken
            );

            setTestResults(prev => ({
                ...prev,
                [index]: {
                    success: response.data.success,
                    message: response.data.message
                }
            }));

            if (response.data.success) {
                addToast(response.data.message, 'success');
                // Auto-activate provider and mark as tested on successful test
                const newProviders = [...providers];
                newProviders[index] = { ...newProviders[index], is_active: true, tested: true };
                setProviders(newProviders);

                // Set as default if no default is set yet
                if (!defaultModel) {
                    setDefaultModel(provider.name);
                }
            } else {
                addToast(response.data.message, 'error');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Connection test failed';
            setTestResults(prev => ({
                ...prev,
                [index]: {
                    success: false,
                    message: errorMessage
                }
            }));
            addToast(errorMessage, 'error');
        } finally {
            setTestingProvider(null);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <FiSettings className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Settings</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your LLM providers</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                        <button
                            onClick={() => setActiveTab('providers')}
                            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'providers'
                                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            AI Providers ({providers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('global')}
                            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'global'
                                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <FiMessageSquare className="inline w-4 h-4 mr-1" />
                            Global Prompt
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                            </div>
                        ) : (
                            <>
                                {/* Providers Tab */}
                                {activeTab === 'providers' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Add and configure your AI model providers
                                            </p>
                                            <button
                                                onClick={addProvider}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all shadow-md hover:shadow-lg"
                                            >
                                                <FiPlus className="w-4 h-4" />
                                                Add Provider
                                            </button>
                                        </div>

                                        {providers.length === 0 ? (
                                            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                                    <FiSettings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 mb-3 font-medium">No AI providers configured</p>
                                                <button
                                                    onClick={addProvider}
                                                    className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline"
                                                >
                                                    Add your first provider to get started →
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {providers.map((provider, index) => (
                                                    <div
                                                        key={index}
                                                        className={`rounded-xl border-2 transition-all ${provider.is_active
                                                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 shadow-md'
                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                                                            }`}
                                                    >
                                                        {/* Provider Header */}
                                                        <div className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    {/* Status Indicator */}
                                                                    <button
                                                                        onClick={() => toggleActiveProvider(index)}
                                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${provider.is_active
                                                                            ? 'bg-purple-500 text-white shadow-lg'
                                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                                            }`}
                                                                        title={provider.is_active ? 'Active' : 'Inactive'}
                                                                    >
                                                                        {provider.is_active && <FiCheck className="w-5 h-5" />}
                                                                    </button>

                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                                                {provider.name || `Provider ${index + 1}`}
                                                                            </h3>
                                                                            {defaultModel === provider.name && (
                                                                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                                                                    Default
                                                                                </span>
                                                                            )}
                                                                            {testResults[index]?.success && (
                                                                                <FiCheckCircle className="w-4 h-4 text-green-500" title="Verified" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                            {provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)} • {provider.model || 'No model'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {/* Test Button */}
                                                                    <button
                                                                        onClick={() => handleTestConnection(index)}
                                                                        disabled={testingProvider === index || !provider.api_key.trim() || !provider.model?.trim()}
                                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${provider.tested && testResults[index]?.success
                                                                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                                            : testResults[index]?.success === false
                                                                                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                                                : !provider.tested && provider.api_key.trim() && provider.model?.trim()
                                                                                    ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 animate-pulse'
                                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                            } ${(!provider.api_key.trim() || !provider.model?.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        {testingProvider === index ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                                                Testing...
                                                                            </div>
                                                                        ) : provider.tested ? (
                                                                            'Verified ✓'
                                                                        ) : !provider.tested && provider.api_key.trim() && provider.model?.trim() ? (
                                                                            '⚠️ Test Required'
                                                                        ) : (
                                                                            'Test'
                                                                        )}
                                                                    </button>

                                                                    {/* Expand/Collapse */}
                                                                    <button
                                                                        onClick={() => setExpandedProvider(expandedProvider === index ? null : index)}
                                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                    >
                                                                        {expandedProvider === index ? (
                                                                            <FiChevronUp className="w-5 h-5 text-gray-500" />
                                                                        ) : (
                                                                            <FiChevronDown className="w-5 h-5 text-gray-500" />
                                                                        )}
                                                                    </button>

                                                                    {/* Delete */}
                                                                    <button
                                                                        onClick={() => handleDeleteClick(index)}
                                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    >
                                                                        <FiTrash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Details */}
                                                        {expandedProvider === index && (
                                                            <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                                                {/* Name */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                                        Provider Name <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={provider.name || ''}
                                                                        onChange={(e) => updateProvider(index, 'name', e.target.value)}
                                                                        placeholder="My AI Provider"
                                                                        className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                                                    />
                                                                </div>

                                                                {/* API Key */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                                        API Key <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="password"
                                                                            value={provider.api_key}
                                                                            onChange={(e) => updateProvider(index, 'api_key', e.target.value)}
                                                                            placeholder="sk-..."
                                                                            className={`w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border rounded-lg outline-none focus:ring-2 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 font-mono ${!provider.api_key.trim()
                                                                                ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500/20'
                                                                                : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
                                                                                }`}
                                                                        />
                                                                        {!provider.api_key.trim() && (
                                                                            <FiAlertCircle className="absolute right-3 top-3 w-4 h-4 text-red-500" />
                                                                        )}
                                                                    </div>
                                                                    {provider.provider === 'ollama' && (
                                                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                                            💡 For Ollama: Enter base URL (e.g., http://localhost:11434 or https://your-ollama-api.com)
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Provider & Model */}
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                                            Provider
                                                                        </label>
                                                                        <select
                                                                            value={provider.provider}
                                                                            onChange={(e) => updateProvider(index, 'provider', e.target.value)}
                                                                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all text-gray-900 dark:text-gray-100"
                                                                        >
                                                                            <option value="openrouter">OpenRouter</option>
                                                                            <option value="openai">OpenAI</option>
                                                                            <option value="anthropic">Anthropic</option>
                                                                            <option value="gemini">Google Gemini</option>
                                                                            <option value="mistral">Mistral AI</option>
                                                                            <option value="groq">Groq</option>
                                                                            <option value="ollama">Ollama</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                                            Model <span className="text-red-500">*</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={provider.model || ''}
                                                                            onChange={(e) => updateProvider(index, 'model', e.target.value)}
                                                                            placeholder="e.g. openai/gpt-4o-mini"
                                                                            className={`w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border rounded-lg outline-none focus:ring-2 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 ${!provider.model?.trim()
                                                                                ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500/20'
                                                                                : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
                                                                                }`}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Global Prompt Checkbox */}
                                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={provider.use_global_prompt}
                                                                            onChange={(e) => updateProvider(index, 'use_global_prompt', e.target.checked)}
                                                                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                                        />
                                                                        <div>
                                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                                Use Global System Prompt
                                                                            </span>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                                Override with provider-specific prompt if unchecked
                                                                            </p>
                                                                        </div>
                                                                    </label>
                                                                </div>

                                                                {/* Custom Prompt (if not using global) */}
                                                                {!provider.use_global_prompt && (
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                                            Custom System Prompt (Optional)
                                                                        </label>
                                                                        <textarea
                                                                            value={provider.system_prompt || ''}
                                                                            onChange={(e) => updateProvider(index, 'system_prompt', e.target.value)}
                                                                            placeholder="Custom instructions for this provider..."
                                                                            rows={3}
                                                                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Set as Default */}
                                                                {defaultModel !== provider.name && provider.is_active && (
                                                                    <button
                                                                        onClick={() => handleSetDefault(provider.name)}
                                                                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                                                    >
                                                                        Set as Default Model
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Global Prompt Tab */}
                                {activeTab === 'global' && (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <FiMessageSquare className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                            Global System Prompt
                                                        </h3>
                                                        <button
                                                            onClick={handleResetPrompt}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                                            title="Reset to default prompt"
                                                        >
                                                            <FiRefreshCw className="w-3.5 h-3.5" />
                                                            Reset to Default
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        This prompt defines how the AI behaves across all providers that have "Use Global Prompt" enabled.
                                                    </p>
                                                </div>
                                            </div>

                                            <textarea
                                                value={systemPrompt}
                                                onChange={(e) => setSystemPrompt(e.target.value)}
                                                className="w-full h-[400px] p-4 text-sm font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-800 dark:text-gray-200 resize-none custom-scrollbar leading-relaxed"
                                                placeholder="Enter the global system prompt..."
                                            />

                                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                                <FiAlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                <p>
                                                    This prompt is mandatory. If a provider doesn't have a custom prompt, this one will be used automatically.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex-1">
                            {providers.length > 0 && providers.some((p, i) => !testResults[i]?.success) && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                    <FiAlertCircle className="w-3 h-3" />
                                    Test all providers before saving
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-md hover:shadow-lg"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            </div>

            {/* Delete Confirmation Modal */}
            {providerToDelete !== null && (
                <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                            <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                            Delete Provider?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                            Are you sure you want to delete "{providers[providerToDelete]?.name}"? This action cannot be undone.
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
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SettingsModal;
