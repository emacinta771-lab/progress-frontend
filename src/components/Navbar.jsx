import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const teacherActions = [
    { title: 'Take Attendance', icon: '📋', path: '/attendance' },
    { title: 'Add Student', icon: '➕', path: '/add-student' },
    { title: 'Enter Grades', icon: '✏️', path: '/grades' },
    { title: 'View Class', icon: '👨‍🏫', path: '/my-class' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0d9488] text-white border-b border-teal-700/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo / Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🎓</span>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-teal-100 transition">
                EduClass <span className="text-xs font-normal text-teal-200 bg-teal-800/60 px-2 py-0.5 rounded-full border border-teal-600">Portal</span>
              </span>
            </Link>
          </div>

          {/* Quick Actions Menu Bar */}
          <div className="hidden md:flex items-center space-x-1 bg-[#0f766e] px-2.5 py-1.5 rounded-full border border-teal-600/60 shadow-inner">
            <span className="text-xs font-bold text-teal-200 uppercase tracking-wider px-2 flex items-center gap-1 border-r border-teal-600/80 mr-1">
              <span>⚡</span> Actions:
            </span>
            {teacherActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white hover:bg-[#0284c7] hover:shadow-xs transition-all duration-150"
                title={action.title}
              >
                <span>{action.icon}</span>
                <span>{action.title}</span>
              </Link>
            ))}
          </div>

          {/* User Profile & Controls */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold leading-tight">
                {user?.first_name || 'Teacher'} {user?.last_name || ''}
              </span>
              <span className="text-[11px] text-teal-200">Educator</span>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/student-login');
              }}
              className="text-xs font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white px-3.5 py-1.5 rounded-full transition-colors border border-sky-400/30"
            >
              Logout
            </button>
          </div>

        </div>

        {/* Mobile Quick Actions Scrollable Ribbon */}
        <div className="md:hidden flex items-center space-x-2 py-2 overflow-x-auto border-t border-teal-700/50 scrollbar-none">
          <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider shrink-0 flex items-center gap-1">
            ⚡ Quick:
          </span>
          {teacherActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#0f766e] hover:bg-[#0284c7] text-white whitespace-nowrap shrink-0 border border-teal-600/40"
            >
              <span>{action.icon}</span>
              <span>{action.title}</span>
            </Link>
          ))}
        </div>

      </div>
    </header>
  );
};

export default Navbar;