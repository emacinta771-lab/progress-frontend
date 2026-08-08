import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, authAPI, credentialAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

// --- Inline SVG Icons to ensure zero missing dependency errors ---
const Icons = {
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 100 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  UserCheck: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Dollar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 12v-2m0 0e-3c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Shirt: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Book: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  UserPlus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Teacher: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  LogOut: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  )
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [studentsWithoutAccounts, setStudentsWithoutAccounts] = useState(0);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [showRecentStudents, setShowRecentStudents] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsRes = await studentAPI.getStats();
      const studentsRes = await studentAPI.getAll();

      try {
        await authAPI.getUsers();
      } catch (e) {
        console.log('Could not fetch users:', e);
      }

      const students = studentsRes.data?.students || [];
      const credentialsRes = await credentialAPI.getAll();
      const credentials = credentialsRes.data?.credentials || [];

      const withoutAccounts = students.filter(s => !s.user_id).length;
      setStudentsWithoutAccounts(withoutAccounts);
      setStudentAccounts(credentials);

      setStats({
        total_students: statsRes.data?.stats?.total_students || 0,
        active_students: statsRes.data?.stats?.active_students || 0,
        financial_holds: statsRes.data?.stats?.financial_holds || 0,
        total_outstanding_balance: statsRes.data?.stats?.total_outstanding_balance || 0,
        students_with_uniform: statsRes.data?.stats?.students_with_uniform || 0,
        students_with_textbooks: statsRes.data?.stats?.students_with_textbooks || 0,
        male_students: statsRes.data?.stats?.male_students || 0,
        female_students: statsRes.data?.stats?.female_students || 0,
        total_amount_paid: statsRes.data?.stats?.total_amount_paid || 0
      });

      setRecentStudents(students.slice(0, 5) || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setStats({
        total_students: 0,
        active_students: 0,
        financial_holds: 0,
        total_outstanding_balance: 0,
        students_with_uniform: 0,
        students_with_textbooks: 0,
        male_students: 0,
        female_students: 0,
        total_amount_paid: 0
      });
      setRecentStudents([]);
      setStudentAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#003C43] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#135D66] font-semibold text-sm">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 max-w-md w-full">
          <div className="flex items-center space-x-3 text-red-600 mb-2">
            <Icons.Alert />
            <h3 className="font-bold text-base">Dashboard Error</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition text-sm font-medium shadow"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const adminStats = [
    { title: 'Total Students', value: stats?.total_students || 0, icon: <Icons.Users />, color: 'text-sky-600', bg: 'bg-sky-50' },
    { title: 'Active Students', value: stats?.active_students || 0, icon: <Icons.UserCheck />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Revenue', value: `MK ${(stats?.total_amount_paid || 0).toLocaleString()}`, icon: <Icons.Dollar />, color: 'text-[#135D66]', bg: 'bg-[#f0f7ff]' },
    { title: 'Outstanding Fees', value: `MK ${(stats?.total_outstanding_balance || 0).toLocaleString()}`, icon: <Icons.FileText />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Financial Holds', value: stats?.financial_holds || 0, icon: <Icons.Alert />, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'With Uniform', value: stats?.students_with_uniform || 0, icon: <Icons.Shirt />, color: 'text-[#003C43]', bg: 'bg-teal-50' },
    { title: 'With Textbooks', value: stats?.students_with_textbooks || 0, icon: <Icons.Book />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Gender Split', value: `♂ ${stats?.male_students || 0}  |  ♀ ${stats?.female_students || 0}`, icon: <Icons.Users />, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  const quickActions = [
    { title: 'Add Student', icon: <Icons.UserPlus />, path: '/add-student', desc: 'Register new student' },
    { title: 'Create Student Account', icon: <Icons.Shield />, path: '/admin/create-student', badge: studentsWithoutAccounts, desc: 'Assign credentials' },
    { title: 'Manage Teachers', icon: <Icons.Teacher />, path: '/teachers', desc: 'Staff directory & access' },
    { title: 'Manage Users', icon: <Icons.Users />, path: '/users', desc: 'System roles & permissions' },
    { title: 'Create Accountant', icon: <Icons.Dollar />, path: '/users', desc: 'Financial access setup' },
    { title: 'View Reports', icon: <Icons.Chart />, path: '/reports', desc: 'Analytics & downloads' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-[#1a2a3a] pb-16 font-sans">
      
      {/* GLOBAL HEADER & NAVIGATION */}
      <header className="bg-[#003C43] text-white sticky top-0 z-50 shadow-md">
        
        {/* Top Header Bar */}
        <div className="border-b border-[#135D66]/40 px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            {/* System Branding */}
            <div className="flex items-center space-x-3">
              <div className="bg-[#135D66] p-2 rounded-lg text-white">
                <Icons.Shield />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg tracking-tight block leading-none">School Manager</span>
                <span className="text-[10px] text-white/60 tracking-wider uppercase font-semibold">Admin Panel</span>
              </div>
            </div>

            {/* Admin Profile & Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 bg-[#135D66]/50 px-3 py-1 rounded-full border border-white/10 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-white/90 font-medium">Academic Year 2026</span>
              </div>

              <div className="h-4 w-px bg-white/20 hidden sm:block"></div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold text-white/90">
                  {user?.first_name || 'Admin'}
                </span>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="flex items-center space-x-1.5 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1.5 rounded-lg border border-red-400/30 transition-all"
                  title="Logout of your account"
                >
                  <Icons.LogOut />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Secondary Category Navigation */}
        <nav className="bg-[#135D66] px-4 sm:px-8 border-b border-[#0e4a52]">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto text-xs font-medium no-scrollbar">
            <div className="flex space-x-1 py-1">
              <Link to="/admin/dashboard" className="px-3 py-2 rounded-md bg-[#003C43] text-white font-semibold flex items-center space-x-1">
                <span>Dashboard</span>
              </Link>
              <Link to="/students" className="px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition">
                <span>Students</span>
              </Link>
              <Link to="/teachers" className="px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition">
                <span>Teachers</span>
              </Link>

              {/* Highlighted Create Account Option */}
              <Link to="/admin/create-student" className="px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition flex items-center space-x-1">
                <span>Accounts</span>
                {studentsWithoutAccounts > 0 && (
                  <span className="bg-amber-400 text-black text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                    {studentsWithoutAccounts}
                  </span>
                )}
              </Link>

              <Link to="/users" className="px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition">
                <span>Users & Roles</span>
              </Link>
              <Link to="/reports" className="px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition">
                <span>Reports</span>
              </Link>
            </div>
            <div className="hidden lg:block text-[11px] text-white/60 py-2">
              System Administrator View
            </div>
          </div>
        </nav>

      </header>

      {/* DASHBOARD CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-xl p-5 border border-[#135D66]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#003C43]">
              Welcome back, {user?.first_name || 'Admin'}!
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Here is your administrative overview and quick management access for today.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              to="/add-student"
              className="px-3.5 py-2 bg-[#135D66] hover:bg-[#0e4a52] text-white text-xs font-semibold rounded-lg shadow transition flex items-center space-x-1.5"
            >
              <Icons.UserPlus />
              <span>Add New Student</span>
            </Link>
          </div>
        </div>

        {/* SECTION 1: KEY ACTIONS FLOW */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-bold text-[#003C43] uppercase tracking-wider">Quick Actions & Workflows</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="group bg-white p-3.5 rounded-xl border border-gray-200 hover:border-[#135D66] hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-[#f0f7ff] text-[#135D66] group-hover:bg-[#135D66] group-hover:text-white transition-colors">
                    {action.icon}
                  </div>
                  {action.badge > 0 && (
                    <span className="bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-800 group-hover:text-[#135D66] transition-colors">{action.title}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 2: STATS SUMMARY GRID */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-bold text-[#003C43] uppercase tracking-wider">Key Metrics Overview</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {adminStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500">
                    {stat.title}
                  </span>
                  <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: CREATED ACCOUNTS TABLE */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded bg-teal-50 text-[#135D66]">
                <Icons.Lock />
              </div>
              <h2 className="text-sm font-bold text-gray-800">
                Student Accounts Created
              </h2>
              <span className="text-xs bg-[#135D66]/10 text-[#003C43] font-semibold px-2 py-0.5 rounded-full">
                {studentAccounts.length} Total
              </span>
            </div>

            <Link
              to="/admin/create-student"
              className="text-xs bg-[#135D66] text-white px-3 py-1.5 rounded-lg hover:bg-[#0e4a52] transition font-medium flex items-center space-x-1"
            >
              <span>Create More Accounts</span>
              <Icons.ChevronRight />
            </Link>
          </div>

          {studentAccounts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm bg-white">
              No student accounts have been created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-200">
                    <th className="px-5 py-3">Student Info</th>
                    <th className="px-5 py-3">Username</th>
                    <th className="px-5 py-3">Email Address</th>
                    <th className="px-5 py-3">Access Password</th>
                    <th className="px-5 py-3">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {studentAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-gray-800">{account.student_name || 'Student'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{account.student_code || account.student_id}</div>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-700">{account.username}</td>
                      <td className="px-5 py-3 text-gray-500">{account.email}</td>
                      <td className="px-5 py-3">
                        <code className="px-2 py-1 bg-gray-100 rounded border border-gray-200 font-mono text-[#135D66]">
                          {account.password}
                        </code>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {account.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECTION 4: RECENT STUDENTS TABLE */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded bg-sky-50 text-sky-600">
                <Icons.Users />
              </div>
              <h2 className="text-sm font-bold text-gray-800">Recent Students Directory</h2>
              {studentsWithoutAccounts > 0 && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                  {studentsWithoutAccounts} need credentials
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRecentStudents(prev => !prev)}
                className="text-xs text-[#003C43] hover:text-[#135D66] font-semibold transition"
              >
                {showRecentStudents ? 'Hide Table' : 'Show Table'}
              </button>

              {showRecentStudents && (
                <Link
                  to="/students"
                  className="text-xs text-[#135D66] hover:underline font-semibold flex items-center space-x-0.5"
                >
                  <span>View All Students</span>
                  <Icons.ChevronRight />
                </Link>
              )}
            </div>
          </div>

          {!showRecentStudents ? (
            <div className="px-5 py-6 text-xs text-gray-500 bg-gray-50/30">
              Student table is minimized. Click <span className="font-semibold text-gray-700">"Show Table"</span> to view recent records.
            </div>
          ) : (
            recentStudents.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm bg-white">
                No students registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-200">
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">Full Name</th>
                      <th className="px-5 py-3">Standard</th>
                      <th className="px-5 py-3">Guardian</th>
                      <th className="px-5 py-3">Balance</th>
                      <th className="px-5 py-3">Enrollment</th>
                      <th className="px-5 py-3">Account Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {recentStudents.map((student, index) => (
                      <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                            {student.student_code || student.id}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-800">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-5 py-3 text-gray-600 font-medium">Std {student.current_standard}</td>
                        <td className="px-5 py-3 text-gray-500">{student.parent_name || 'N/A'}</td>
                        <td className="px-5 py-3 font-semibold">
                          {parseFloat(student.outstanding_balance || 0) > 0 ? (
                            <span className="text-rose-600">
                              MK {parseFloat(student.outstanding_balance).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Paid</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border
                            ${student.enrollment_status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : student.enrollment_status === 'Graduated' ? 'bg-[#135D66]/10 text-[#003C43] border-[#135D66]/20'
                              : student.enrollment_status === 'Transferred' ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                          >
                            {student.enrollment_status || 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {student.user_id ? (
                            <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                              <Icons.UserCheck />
                              <span>Account Ready</span>
                            </span>
                          ) : (
                            <Link
                              to="/admin/create-student"
                              className="text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-semibold transition inline-flex items-center space-x-1"
                            >
                              <span>Create Account</span>
                              <Icons.ChevronRight />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>

      </main>
    </div>
  );
};

export default AdminDashboard;