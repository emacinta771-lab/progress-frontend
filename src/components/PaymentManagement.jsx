import React, { useState, useEffect } from 'react';
import { paymentAPI, studentAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PaymentManagement = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [paymentData, setPaymentData] = useState({
    student_id: '',
    amount: '',
    payment_method: 'Cash',
    receipt_number: '',
    payment_period: 'General',
    status: 'Completed',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAllPayments(limit, offset);
      setPayments(response.data.payments || []);
      setTotal(response.data.total || 0);
      setError('');
    } catch (err) {
      setError('Failed to fetch payments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAll();
      setStudents(response.data.students || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!paymentData.student_id || !paymentData.amount) {
        setError('Student and amount are required');
        setSubmitting(false);
        return;
      }

      const response = await paymentAPI.recordPayment(
        paymentData.student_id,
        {
          amount: parseFloat(paymentData.amount),
          payment_method: paymentData.payment_method,
          receipt_number: paymentData.receipt_number || `RCP-${Date.now()}`,
          payment_period: paymentData.payment_period,
          status: paymentData.status,
          notes: paymentData.notes
        }
      );

      if (response.data.success) {
        setSuccess('✅ Payment recorded successfully!');
        setPaymentData({
          student_id: '',
          amount: '',
          payment_method: 'Cash',
          receipt_number: '',
          payment_period: 'General',
          status: 'Completed',
          notes: ''
        });
        setShowPaymentForm(false);
        fetchPayments();
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const navItems = [
    { title: 'Dashboard', path: '/accountant-dashboard', icon: '📊' },
    { title: 'Payments', path: '/payments', icon: '💰' },
    { title: 'Students', path: '/students', icon: '👨‍🎓' },
    { title: 'Reports', path: '/reports', icon: '📈' },
    { title: 'Fee Structure', path: '/fee-structure', icon: '📋' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#003C43] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-[#4a6fa5] font-medium text-sm">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-[#1a2a3a] pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-[#003C43] text-white px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              👋 Welcome back, {user?.first_name || 'Accountant'}!
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              Payment Management — Record and track all student payments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/90">
              <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse"></span>
              <span>Academic Year 2026</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-4 py-1.5 rounded-full transition-colors border border-white/20"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-[#135D66] text-white border-b border-[#0e4a52] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap
                    ${window.location.pathname === item.path 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-white/70 hidden md:inline">
                {user?.first_name || 'Accountant'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Payment Management Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#003C43]">💰 Payment Management</h2>
              <p className="text-sm text-gray-500 mt-1">View and manage all student payments</p>
            </div>
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium text-sm flex items-center gap-2"
            >
              {showPaymentForm ? '✕ Cancel' : '➕ Record Payment'}
            </button>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
              <p className="text-red-700 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
              <p className="text-green-700 text-sm flex items-center gap-2">
                <span>✅</span> {success}
              </p>
            </div>
          )}

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#003C43] mb-4">Record New Payment</h3>
              <form onSubmit={handleSubmitPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="student_id"
                    value={paymentData.student_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.student_id}>
                        {student.first_name} {student.last_name} ({student.student_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (MK) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={paymentData.payment_method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    name="receipt_number"
                    value={paymentData.receipt_number}
                    onChange={handleInputChange}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Period
                  </label>
                  <select
                    name="payment_period"
                    value={paymentData.payment_period}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="General">General</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Full Year">Full Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={paymentData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={paymentData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Additional notes about this payment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentData({
                        student_id: '',
                        amount: '',
                        payment_method: 'Cash',
                        receipt_number: '',
                        payment_period: 'General',
                        status: 'Completed',
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 font-medium text-sm flex items-center gap-2"
                  >
                    {submitting ? '⏳ Processing...' : '💾 Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-blue-700">{total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-700">
                MK {payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-yellow-700">
                {payments.filter(p => p.status === 'Completed').length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-red-700">
                {payments.filter(p => p.status === 'Pending').length}
              </p>
            </div>
          </div>

          {/* Payments Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Student</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Method</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Receipt</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-6 text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-800">
                        {payment.student_name || 'N/A'}
                        <span className="block text-xs text-gray-500">{payment.student_code}</span>
                      </td>
                      <td className="p-3 font-medium text-green-600">
                        MK {parseFloat(payment.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-sm">{payment.payment_method || 'Cash'}</td>
                      <td className="p-3 text-sm font-mono">{payment.receipt_number || 'N/A'}</td>
                      <td className="p-3 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${payment.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                            payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            'bg-red-100 text-red-700 border border-red-200'}`}
                        >
                          {payment.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;