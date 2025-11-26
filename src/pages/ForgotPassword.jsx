import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiAlertCircle, FiCheckCircle, FiKey, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useToast } from '../contexts/ToastContext';
import { API_BASE_URL } from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [step, setStep] = useState(1); // 1: enter email, 2: enter code & password, 3: success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 2 fields
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { addToast } = useToast();

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to send reset code');
            }

            addToast('Reset code sent to your email!', 'success');
            setStep(2); // Move to code entry step
        } catch (err) {
            setError(err.message || 'Failed to send reset code. Please try again.');
            addToast(err.message || 'Failed to send reset code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (code.length !== 6 || !/^\d+$/.test(code)) {
            setError('Reset code must be 6 digits');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    code,
                    new_password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to reset password');
            }

            setStep(3); // Move to success step
            addToast('Password reset successfully!', 'success');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password. Please try again.');
            addToast(err.message || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-12 text-white flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
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
                            {step === 1 ? (
                                <>Reset your<br />password</>
                            ) : step === 2 ? (
                                <>Enter reset<br />code</>
                            ) : (
                                <>Password<br />reset!</>
                            )}
                        </h2>
                        <p className="text-xl text-white/90 leading-relaxed">
                            {step === 1
                                ? "Don't worry! It happens. Enter your email and we'll send you a code to reset your password."
                                : step === 2
                                    ? "Check your email for the reset code. It expires in 15 minutes."
                                    : "Your password has been successfully reset. You can now log in with your new password."
                            }
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        Back to login
                    </Link>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-block p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4">
                            <span className="text-4xl">📝</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NotesApp</h1>
                    </div>

                    {/* Mobile Back Link */}
                    <div className="lg:hidden mb-6">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </div>

                    {step === 3 ? (
                        /* Success Message */
                        <div className="text-center">
                            <div className="mb-6 inline-flex p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                                <FiCheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                Password reset!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Your password has been successfully reset. Redirecting to login...
                            </p>
                            <div className="flex justify-center">
                                <div className="w-8 h-8 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
                            </div>
                        </div>
                    ) : step === 2 ? (
                        /* Step 2: Enter Code & Reset Password */
                        <>
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Enter reset code
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    We sent a 6-digit code to <span className="font-semibold text-gray-900 dark:text-white">{email}</span>
                                </p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                                    <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                {/* Reset Code */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Reset Code
                                    </label>
                                    <div className="relative group">
                                        <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            required
                                            maxLength={6}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 text-center text-xl tracking-widest font-mono"
                                            placeholder="000000"
                                            autoFocus
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Check your email for the 6-digit code
                                    </p>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
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
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Must be at least 6 characters
                                    </p>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        >
                                            {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset password'
                                    )}
                                </button>

                                {/* Resend Code */}
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setCode('');
                                            setPassword('');
                                            setConfirmPassword('');
                                            setError('');
                                        }}
                                        className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        Didn't receive the code? Request a new one
                                    </button>
                                </div>
                            </form>

                            {/* Back to Login Link */}
                            <div className="mt-8 text-center">
                                <Link
                                    to="/login"
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center gap-2"
                                >
                                    <FiArrowLeft className="w-4 h-4" />
                                    Back to login
                                </Link>
                            </div>
                        </>
                    ) : (
                        /* Step 1: Request Code Form */
                        <>
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Forgot password?
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    No worries, we'll send you reset instructions.
                                </p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                                    <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleRequestCode} className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                            placeholder="you@example.com"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send reset code'
                                    )}
                                </button>
                            </form>

                            {/* Back to Login Link */}
                            <div className="mt-8 text-center">
                                <Link
                                    to="/login"
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center gap-2"
                                >
                                    <FiArrowLeft className="w-4 h-4" />
                                    Back to login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
