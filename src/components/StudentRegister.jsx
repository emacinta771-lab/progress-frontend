import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: Student Code, 2: Account Details
  
  const [formData, setFormData] = useState({
    student_code: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Step 1: Verify Student Code
  const handleVerifyStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.verifyStudent(formData.student_code);
      const studentData = response.data.student;
      
      if (!studentData) {
        setError('Invalid student code. Please check and try again.');
        return;
      }

      // Pre-fill the form with student data
      setFormData(prev => ({
        ...prev,
        first_name: studentData.first_name || '',
        last_name: studentData.last_name || '',
        date_of_birth: studentData.date_of_birth || '',
        email: studentData.parent_email || '',
        phone: studentData.phone || ''
      }));

      setSuccess('✅ Student verified! Please create your account.');
      setStep(2);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify student code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create Account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate password
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Create user account
      const userData = {
        username: formData.username || formData.email.split('@')[0],
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        student_code: formData.student_code,
        phone: formData.phone,
        role: 'student'
      };

      await authAPI.registerStudent(userData);
      setSuccess('✅ Account created successfully! You can now log in.');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
        
        {/* Header */}
        <div className="bg-[#003C43] text-white px-6 py-4 rounded-t-lg -mt-6 -mx-6 mb-6">
          <h2 className="text-2xl font-bold">📝 Student Registration</h2>
          <p className="text-white/70 text-sm mt-1">
            {step === 1 ? 'Enter your student code to begin' : 'Create your account'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`flex-1 text-center ${step >= 1 ? 'text-[#135D66]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 font-bold text-sm
              ${step >= 1 ? 'bg-[#135D66] text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <span className="text-xs">Verify Code</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200">
            <div className={`h-full bg-[#135D66] transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className={`flex-1 text-center ${step >= 2 ? 'text-[#135D66]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 font-bold text-sm
              ${step >= 2 ? 'bg-[#135D66] text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
            <span className="text-xs">Create Account</span>
          </div>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Step 1: Student Code Verification */}
        {step === 1 && (
          <form onSubmit={handleVerifyStudent}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="student_code"
                value={formData.student_code}
                onChange={handleChange}
                placeholder="Enter your student code (e.g., ST-001)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ask your teacher or check your student ID card for your code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Verifying...' : 'Verify Student Code →'}
            </button>

            <div className="text-center mt-4">
              <Link to="/login" className="text-sm text-[#135D66] hover:underline">
                Already have an account? Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Create Account */}
        {step === 2 && (
          <form onSubmit={handleCreateAccount}>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+265 888 123 456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  required
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Student:</span> {formData.first_name} {formData.last_name}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Code:</span> {formData.student_code}
                </p>
                {formData.date_of_birth && (
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Date of Birth:</span> {new Date(formData.date_of_birth).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setSuccess('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link to="/login" className="text-sm text-[#135D66] hover:underline">
                Already have an account? Login
              </Link>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;