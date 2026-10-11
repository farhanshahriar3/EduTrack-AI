import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Database, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();

  const getBreadcrumbs = () => {
    const path = location.pathname.split('/').filter(Boolean);
    if (path.length === 0) return ['Dashboard'];
    return path.map((segment) => {
      if (segment === 'ml-insights') return 'ML Support Insights';
      if (segment === 'students') return 'Students';
      if (segment === 'courses') return 'Courses & Terms';
      if (segment === 'grades') return 'Grade Management';
      if (segment === 'analytics') return 'Academic Analytics';
      if (segment === 'users') return 'User Management';
      if (segment === 'settings') return 'Grading Policy';
      if (segment === 'audit-logs') return 'Audit Logs';
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-8">
      {/* Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <button aria-label="Open navigation" onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/dashboard" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">
          EduTrack
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span
              className={`font-semibold ${
                idx === breadcrumbs.length - 1 ? 'text-slate-900' : 'text-slate-500'
              } truncate max-w-[10rem] sm:max-w-none`}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right Action Pill */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Active</span>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 lg:flex">
          <Database className="h-3.5 w-3.5 text-slate-400" />
          <span>Live university data</span>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name}</p>
          <p className="text-[10px] text-slate-500 capitalize">{user?.role?.toLowerCase()} Account</p>
        </div>
      </div>
    </header>
  );
};
