import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const getRolePath = (role) => {
  const roleMap = {
    admin: '/admin-dashboard',
    teacher: '/teacher-dashboard',
    accountant: '/accountant-dashboard',
    student: '/student-dashboard',
    parent: '/student-dashboard',
  };
  return roleMap[role] || '/dashboard';
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(getRolePath(user.role));
    }
  }, [user, navigate]);

  // Load saved username if Remember Me was previously checked
  useEffect(() => {
    const savedUsername = localStorage.getItem('staffUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formattedUsername = username.trim();
    const result = await login(formattedUsername, password);

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('staffUsername', formattedUsername);
      } else {
        localStorage.removeItem('staffUsername');
      }

      navigate(getRolePath(result.user?.role));
    } else {
      setError(result.error || 'Login failed.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f7ff] p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#003C43] px-6 py-6 text-center text-white">
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-wide">Staff Portal</h1>
          <p className="text-white/70 text-xs mt-1">School Management System</p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-700 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Username / Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username or email"
                  required
                  disabled={loading}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#135D66] focus:ring-2 focus:ring-[#135D66]/20 transition disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  className="w-full pl-9 pr-10 py-2 bg-[#f8fafc] border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#135D66] focus:ring-2 focus:ring-[#135D66]/20 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#135D66] focus:ring-[#135D66] rounded border-gray-300 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-gray-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#135D66] hover:bg-[#0e4a52] text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm mt-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Login;