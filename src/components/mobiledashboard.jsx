import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, studentAPI } from '../services/api';

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

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
    <p className="text-[11px] uppercase tracking-wide text-gray-500">{title}</p>
    <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

const MobileHeader = ({ title, name, fallbackName }) => (
  <div className="sticky top-0 z-20 bg-[#003C43] text-white px-4 py-4 shadow">
    <h1 className="text-base font-bold">{title}</h1>
    <p className="text-xs text-white/70 mt-0.5">Hello, {name || fallbackName}</p>
  </div>
);

const QuickActionsCard = ({ actions }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm">
    <p className="text-xs font-semibold text-gray-700 mb-3">Quick Actions</p>
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => (
        <Link
          key={action.path}
          to={action.path}
          className="bg-[#135D66] text-white text-xs font-semibold rounded-lg px-3 py-2.5 text-center"
        >
          {action.label}
        </Link>
      ))}
    </div>
  </div>
);

const MobileShell = ({ bgClass, title, name, fallbackName, children }) => (
  <div className={`min-h-screen ${bgClass} text-gray-900 pb-24`}>
    <MobileHeader title={title} name={name} fallbackName={fallbackName} />
    <div className="px-4 py-4 space-y-4">{children}</div>
  </div>
);

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
      bgClass="bg-[#f5fbfb]"
      title="Teacher Dashboard"
      name={user?.first_name}
      fallbackName="Teacher"
    >
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard title="Students" value={loading ? '...' : stats.total} />
        <StatCard title="Present" value={loading ? '...' : stats.present} />
        <StatCard title="Absent" value={loading ? '...' : stats.absent} />
        <StatCard title="Class" value="My Class" />
      </div>
      <QuickActionsCard actions={quickActions} />
    </MobileShell>
  );
};

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

  return (
    <MobileShell
      bgClass="bg-[#f7fbff]"
      title="Accountant Dashboard"
      name={user?.first_name}
      fallbackName="Accountant"
    >
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard title="Revenue" value={loading ? '...' : `MK ${stats.revenue.toLocaleString()}`} />
        <StatCard title="Outstanding" value={loading ? '...' : `MK ${stats.outstanding.toLocaleString()}`} />
        <StatCard title="Holds" value={loading ? '...' : stats.holds} />
        <StatCard title="Students" value={loading ? '...' : stats.students} />
      </div>
      <QuickActionsCard actions={quickActions} />
    </MobileShell>
  );
};

const MobileDashboard = ({ role, desktopComponent }) => {
  const { user } = useAuth();
  const isPhone = useIsPhone();

  const currentRole = useMemo(() => role || user?.role, [role, user?.role]);

  if (!isPhone) {
    return desktopComponent;
  }

  if (currentRole === 'teacher') {
    return <TeacherMobileView />;
  }

  if (currentRole === 'accountant') {
    return <AccountantMobileView />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default MobileDashboard;
