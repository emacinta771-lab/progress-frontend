import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, receiptAPI, paymentAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const AccountantDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentPayments, setRecentPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeData, setFeeData] = useState({
    student_id: '',
    total_fees: '',
    amount_paid: '',
    outstanding_balance: '',
    fee_payment_plan: 'Full',
    scholarship_type: 'None',
    financial_hold: false,
    notes: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [receiptStats, setReceiptStats] = useState(null);


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const statsRes = await studentAPI.getStats();
      setStats(statsRes.data.stats);

      const studentsRes = await studentAPI.getAll();
      const studentList = studentsRes.data.students || [];
      setStudents(studentList);
      setFilteredStudents(studentList);

      try {
        const paymentsRes = await studentAPI.getRecentPayments?.();
        if (paymentsRes?.data?.payments) setRecentPayments(paymentsRes.data.payments);
      } catch {
        setRecentPayments([
          { id: 1, student_name: 'Chisomo Banda', amount: 25000, method: 'Cash', date: new Date().toLocaleDateString(), status: 'Completed', receipt: 'RCP-001' },
          { id: 2, student_name: 'Thandiwe Mbewe', amount: 15000, method: 'Mobile Money', date: new Date().toLocaleDateString(), status: 'Pending', receipt: 'RCP-002' }
        ]);
      }

      try {
        const statsR = await receiptAPI.getReceiptStats();
        setReceiptStats(statsR.data?.stats || null);
      } catch {
        setReceiptStats(null);
      }

    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredStudents(
      term.trim() === ''
        ? students
        : students.filter(s =>
            s.first_name?.toLowerCase().includes(term) ||
            s.last_name?.toLowerCase().includes(term) ||
            s.student_code?.toLowerCase().includes(term) ||
            s.student_id?.toLowerCase().includes(term)
          )
    );
  };

  const handleOpenFeeModal = (student) => {
    setSelectedStudent(student);
    setFeeData({
      student_id: student.student_id || student.id,
      total_fees: student.total_fees || '',
      amount_paid: student.amount_paid || '',
      outstanding_balance: student.outstanding_balance || '',
      fee_payment_plan: student.fee_payment_plan || 'Full',
      scholarship_type: student.scholarship_type || 'None',
      financial_hold: student.financial_hold || false,
      notes: student.notes || ''
    });
    setShowFeeModal(true);
    setUpdateSuccess('');
    setUpdateError('');
  };

  const handleFeeUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError('');
    setUpdateSuccess('');
    try {
      await studentAPI.update(feeData.student_id, {
        total_fees: parseFloat(feeData.total_fees) || 0,
        amount_paid: parseFloat(feeData.amount_paid) || 0,
        outstanding_balance: parseFloat(feeData.outstanding_balance) || 0,
        fee_payment_plan: feeData.fee_payment_plan,
        scholarship_type: feeData.scholarship_type,
        financial_hold: feeData.financial_hold,
        notes: feeData.notes
      });
      setUpdateSuccess('✅ Fees updated successfully!');
      await fetchDashboardData();
      setTimeout(() => { setShowFeeModal(false); setSelectedStudent(null); setUpdateSuccess(''); }, 1500);
    } catch (err) {
      setUpdateError(err.response?.data?.error || 'Failed to update fees');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Skeleton shimmer component
  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] text-[#1a2a3a] pb-12">
        {/* Banner skeleton */}
        <div className="bg-[#003C43] px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-8 w-64 bg-white/20 mb-2" />
            <Skeleton className="h-4 w-96 bg-white/10" />
          </div>
        </div>
        {/* Nav skeleton */}
        <div className="bg-[#135D66] h-14" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 bg-white" />)}
          </div>
          {/* Table skeleton */}
          <div className="bg-white rounded-lg border border-gray-200">
            <Skeleton className="h-10 rounded-none border-b border-gray-200" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchDashboardData} className="mt-3 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition text-sm font-medium">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = stats?.total_amount_paid || 0;
  const totalStudents = stats?.total_students || 0;
  const activeStudents = stats?.active_students || 0;
  const financialHolds = stats?.financial_holds || 0;
  const outstandingBalance = stats?.total_outstanding_balance || 0;
  const paidStudents = activeStudents - financialHolds;

  const accountantStats = [
    { title: 'Total Revenue', value: `MK ${totalRevenue.toLocaleString()}`, icon: '💰' },
    { title: 'Outstanding Balance', value: `MK ${outstandingBalance.toLocaleString()}`, icon: '📊' },
    { title: 'Paid Students', value: paidStudents, icon: '✅' },
    { title: 'Financial Holds', value: financialHolds, icon: '⚠️' }
  ];
  const navItems = [
    { title: 'Dashboard', path: '/accountant-dashboard' },
    { title: 'Receipts', path: '/receipt-repository' },
    { title: 'Payments', path: '/payments' },
    { title: 'Students', path: '/students' },
    { title: 'Reports', path: '/reports' },
    { title: 'Fees', path: '/fee-structure' }
  ];

  const statusStyle = (status) => {
    switch (status) {
      case 'Verified': return 'bg-green-50 text-green-700 border border-green-200';
      case 'Analyzed': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

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
              Accountant Dashboard — Manage school finances, fees, and payments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/90">
              <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse"></span>
              <span>Academic Year 2026</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
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
                  {item.title === 'Receipts' && receiptStats?.pending > 0 && (
                    <span className="ml-1 bg-yellow-400 text-black px-1.5 py-0.5 rounded-full text-[10px]">
                      {receiptStats.pending}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <span className="text-xs text-white/70 hidden md:inline">{user?.first_name || 'Accountant'}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {accountantStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{stat.title}</span>
                <span className="text-base">{stat.icon}</span>
              </div>
              <p className="text-xl font-bold text-gray-800 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>⚡</span> Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'Record Payment', icon: '💳', path: '/payments' },
              { title: 'Receipt Repository', icon: '📥', path: '/receipt-repository' },
              { title: 'View Reports', icon: '📊', path: '/reports' },
              { title: 'Fee Structure', icon: '📋', path: '/fee-structure' }
            ].map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="bg-[#f0f7ff] hover:bg-[#135D66]/10 rounded-lg px-3 py-3 text-center transition-all duration-200 border border-gray-200 hover:border-[#135D66]"
              >
                <div className="text-2xl">{action.icon}</div>
                <div className="text-xs font-medium text-gray-700 mt-1">{action.title}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Student Fee Management Table ──────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <span>💳</span> Fee Management
            </h2>
            <input
              type="text"
              placeholder="🔍 Search students..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full sm:w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition bg-white"
            />
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-200">
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5">Total Fees</th>
                    <th className="px-4 py-2.5">Amount Paid</th>
                    <th className="px-4 py-2.5">Balance</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {student.student_code || student.id}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">MK {parseFloat(student.total_fees || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-green-600">MK {parseFloat(student.amount_paid || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-medium">
                        {student.outstanding_balance > 0
                          ? <span className="text-red-600">MK {parseFloat(student.outstanding_balance).toLocaleString()}</span>
                          : <span className="text-green-600">Paid</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block
                          ${student.financial_hold ? 'bg-red-50 text-red-700 border border-red-200'
                            : student.outstanding_balance > 0 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-green-50 text-green-700 border border-green-200'}`}
                        >
                          {student.financial_hold ? 'On Hold' : student.outstanding_balance > 0 ? 'Pending' : 'Paid'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => handleOpenFeeModal(student)}
                          className="text-[#135D66] hover:text-[#003C43] text-xs font-medium flex items-center gap-1 mx-auto"
                        >
                          ✏️ Edit Fees
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recent Payments ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><span>💰</span> Recent Payments</h2>
            <Link to="/payments" className="text-xs text-[#003C43] hover:text-[#135D66] font-medium hover:underline transition">View All →</Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No recent payments recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-200">
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Receipt</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{payment.student_name}</td>
                      <td className="px-4 py-2.5 font-medium text-green-600">MK {payment.amount.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{payment.method}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{payment.receipt || 'N/A'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block
                          ${payment.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200'
                            : payment.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-red-50 text-red-700 border border-red-200'}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Summary Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Students</h3>
              <span className="text-lg">👨‍🎓</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalStudents}</p>
            <p className="text-xs text-gray-400 mt-1">Registered in system</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Active Students</h3>
              <span className="text-lg">✅</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{activeStudents}</p>
            <p className="text-xs text-gray-400 mt-1">Currently enrolled</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Collection Rate</h3>
              <span className="text-lg">📈</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Students with full payment</p>
          </div>
        </div>

      </div>

      {/* ── Fee Management Modal ──────────────────────────────────────────── */}
      {showFeeModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#135D66] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">Manage Fees — {selectedStudent.first_name} {selectedStudent.last_name}</h2>
              <button onClick={() => { setShowFeeModal(false); setSelectedStudent(null); }} className="text-white/70 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleFeeUpdate} className="p-6">
              {updateError && <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded"><p className="text-red-700 text-sm">{updateError}</p></div>}
              {updateSuccess && <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded"><p className="text-green-700 text-sm">{updateSuccess}</p></div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Student Code</label>
                  <input type="text" value={selectedStudent.student_code || selectedStudent.id} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Student Name</label>
                  <input type="text" value={`${selectedStudent.first_name} ${selectedStudent.last_name}`} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Fees (MK)</label>
                  <input type="number" value={feeData.total_fees} onChange={(e) => setFeeData({...feeData, total_fees: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount Paid (MK)</label>
                  <input type="number" value={feeData.amount_paid} onChange={(e) => setFeeData({...feeData, amount_paid: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Outstanding Balance (MK)</label>
                  <input type="number" value={feeData.outstanding_balance} onChange={(e) => setFeeData({...feeData, outstanding_balance: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Plan</label>
                  <select value={feeData.fee_payment_plan} onChange={(e) => setFeeData({...feeData, fee_payment_plan: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition">
                    <option value="Full">Full</option>
                    <option value="Termly">Termly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Installment">Installment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Scholarship Type</label>
                  <select value={feeData.scholarship_type} onChange={(e) => setFeeData({...feeData, scholarship_type: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition">
                    <option value="None">None</option>
                    <option value="Government">Government</option>
                    <option value="NGO">NGO</option>
                    <option value="Church">Church</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Merit">Merit</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <input type="checkbox" checked={feeData.financial_hold} onChange={(e) => setFeeData({...feeData, financial_hold: e.target.checked})} className="w-4 h-4 text-[#135D66] focus:ring-[#135D66] rounded" />
                  <label className="text-sm text-gray-700">Financial Hold</label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={feeData.notes} onChange={(e) => setFeeData({...feeData, notes: e.target.value})} rows="2" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition" placeholder="Additional notes..." />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowFeeModal(false); setSelectedStudent(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">Cancel</button>
                <button type="submit" disabled={updateLoading} className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  {updateLoading ? 'Updating...' : '💾 Update Fees'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccountantDashboard;
