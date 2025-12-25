import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { API_BASE_URL } from "../services/api";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ users: 0, notes: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const getErrorMessage = (error) => {
    if (typeof error === "string") return error;
    if (error?.detail) {
      if (typeof error.detail === "string") return error.detail;
      if (Array.isArray(error.detail)) return error.detail.map((e) => e.msg).join(", ");
    }
    return "An error occurred";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data));
      login(data, data.user);
      addToast("Welcome back!", "success");
      navigate("/home");
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(data));
      login(data, data.user);
      addToast("Welcome!", "success");
      navigate("/home");
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex relative">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] bg-purple-600/40 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-200px] right-[-200px] w-[800px] h-[800px] bg-fuchsia-600/30 rounded-full blur-[150px]"></div>
      </div>

      {/* Left Side - Full Space Branding */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center px-8 py-10 relative z-10 pl-20">
        <div className="w-full max-w-3xl">
          {/* Big Logo */}
          <div className="flex items-center gap-8 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-[2.5rem] blur-2xl opacity-70"></div>
              <img src="/notefusion-logo.jpg" alt="Note Fusion" className="relative w-28 h-28 rounded-[2.5rem] shadow-2xl border-4 border-white/30" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white">Note Fusion</h1>
              <p className="text-xl text-purple-300 mt-1">AI-Powered Intelligence</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-5 mb-7">
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 flex-1">
              <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{stats.users}+</div>
              <div className="text-white/60 mt-1.5 text-sm">Active Users</div>
            </div>
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 flex-1">
              <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.notes}+</div>
              <div className="text-white/60 mt-1.5 text-sm">Notes Created</div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                  <img src="/notefusion-robot.jpg" alt="AI" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">AI Assistant</h3>
                  <p className="text-white/70 leading-relaxed text-sm">Intelligent AI to create, edit, and organize notes with smart suggestions and automation.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg flex-shrink-0">✍️</div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">Rich Text Editor</h3>
                  <p className="text-white/70 leading-relaxed text-sm">Full Markdown with syntax highlighting for 100+ languages and beautiful formatting.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-lg flex-shrink-0">📁</div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">Smart Organization</h3>
                  <p className="text-white/70 leading-relaxed text-sm">Unlimited folders with drag-drop and team collaboration features.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-2.5">⚡ Quick Setup</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex gap-2">
                <span className="text-purple-400 font-bold">1.</span>
                <div><span className="text-white font-semibold">LLM API:</span> <span className="text-white/60">Get OpenAI/Gemini/Claude key for AI features</span></div>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-400 font-bold">2.</span>
                <div><span className="text-white font-semibold">MongoDB:</span> <span className="text-white/60">Free cluster on MongoDB Atlas for data storage</span></div>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-400 font-bold">3.</span>
                <div><span className="text-white font-semibold">Cloudinary:</span> <span className="text-white/60">Free account for image hosting in notes</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-6 relative z-10 mt-8">
        <div className="w-full max-w-lg flex items-center justify-center">
          {/* Glass Card */}
          <div className="relative w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-[2rem] blur-xl"></div>

            <div className="relative bg-white/[0.08] backdrop-blur-3xl rounded-[2rem] px-10 py-12 border border-white/[0.15] shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] w-full">

              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <img src="/notefusion-logo.jpg" alt="Note Fusion" className="w-20 h-20 mx-auto rounded-2xl shadow-lg mb-4 border-2 border-white/20" />
                <h1 className="text-2xl font-bold text-white">Note Fusion</h1>
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">Welcome back</h2>
              <p className="text-white/60 mb-6 text-xl">Your intelligent notes await ✨</p>

              {error && (
                <div className="mb-5 p-3 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-xl flex items-center gap-2 text-red-200 text-sm">
                  <FiAlertCircle className="flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Google Login - Working */}
              <div className="mb-5">
                <GoogleLogin
                  key="login-google"
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign in failed")}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>

              <div className="flex items-center gap-2 my-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <span className="text-white/40 text-sm">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] rounded-xl py-3 pl-11 pr-4 text-white text-base placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] rounded-xl py-3 pl-11 pr-11 text-white text-base placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-purple-500/40 hover:scale-[1.02] text-lg"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="text-center text-white/50 mt-6 text-sm">
                Don't have an account?{" "}
                <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
