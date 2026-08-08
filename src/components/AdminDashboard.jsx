import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, authAPI, credentialAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  DollarSign,
  FileText,
  AlertTriangle,
  Shirt,
  BookOpen,
  UserPlus,
  User,
  GraduationCap,
  Lock,
  BarChart3,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [studentsWithoutAccounts, setStudentsWithoutAccounts] = useState(0);
  const [studentAccounts, setStudentAccounts] = useState([]);
  const [showRecentStudents, setShowRecentStudents] = useState(false);

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

      const withoutAccounts = students.filter((s) => !s.user_id).length;
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
        total_amount_paid: statsRes.data?.stats?.total_amount_paid || 0,
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
        total_amount_paid: 0,
      });
      setRecentStudents([]);
      setStudentAccounts([]);
    } flex {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#f0f7ff]">
        <Loader2 className="w-8 h-8 text-[#003C43] animate-spin mb-3" />
        <div className="text-[#4a6fa5] font-medium text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-3 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const adminStats = [
    { title: 'Total Students', value: stats?.total_students || 0, icon: Users },
    { title: 'Active Students', value: stats?.active_students || 0, icon: UserCheck },
    { title: 'Total Revenue', value: `MK ${(stats?.total_amount_paid || 0).toLocaleString()}`, icon: DollarSign },
    { title: 'Outstanding Fees', value: `MK ${(stats?.total_outstanding_balance || 0).toLocaleString()}`, icon: FileText },
    { title: 'Financial Holds', value: stats?.financial_holds || 0, icon: AlertTriangle },
    { title: 'With Uniform', value: stats?.students_with_uniform || 0, icon: Shirt },
    { title: 'With Textbooks', value: stats?.students_with_textbooks || 0, icon: BookOpen },
    { title: 'Gender Split', value: `M: ${stats?.male_students || 0} | F: ${stats?.female_students || 0}`, icon: Users },
  ];

  const navItems = [
    { title: 'Add Student', icon: UserPlus, path: '/add-student' },
    { title: 'Create Account', icon: User, path: '/admin/create-student', highlight: true },
    { title: 'Manage Teachers', icon: GraduationCap, path: '/teachers' },
    { title: 'Manage Users', icon: Users, path: '/users' },
    { title: 'Create Accountant', icon: FileText, path: '/users', highlight: true },
    { title: 'View Reports', icon: BarChart3, path: '/reports' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-[#1a2a3a] pb-12">
      {/* Welcome Banner */}
      <div className="bg-[#003C43] text-white px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.first_name || 'Admin'}
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              Administrator Dashboard — Full access to all features.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/90">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Academic Year 2026</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-4 py-1.5 rounded-full transition-colors border border-white/20 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-[#135D66] text-white border-b border-[#0e4a52] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-1 overflow-x-auto py-2">
              {navItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                      item.highlight
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span>{item.title}</span>
                    {item.title === 'Create Account' && studentsWithoutAccounts > 0 && (
                      <span className="ml-1 bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                        {studentsWithoutAccounts}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <span className="text-xs text-white/70 hidden md:inline font-medium">
                {user?.first_name || 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {adminStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {stat.title}
                  </span>
                  <IconComponent className="w-4 h-4 text-[#135D66]" />
                </div>
                <div className="mt-2">
                  <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Student Accounts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-gray-50/80">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#135D66]" />
              <span>Student Accounts Created</span>
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                {studentAccounts.length} account{studentAccounts.length === 1 ? '' : 's'}
              </span>
            </h2>
            <Link
              to="/admin/create-student"
              className="text-xs bg-[#135D66] text-white px-3 py-1.5 rounded-lg hover:bg-[#0e4a52] transition font-medium"
            >
              Create More Accounts
            </Link>
          </div>

          {studentAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white">
              No student accounts have been created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold border-b border-gray-200">
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Username</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Password</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {studentAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-800">{account.student_name || 'Student'}</div>
                        <div className="text-xs text-gray-400 font-mono">{account.student_code || account.student_id}</div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{account.username}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{account.email}</td>
                      <td className="px-4 py-2.5">
                        <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono text-[#135D66] border border-gray-200">
                          {account.password}
                        </code>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {account.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Students Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-gray-50/80">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#135D66]" />
              <span>Recent Students</span>
              {studentsWithoutAccounts > 0 && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                  {studentsWithoutAccounts} need accounts
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRecentStudents((prev) => !prev)}
                className="text-xs text-[#003C43] hover:text-[#135D66] font-medium transition"
              >
                {showRecentStudents ? 'Hide' : 'Show'}
              </button>
              {showRecentStudents && (
                <>
                  <Link
                    to="/students"
                    className="text-xs text-[#003C43] hover:text-[#135D66] font-medium flex items-center gap-0.5 hover:underline transition"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                  {studentsWithoutAccounts > 0 && (
                    <Link
                      to="/admin/create-student"
                      className="text-xs bg-[#135D66] text-white px-3 py-1.5 rounded-lg hover:bg-[#0e4a52] transition font-medium"
                    >
                      Create Accounts
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {!showRecentStudents ? (
            <div className="px-4 py-5 text-xs text-gray-500 bg-white">
              Recent students are hidden. Click <span className="font-semibold text-gray-700">Show</span> to view details.
            </div>
          ) : recentStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-white">
              No students registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold border-b border-gray-200">
                    <th className="px-4 py-2.5">Student Code</th>
                    <th className="px-4 py-2.5">Student Name</th>
                    <th className="px-4 py-2.5">Standard</th>
                    <th className="px-4 py-2.5">Parent / Guardian</th>
                    <th className="px-4 py-2.5">Balance</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {recentStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {student.student_code || student.id}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">Std {student.current_standard}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{student.parent_name || 'N/A'}</td>
                      <td className="px-4 py-2.5 font-medium text-sm">
                        {student.outstanding_balance > 0 ? (
                          <span className="text-rose-600">MK {parseFloat(student.outstanding_balance || 0).toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-600">Paid</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block ${
                            student.enrollment_status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : student.enrollment_status === 'Graduated'
                              ? 'bg-[#135D66]/10 text-[#003C43] border border-[#135D66]/20'
                              : student.enrollment_status === 'Transferred'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {student.enrollment_status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {student.user_id ? (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" /> Has Account
                          </span>
                        ) : (
                          <Link
                            to="/admin/create-student"
                            className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-0.5 hover:underline"
                          >
                            <span>Create Account</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
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
  );
};

export default AdminDashboard;