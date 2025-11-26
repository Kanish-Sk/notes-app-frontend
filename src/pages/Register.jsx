import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiX, FiDatabase } from 'react-icons/fi';
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

    // Helper to extract error message
    const getErrorMessage = (error) => {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.detail) {
            if (typeof error.detail === 'string') return error.detail;
            if (Array.isArray(error.detail)) return error.detail[0]?.msg || 'An error occurred';
            return JSON.stringify(error.detail);
        }
        return 'An error occurred. Please try again.';
    };

    const passwordChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
    };

    const passwordStrength = () => {
        const checks = Object.values(passwordChecks).filter(Boolean).length;
        if (checks <= 1) return { label: 'Weak', color: 'red', width: '25%' };
        if (checks === 2) return { label: 'Fair', color: 'orange', width: '50%' };
        if (checks === 3) return { label: 'Good', color: 'yellow', width: '75%' };
        return { label: 'Strong', color: 'green', width: '100%' };
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleVerifyMongo = async () => {
        if (!formData.mongodbConnectionString.trim()) {
            setMongoError('Please enter a connection string');
            return;
        }

        setVerifyingMongo(true);
        setMongoError('');
        setMongoVerified(false);

        try {
            const response = await mongodbAPI.verifyConnection(formData.mongodbConnectionString);
            if (response.data.success) {
                setMongoVerified(true);
                addToast('MongoDB connection verified successfully!', 'success');
            } else {
                setMongoError(response.data.message);
                addToast(response.data.message, 'error');
            }
        } catch (err) {
            const errorMsg = 'Failed to verify connection. Please check your connection string.';
            setMongoError(errorMsg);
            addToast(errorMsg, 'error');
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

        // If MongoDB field is shown and filled, require verification
        if (showMongoField && formData.mongodbConnectionString && !mongoVerified) {
            setError('Please verify your MongoDB connection before registering');
            return;
        }

        setLoading(true);

        try {
            const requestBody = {
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName
            };

            // Add MongoDB connection string if verified
            if (mongoVerified && formData.mongodbConnectionString) {
                requestBody.mongodb_connection_string = formData.mongodbConnectionString;
            }

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = getErrorMessage(data);
                throw new Error(errorMsg);
            }

            login(data, data.user);
            addToast('Account created successfully!', 'success');
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            addToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = getErrorMessage(data);
                throw new Error(errorMsg);
            }

            login(data, data.user);
            addToast('Account created successfully!', 'success');
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            addToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const strength = passwordStrength();

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-block p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-4">
                            <span className="text-4xl">📝</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NotesApp</h1>
                    </div>

                    {/* Welcome Text */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Create an account
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Join thousands of users organizing their thoughts
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Google Sign Up */}
                    <div className="mb-6">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                setError('Google sign up failed');
                                addToast('Google sign up failed', 'error');
                            }}
                            theme="outline"
                            size="large"
                            text="signup_with"
                            shape="rectangular"
                            logo_alignment="left"
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                Or register with email
                            </span>
                        </div>
                    </div>

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Full Name
                            </label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password Strength */}
                            {formData.password && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${strength.color === 'red' ? 'bg-red-500' :
                                                    strength.color === 'orange' ? 'bg-orange-500' :
                                                        strength.color === 'yellow' ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                    }`}
                                                style={{ width: strength.width }}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${strength.color === 'red' ? 'text-red-600 dark:text-red-400' :
                                            strength.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                                                strength.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                                    'text-green-600 dark:text-green-400'
                                            }`}>
                                            {strength.label}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {Object.entries({
                                            '8+ characters': passwordChecks.length,
                                            'Uppercase': passwordChecks.uppercase,
                                            'Lowercase': passwordChecks.lowercase,
                                            'Number': passwordChecks.number,
                                        }).map(([label, passed]) => (
                                            <div key={label} className="flex items-center gap-1.5">
                                                {passed ? (
                                                    <FiCheck className="w-3.5 h-3.5 text-green-500" />
                                                ) : (
                                                    <FiX className="w-3.5 h-3.5 text-gray-400" />
                                                )}
                                                <span className={passed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                                                    {label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                    <FiCheck className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                            </div>
                        </div>

                        {/* MongoDB Connection (Optional) */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                            <button
                                type="button"
                                onClick={() => setShowMongoField(!showMongoField)}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
                            >
                                <FiDatabase className="w-4 h-4" />
                                {showMongoField ? 'Hide' : 'Add'} MongoDB Connection (Optional)
                            </button>

                            {showMongoField && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            MongoDB Connection String
                                        </label>
                                        <div className="relative group">
                                            <FiDatabase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="text"
                                                name="mongodbConnectionString"
                                                value={formData.mongodbConnectionString}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm"
                                                placeholder="mongodb+srv://user:password@cluster.mongodb.net/"
                                            />
                                            {mongoVerified && (
                                                <FiCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            Use your own MongoDB cluster to store your data. Leave blank to use our shared database.
                                        </p>
                                    </div>

                                    {formData.mongodbConnectionString && (
                                        <button
                                            type="button"
                                            onClick={handleVerifyMongo}
                                            disabled={verifyingMongo || mongoVerified}
                                            className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {verifyingMongo ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 dark:border-t-gray-300 rounded-full animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : mongoVerified ? (
                                                <>
                                                    <FiCheck className="w-4 h-4 text-green-500" />
                                                    Verified
                                                </>
                                            ) : (
                                                <>
                                                    <FiDatabase className="w-4 h-4" />
                                                    Verify Connection
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {mongoError && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r flex items-start gap-2">
                                            <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-600 dark:text-red-400">{mongoError}</p>
                                        </div>
                                    )}

                                    {mongoVerified && (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r flex items-start gap-2">
                                            <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-green-600 dark:text-green-400">Connection verified! Your data will be stored in your own cluster.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 text-white flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white rounded-full"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                            <span className="text-4xl">📝</span>
                        </div>
                        <h1 className="text-3xl font-bold">NotesApp</h1>
                    </div>

                    <div className="max-w-md">
                        <h2 className="text-5xl font-bold mb-6 leading-tight">
                            Start your creative<br />
                            journey today
                        </h2>
                        <p className="text-xl text-white/90 leading-relaxed mb-8">
                            Join our community of creators and organize your ideas like never before.
                            Simple, powerful, and free to start.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            {[
                                'Unlimited notes and folders',
                                'Real-time sync across devices',
                                'AI-powered assistance',
                                'Beautiful dark mode'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                        <FiCheck className="w-4 h-4" />
                                    </div>
                                    <span className="text-white/90">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-white/70 italic">
                        "The best note-taking app I've ever used. Simple yet powerful!"
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm font-semibold">
                            K
                        </div>
                        <div>
                            <div className="font-semibold">Kanish</div>
                            <div className="text-sm text-white/70">Creator • kanishshivan@gmail.com</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
