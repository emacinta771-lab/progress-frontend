import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, authAPI, credentialAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

// ── Inline SVG icons (no emoji, no external library) ──────────────────────────
const Icon = {
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  money: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alert: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  male: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="10" cy="14" r="5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-5.2 5.2M19 5h-4m4 0v4" />
    </svg>
  ),
  book: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  shirt: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  plus: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent || 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
  </div>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    Active:      'bg-green-50 text-green-700 border-green-200',
    Graduated:   'bg-blue-50 text-blue-700 border-blue-200',
    Transferred: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Inactive:    'bg-red-50 text-red-700 border-red-200',
    Suspended:   'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status || 'Active'}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]                             = useState(null);
  const [loading, setLoading]                         = useState(true);
  const [error, setError]                             = useState(null);
  const [recentStudents, setRecentStudents]           = useState([]);
  const [studentsWithoutAccounts, setStudentsWithout] = useState(0);
  const [studentAccounts, setStudentAccounts]         = useState([]);
  const [showStudents, setShowStudents]               = useState(false);
  const [showAccounts, setShowAccounts]               = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, studentsRes, credentialsRes] = await Promise.all([
        studentAPI.getStats(),
        studentAPI.getAll(),
        credentialAPI.getAll(),
      ]);

      const students    = studentsRes.data?.students || [];
      const credentials = credentialsRes.data?.credentials || [];

      setStudentsWithout(students.filter(s => !s.user_id).length);
      setStudentAccounts(credentials);
      setRecentStudents(students.slice(0, 10));
      setStats({
        total_students:           statsRes.data?.stats?.total_students           || 0,
        active_students:          statsRes.data?.stats?.active_students          || 0,
        financial_holds:          statsRes.data?.stats?.financial_holds          || 0,
        total_outstanding_balance:statsRes.data?.stats?.total_outstanding_balance|| 0,
        students_with_uniform:    statsRes.data?.stats?.students_with_uniform    || 0,
        students_with_textbooks:  statsRes.data?.stats?.students_with_textbooks  || 0,
        male_students:            statsRes.data?.stats?.male_students            || 0,
        female_students:          statsRes.data?.stats?.female_students          || 0,
        total_amount_paid:        statsRes.data?.stats?.total_amount_paid        || 0,
      });
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#135D66] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-red-200 p-6 max-w-sm w-full text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button onClick={fetchData}
          className="px-4 py-2 bg-[#135D66] text-white rounded-lg text-sm font-medium hover:bg-[#0e4a52] transition">
          Retry
        </button>
      </div>
    </div>
  );

  const statCards = [
    { label: 'Total Students',    value: stats?.total_students ?? 0,                                         icon: Icon.users,     accent: 'bg-indigo-50 text-indigo-500' },
    { label: 'Active Students',   value: stats?.active_students ?? 0,                                        icon: Icon.check,     accent: 'bg-green-50 text-green-500' },
    { label: 'Total Revenue',     value: `MK ${(stats?.total_amount_paid || 0).toLocaleString()}`,           icon: Icon.money,     accent: 'bg-teal-50 text-teal-600' },
    { label: 'Outstanding Fees',  value: `MK ${(stats?.total_outstanding_balance || 0).toLocaleString()}`,   icon: Icon.clipboard, accent: 'bg-orange-50 text-orange-500' },
    { label: 'Financial Holds',   value: stats?.financial_holds ?? 0,                                        icon: Icon.alert,     accent: 'bg-red-50 text-red-500' },
    { label: 'With Uniform',      value: stats?.students_with_uniform ?? 0,                                  icon: Icon.shirt,     accent: 'bg-sky-50 text-sky-500' },
    { label: 'With Textbooks',    value: stats?.students_with_textbooks ?? 0,                                 icon: Icon.book,      accent: 'bg-violet-50 text-violet-500' },
    { label: 'Male / Female',     value: `${stats?.male_students ?? 0} / ${stats?.female_students ?? 0}`,   icon: Icon.male,      accent: 'bg-pink-50 text-pink-500' },
  ];

  const navItems = [
    { title: 'Add Student',      path: '/add-student' },
    { title: 'Create Account',   path: '/admin/create-student' },
    { title: 'Manage Teachers',  path: '/teachers' },
    { title: 'Manage Users',     path: '/users' },
    { title: 'View Reports',     path: '/reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Header */}
      <div className="bg-[#003C43] text-white px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate">
              Administrator Dashboard
            </h1>
            <p className="text-white/50 text-xs mt-0.5 hidden sm:block">
              Welcome back, {user?.first_name || 'Admin'} &mdash; Academic Year 2026
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/50 hidden md:block">{user?.first_name}</span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-1.5 text-xs border border-white/30 text-white/80 hover:text-white px-3 py-1.5 rounded-lg transition">
              {Icon.logout}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-[#135D66] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center h-11 gap-0.5 overflow-x-auto">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className="relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition text-white/70 hover:bg-white/10 hover:text-white shrink-0">
              {item.title}
              {item.title === 'Create Account' && studentsWithoutAccounts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {studentsWithoutAccounts}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-6">

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          ))}
        </div>

        {/* Student Accounts — collapsible */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button type="button" onClick={() => setShowAccounts(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                {Icon.lock}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Student Accounts</p>
                <p className="text-xs text-gray-400 mt-0.5">{studentAccounts.length} account{studentAccounts.length !== 1 ? 's' : ''} created</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/admin/create-student" onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#135D66] hover:bg-[#0e4a52] text-white text-xs font-semibold rounded-lg transition">
                {Icon.plus} New Account
              </Link>
              <span className={`text-gray-400 transition-transform duration-200 ${showAccounts ? 'rotate-180' : ''}`}>
                {Icon.chevronDown}
              </span>
            </div>
          </button>

          <div className={`transition-all duration-300 overflow-hidden ${showAccounts ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {studentAccounts.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400 border-t border-gray-100">
                No student accounts created yet.
              </div>
            ) : (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-2.5 text-left">Student</th>
                      <th className="px-4 py-2.5 text-left">Username</th>
                      <th className="px-4 py-2.5 text-left">Email</th>
                      <th className="px-4 py-2.5 text-left">Password</th>
                      <th className="px-4 py-2.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {studentAccounts.map(account => (
                      <tr key={account.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 text-sm">{account.student_name || 'Student'}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{account.student_code || account.student_id}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{account.username}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{account.email}</td>
                        <td className="px-4 py-3">
                          <code className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-[#135D66]">
                            {account.password}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={account.status || 'Active'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Students — collapsible */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button type="button" onClick={() => setShowStudents(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                {Icon.users}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Recent Students</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {recentStudents.length} shown
                  {studentsWithoutAccounts > 0 && (
                    <span className="ml-2 text-yellow-600 font-medium">&bull; {studentsWithoutAccounts} need accounts</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/students" onClick={e => e.stopPropagation()}
                className="text-xs text-[#135D66] hover:underline font-medium whitespace-nowrap">
                View all
              </Link>
              <span className={`text-gray-400 transition-transform duration-200 ${showStudents ? 'rotate-180' : ''}`}>
                {Icon.chevronDown}
              </span>
            </div>
          </button>

          <div className={`transition-all duration-300 overflow-hidden ${showStudents ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {recentStudents.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400 border-t border-gray-100">
                No students registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-2.5 text-left">LIN Code</th>
                      <th className="px-4 py-2.5 text-left">Name</th>
                      <th className="px-4 py-2.5 text-left">Standard</th>
                      <th className="px-4 py-2.5 text-left">Parent</th>
                      <th className="px-4 py-2.5 text-left">Balance</th>
                      <th className="px-4 py-2.5 text-left">Status</th>
                      <th className="px-4 py-2.5 text-left">Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentStudents.map((student, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            {student.lin_code || student.student_code || student.id}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">Std {student.current_standard}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{student.parent_name || '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold">
                          {student.outstanding_balance > 0
                            ? <span className="text-red-600">MK {Number(student.outstanding_balance).toLocaleString()}</span>
                            : <span className="text-green-600">Paid</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={student.enrollment_status || 'Active'} />
                        </td>
                        <td className="px-4 py-3">
                          {student.user_id
                            ? <span className="text-xs text-green-600 font-medium">Active</span>
                            : <Link to="/admin/create-student"
                                className="text-xs text-yellow-600 hover:text-yellow-800 font-medium transition">
                                Create
                              </Link>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
