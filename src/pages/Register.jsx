import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiDatabase } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mongodbAPI, API_BASE_URL } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        mongodbConnectionString: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verifyingMongo, setVerifyingMongo] = useState(false);
    const [mongoVerified, setMongoVerified] = useState(false);
    const [mongoError, setMongoError] = useState('');
    const [showMongoField, setShowMongoField] = useState(false);

    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const getErrorMessage = (error) => {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.detail) {
            if (typeof error.detail === 'string') return error.detail;
            if (Array.isArray(error.detail)) return error.detail[0]?.msg || 'An error occurred';
        }
        return 'An error occurred';
    };

    const passwordStrength = () => {
        const checks = [
            formData.password.length >= 8,
            /[A-Z]/.test(formData.password),
            /[a-z]/.test(formData.password),
            /[0-9]/.test(formData.password),
        ].filter(Boolean).length;
        if (checks <= 1) return { width: '25%', color: 'bg-red-500' };
        if (checks === 2) return { width: '50%', color: 'bg-orange-500' };
        if (checks === 3) return { width: '75%', color: 'bg-yellow-500' };
        return { width: '100%', color: 'bg-green-500' };
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVerifyMongo = async () => {
        if (!formData.mongodbConnectionString.trim()) {
            setMongoError('Please enter a connection string');
            return;
        }
        setVerifyingMongo(true);
        setMongoError('');
        try {
            const response = await mongodbAPI.verifyConnection(formData.mongodbConnectionString);
            if (response.data.success) {
                setMongoVerified(true);
                addToast('MongoDB verified!', 'success');
            } else {
                setMongoError(response.data.message);
            }
        } catch {
            setMongoError('Failed to verify');
        } finally {
            setVerifyingMongo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (showMongoField && formData.mongodbConnectionString && !mongoVerified) {
            setError('Please verify MongoDB connection');
            return;
        }
        setLoading(true);
        try {
            const requestBody = {
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName
            };
            if (mongoVerified) requestBody.mongodb_connection_string = formData.mongodbConnectionString;
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(getErrorMessage(data));
            login(data, data.user);
            addToast('Account created!', 'success');
            navigate('/home');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(getErrorMessage(data));
            login(data, data.user);
            addToast('Welcome!', 'success');
            navigate('/home');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const strength = passwordStrength();

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex relative">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] bg-purple-600/40 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-200px] left-[-200px] w-[800px] h-[800px] bg-fuchsia-600/30 rounded-full blur-[150px]"></div>
            </div>

            {/* Left Side - Register Card */}
            <div className="flex-1 flex items-center justify-center px-6 py-6 relative z-10 overflow-y-auto mt-8">
                <div className="w-full max-w-xl flex items-center justify-center">
                    <div className="relative w-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-[2rem] blur-xl"></div>

                        <div className="relative bg-white/[0.08] backdrop-blur-3xl rounded-[2rem] px-10 py-10 border border-white/[0.15] shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] w-full">

                            {/* Mobile Logo */}
                            <div className="lg:hidden text-center mb-6">
                                <img src="/notefusion-logo.jpg" alt="Note Fusion" className="w-16 h-16 mx-auto rounded-xl shadow-lg mb-2 border-2 border-white/20" />
                                <h1 className="text-xl font-bold text-white">Note Fusion</h1>
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
                            <p className="text-white/60 mb-5 text-xl">Your AI-powered workspace awaits ✨</p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-200 text-sm">
                                    <FiAlertCircle className="flex-shrink-0" size={14} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Google Login - Working */}
                            <div className="mb-4">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError("Google sign up failed")}
                                    useOneTap={false}
                                    theme="outline"
                                    size="large"
                                    text="signup_with"
                                    shape="rectangular"
                                />
                            </div>

                            <div className="flex items-center gap-2 my-4">
                                <div className="flex-1 h-px bg-white/20"></div>
                                <span className="text-white/40 text-sm">or</span>
                                <div className="flex-1 h-px bg-white/20"></div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-white/80 text-sm mb-1.5">Name</label>
                                    <div className="relative">
                                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl py-3 pl-11 pr-4 text-white text-base placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/80 text-sm mb-1.5">Email</label>
                                    <div className="relative">
                                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl py-3 pl-11 pr-4 text-white text-base placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/80 text-sm mb-1.5">Password</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl py-3 pl-11 pr-11 text-white text-base placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                                            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                    {formData.password && (
                                        <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div className={`h-full ${strength.color} transition-all`} style={{ width: strength.width }}></div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-white/80 text-sm mb-1.5">Confirm</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl py-3 pl-11 pr-11 text-white text-base placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                                            {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setShowMongoField(!showMongoField)} className="flex items-center gap-2 text-white/50 text-sm hover:text-white/70">
                                        <FiDatabase size={14} />
                                        <span>{showMongoField ? 'Hide' : 'Add'} MongoDB (optional but recommended)</span>
                                    </button>
                                    <div className="group relative">
                                        <FiAlertCircle className="text-white/40 cursor-help" size={14} />
                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg z-10">
                                            Without MongoDB, you won't be able to create or save notes
                                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                </div>

                                {showMongoField && (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            name="mongodbConnectionString"
                                            value={formData.mongodbConnectionString}
                                            onChange={handleChange}
                                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl py-2 px-3 text-white text-xs placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            placeholder="mongodb+srv://..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyMongo}
                                            disabled={verifyingMongo}
                                            className="w-full py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-xs hover:bg-white/[0.1] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {verifyingMongo ? 'Verifying...' : mongoVerified ? <><FiCheck className="text-green-400" size={12} /> Verified</> : 'Verify'}
                                        </button>
                                        {mongoError && <p className="text-red-300 text-xs">{mongoError}</p>}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg hover:scale-[1.02] text-lg"
                                >
                                    {loading ? "Creating..." : "Create Account"}
                                </button>
                            </form>

                            <p className="text-center text-white/50 mt-5 text-sm">
                                Have an account?{" "}
                                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Full Space Branding */}
            <div className="hidden lg:flex lg:flex-1 items-center justify-center px-4 py-10 relative z-10 -ml-24">
                <div className="w-full max-w-3xl">
                    {/* Big Logo */}
                    <div className="flex items-center gap-8 mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-[2.5rem] blur-2xl opacity-70"></div>
                            <img src="/notefusion-logo.jpg" alt="Note Fusion" className="relative w-32 h-32 rounded-[2.5rem] shadow-2xl border-4 border-white/30" />
                        </div>
                        <div>
                            <h1 className="text-6xl font-black text-white tracking-tight">Note Fusion</h1>
                            <p className="text-xl text-purple-300 mt-2">AI-Powered Note Taking Platform</p>
                        </div>
                    </div>

                    {/* Detailed Features */}
                    <div className="space-y-4 mb-7">
                        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                                    <img src="/notefusion-robot.jpg" alt="AI" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1.5">🤖 AI Assistant</h3>
                                    <p className="text-white/70 leading-relaxed text-sm">Chat with our intelligent AI to create, edit, summarize, and organize your notes effortlessly. Get smart suggestions, automate repetitive tasks, and enhance your productivity with advanced language models like GPT-4, Claude, or Gemini.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg flex-shrink-0">✍️</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1.5">Rich Text Editor</h3>
                                    <p className="text-white/70 leading-relaxed text-sm">Full Markdown support with real-time preview, syntax highlighting for 100+ programming languages, tables, checklists, code blocks, and beautiful formatting options. Write technical documentation, blog posts, or personal notes with ease.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-lg flex-shrink-0">📁</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1.5">Smart Organization</h3>
                                    <p className="text-white/70 leading-relaxed text-sm">Create unlimited nested folders with intuitive drag-and-drop interface. Share notes and folders with team members, manage permissions, and access your organized workspace from anywhere with real-time synchronization.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Setup Guide */}
                    <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                        <h3 className="text-white font-bold text-sm mb-2.5 flex items-center gap-2">
                            <span>⚡</span> Quick Setup Requirements
                        </h3>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex gap-2">
                                <span className="text-purple-400 font-bold">1.</span>
                                <div>
                                    <span className="text-white font-semibold">LLM API Key:</span>
                                    <span className="text-white/60"> Get your API key from OpenAI, Google AI (Gemini), or Anthropic (Claude) to power the AI assistant features and intelligent note management.</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-purple-400 font-bold">2.</span>
                                <div>
                                    <span className="text-white font-semibold">MongoDB Database:</span>
                                    <span className="text-white/60"> Create a free cluster on MongoDB Atlas to securely store all your notes, folders, user data, and collaborate with your team in real-time.</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-purple-400 font-bold">3.</span>
                                <div>
                                    <span className="text-white font-semibold">Cloudinary Account:</span>
                                    <span className="text-white/60"> Sign up for free image hosting to upload and manage screenshots, diagrams, and images directly within your notes.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
