import { useState } from 'react';
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

const TeacherNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderNavLink = (item, variant) => {
    const active = pathname === item.path;

    if (variant === 'desktop') {
      return (
        <Link
          key={`${item.path}-${variant}`}
          to={item.path}
          className={`
            shrink-0 flex items-center px-4 py-1.5 rounded-lg
            text-xs font-bold whitespace-nowrap transition-all duration-150
            ${active
              ? 'bg-white text-[#003C43] shadow-sm'
              : 'text-white/75 hover:bg-white/15 hover:text-white border border-transparent hover:border-white/20'
            }
          `}
        >
          {item.title}
        </Link>
      );
    }

    if (variant === 'mobile-expanded') {
      return (
        <Link
          key={`${item.path}-${variant}`}
          to={item.path}
          onClick={() => setMobileMenuOpen(false)}
          className={`
            flex items-center justify-center px-3 py-2 rounded-lg
            text-xs font-bold text-center transition-all duration-150
            ${active
              ? 'bg-white text-[#003C43] shadow-sm'
              : 'text-white/85 border border-white/20 hover:bg-white/15'
            }
          `}
        >
          {item.title}
        </Link>
      );
    }

    return (
      <Link
        key={`${item.path}-${variant}`}
        to={item.path}
        className={`
          shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap
          ${active ? 'bg-white text-[#003C43]' : 'text-white/80 bg-white/5 border border-white/15'}
        `}
      >
        {item.title}
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── Top header bar ─────────────────────────────────────────────── */}
      <div className="bg-[#003C43] text-white px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight truncate leading-tight">
              Teacher Portal
            </h1>
            <p className="text-white/45 text-[11px] mt-0.5 hidden sm:block">
              {user?.first_name} &nbsp;&mdash;&nbsp; Academic Year 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="sm:hidden shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/25 bg-white/10"
              aria-label="Toggle teacher navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <span className="text-lg leading-none">×</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold
                bg-white/10 hover:bg-white/20 border border-white/25 text-white
                px-3.5 py-1.5 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Navigation button bar ──────────────────────────────────────── */}
      <nav className="bg-[#135D66] sticky top-0 z-50 shadow-md border-b border-[#0e4a52]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="hidden sm:flex items-center gap-1 h-12 overflow-x-auto scrollbar-none">
            {NAV_ITEMS.map((item) => renderNavLink(item, 'desktop'))}
          </div>

          {mobileMenuOpen && (
            <div className="sm:hidden py-3 grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => renderNavLink(item, 'mobile-expanded'))}
            </div>
          )}

          {!mobileMenuOpen && (
            <div className="sm:hidden h-11 flex items-center overflow-x-auto gap-1 scrollbar-none">
              {NAV_ITEMS.map((item) => renderNavLink(item, 'mobile-collapsed'))}
            </div>
          )}
          <div className="sm:hidden pb-2 text-[11px] text-white/60">
            {user?.first_name ? `Logged in as ${user.first_name}` : 'Teacher account'}
          </div>
        </div>
      </nav>
    </>
  );
};

export default TeacherNav;
