import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const getRolePath = (role) => {
  const roleMap = {
    admin: '/admin-dashboard',
    teacher: '/teacher-dashboard',
    accountant: '/accountant-dashboard',
    student: '/student-dashboard',
    parent: '/student-dashboard'
  };
  return roleMap[role] || '/dashboard';
};

const StudentLogin = () => {
  const [registrationNumber, setRegistrationNumber] = useState('');
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

  useEffect(() => {
    const savedReg = localStorage.getItem('studentRegNumber');
    if (savedReg) {
      setRegistrationNumber(savedReg);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const username = registrationNumber.trim();
    const result = await login(username, password);
    
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('studentRegNumber', registrationNumber);
      } else {
        localStorage.removeItem('studentRegNumber');
      }
      
      const redirectPath = getRolePath(result.user?.role) || '/student-dashboard';
      navigate(redirectPath);
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
            {/* Academic Cap SVG Icon */}
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-wide">Student Portal</h1>
          <p className="text-white/70 text-xs mt-1">Malawi Primary School</p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-700 text-xs font-medium">{error}</p>
              </div>
            )}
            
            {/* Registration Number Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Registration Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {/* Badge/Card Icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Enter your registration number"
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
                  {/* Lock Icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
                    /* Eye Off Icon */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                    </svg>
                  ) : (
                    /* Eye Icon */
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#135D66] focus:ring-[#135D66] rounded border-gray-300 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-gray-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-[#135D66] font-medium hover:underline"
              >
                Forgot password?
              </Link>
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

          {/* Footer Link */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              No account?{' '}
              <Link to="/student-register" className="text-[#135D66] font-semibold hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentLogin;