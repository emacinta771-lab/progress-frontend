import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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
      const roleMap = {
        admin: '/admin-dashboard',
        teacher: '/teacher-dashboard',
        accountant: '/accountant-dashboard',
        student: '/student-dashboard',
        parent: '/student-dashboard'
      };
      navigate(roleMap[user.role] || '/dashboard');
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
      
      const roleMap = {
        admin: '/admin-dashboard',
        teacher: '/teacher-dashboard',
        accountant: '/accountant-dashboard',
        student: '/student-dashboard',
        parent: '/student-dashboard'
      };
      
      const redirectPath = roleMap[result.user?.role] || '/student-dashboard';
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
        <div className="bg-[#003C43] px-6 py-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl">
              🎓
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Student Portal
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Malawi Primary School
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🎓
                </span>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Enter your registration number"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#f8fafc] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 outline-none focus:border-[#135D66] focus:ring-2 focus:ring-[#135D66]/20 transition-all disabled:opacity-50"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-2.5 bg-[#f8fafc] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 outline-none focus:border-[#135D66] focus:ring-2 focus:ring-[#135D66]/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#135D66] focus:ring-[#135D66] rounded border-gray-300"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-[#135D66] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#135D66] hover:bg-[#0e4a52] text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mt-2">
              No account?{' '}
              <Link to="/student-register" className="text-[#135D66] hover:underline font-medium">
                Register
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Staff?{' '}
              <Link to="/login" className="text-[#135D66] hover:underline font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;