import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, studentAPI } from '../services/api';
import { 
  Users, 
  UserCheck, 
  UserX, 
  GraduationCap,
  DollarSign,
  AlertCircle,
  CreditCard,
  FileText,
  PlusCircle,
  BarChart3,
  Receipt,
  BookOpen
} from 'lucide-react';

// Custom hook for phone detection with SSR support
const useIsPhone = () => {
  const getMatch = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 768px)').matches;
  };

  const [isPhone, setIsPhone] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateMatch = (event) => setIsPhone(event.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
      return () => mediaQuery.removeEventListener('change', updateMatch);
    }

    mediaQuery.addListener(updateMatch);
    return () => mediaQuery.removeListener(updateMatch);
  }, []);

  return isPhone;
};

// Enhanced Stat Card with gradient border and icon
const StatCard = ({ title, value, icon: Icon, color = 'blue', loading = false }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    teal: 'from-teal-500 to-teal-600',
  };

  const lightColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
      <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${colorClasses[color]}`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
            {title}
          </p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {loading ? (
              <span className="inline-block w-16 h-6 bg-gray-200 rounded animate-pulse" />
            ) : (
              value
            )}
          </p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-xl ${lightColors[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
};

// Modern Mobile Header with gradient and avatar
const MobileHeader = ({ title, name, fallbackName }) => (
  <div className="sticky top-0 z-20 bg-gradient-to-r from-[#003C43] to-[#135D66] text-white px-5 py-5 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        <p className="text-xs text-white/80 mt-0.5 font-light">
          Welcome back, {name || fallbackName} 👋
        </p>
      </div>
      <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold text-sm">
        {(name || fallbackName).charAt(0).toUpperCase()}
      </div>
    </div>
  </div>
);

// Quick Actions with icons and better spacing
const QuickActionsCard = ({ actions }) => {
  const iconMap = {
    'Students': Users,
    'Attendance': UserCheck,
    'Grades': GraduationCap,
    'Add Student': PlusCircle,
    'Payments': DollarSign,
    'Receipts': Receipt,
    'Reports': BarChart3,
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1 w-1 rounded-full bg-[#135D66]" />
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Quick Actions
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = iconMap[action.label] || FileText;
          return (
            <Link
              key={action.path}
              to={action.path}
              className="group bg-gradient-to-br from-[#135D66] to-[#0e4a52] hover:from-[#0e4a52] hover:to-[#0a3a40] text-white rounded-xl px-4 py-3.5 text-center transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Icon size={20} className="text-white/90 group-hover:text-white" />
                <span className="text-xs font-medium tracking-wide">
                  {action.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Mobile Shell with bottom navigation hint
const MobileShell = ({ bgClass, title, name, fallbackName, children }) => (
  <div className={`min-h-screen ${bgClass} text-gray-900 pb-28 relative`}>
    <MobileHeader title={title} name={name} fallbackName={fallbackName} />
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      {children}
    </div>
    {/* Subtle bottom indicator */}
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-3 pointer-events-none">
      <div className="h-1 w-12 bg-gray-300/50 rounded-full" />
    </div>
  </div>
);

// Teacher Mobile View with improved layout
const TeacherMobileView = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { label: 'Students', path: '/my-students' },
    { label: 'Attendance', path: '/attendance' },
    { label: 'Grades', path: '/grades' },
    { label: 'Add Student', path: '/add-student' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentRes, attendanceRes] = await Promise.all([
          studentAPI.getStats(),
          attendanceAPI.getToday(),
        ]);

        const attendance = attendanceRes.data?.attendance || [];
        const present = attendance.filter((item) => ['Present', 'Late'].includes(item.status)).length;
        const absent = attendance.filter((item) => item.status === 'Absent').length;

        setStats({
          total: studentRes.data?.stats?.total_students || 0,
          present,
          absent,
        });
      } catch {
        setStats({ total: 0, present: 0, absent: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <MobileShell
      bgClass="bg-gradient-to-b from-[#f5fbfb] to-white"
      title="📚 Teacher Dashboard"
      name={user?.first_name}
      fallbackName="Teacher"
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Total Students" 
          value={stats.total} 
          icon={Users}
          color="blue"
          loading={loading}
        />
        <StatCard 
          title="Present Today" 
          value={stats.present} 
          icon={UserCheck}
          color="green"
          loading={loading}
        />
        <StatCard 
          title="Absent Today" 
          value={stats.absent} 
          icon={UserX}
          color="red"
          loading={loading}
        />
        <StatCard 
          title="My Class" 
          value="Active" 
          icon={BookOpen}
          color="purple"
          loading={false}
        />
      </div>
      <QuickActionsCard actions={quickActions} />
    </MobileShell>
  );
};

// Accountant Mobile View with financial stats
const AccountantMobileView = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, outstanding: 0, holds: 0, students: 0 });
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { label: 'Payments', path: '/payments' },
    { label: 'Receipts', path: '/receipt-repository' },
    { label: 'Students', path: '/students' },
    { label: 'Reports', path: '/reports' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await studentAPI.getStats();
        const data = response.data?.stats || {};

        setStats({
          revenue: data.total_amount_paid || 0,
          outstanding: data.total_outstanding_balance || 0,
          holds: data.financial_holds || 0,
          students: data.total_students || 0,
        });
      } catch {
        setStats({ revenue: 0, outstanding: 0, holds: 0, students: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatCurrency = (value) => {
    return value > 0 ? `MK ${value.toLocaleString()}` : 'MK 0';
  };

  return (
    <MobileShell
      bgClass="bg-gradient-to-b from-[#f7fbff] to-white"
      title="💰 Accountant Dashboard"
      name={user?.first_name}
      fallbackName="Accountant"
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Revenue" 
          value={formatCurrency(stats.revenue)} 
          icon={DollarSign}
          color="green"
          loading={loading}
        />
        <StatCard 
          title="Outstanding" 
          value={formatCurrency(stats.outstanding)} 
          icon={AlertCircle}
          color="yellow"
          loading={loading}
        />
        <StatCard 
          title="Financial Holds" 
          value={stats.holds} 
          icon={CreditCard}
          color="red"
          loading={loading}
        />
        <StatCard 
          title="Total Students" 
          value={stats.students} 
          icon={Users}
          color="blue"
          loading={loading}
        />
      </div>
      <QuickActionsCard actions={quickActions} />
    </MobileShell>
  );
};

// Main Mobile Dashboard component
const MobileDashboard = ({ role, desktopComponent }) => {
  const { user } = useAuth();
  const isPhone = useIsPhone();

  const currentRole = useMemo(() => role || user?.role, [role, user?.role]);

  // If not on phone, render desktop version
  if (!isPhone) {
    return desktopComponent;
  }

  // Render mobile views based on role
  if (currentRole === 'teacher') {
    return <TeacherMobileView />;
  }

  if (currentRole === 'accountant') {
    return <AccountantMobileView />;
  }

  // Fallback: redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default MobileDashboard;