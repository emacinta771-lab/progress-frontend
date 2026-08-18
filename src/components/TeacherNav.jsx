import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { title: 'Dashboard',   path: '/teacher-dashboard' },
  { title: 'Students',    path: '/my-students' },
  { title: 'Attendance',  path: '/attendance' },
  { title: 'Grades',      path: '/grades' },
  { title: 'Add Student', path: '/add-student' },
  { title: 'My Class',    path: '/my-class' },
];

/**
 * Shared top navigation bar for all teacher-facing pages.
 * Usage:  <TeacherNav />
 */
const TeacherNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Header */}
      <div className="bg-[#003C43] text-white px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
              Teacher Portal
            </h1>
            <p className="text-white/50 text-xs mt-0.5 hidden sm:block">
              Academic Year 2026
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/60 hidden md:block">{user?.first_name}</span>
            <button
              onClick={handleLogout}
              className="text-xs border border-white/30 text-white/80 hover:text-white px-3 py-1.5 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <nav className="bg-[#135D66] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center h-11 overflow-x-auto gap-0.5">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0
                ${pathname === item.path
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default TeacherNav;
