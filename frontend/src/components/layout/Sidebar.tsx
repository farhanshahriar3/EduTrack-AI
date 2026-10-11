import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  Award,
  BarChart3,
  BrainCircuit,
  ShieldCheck,
  Sliders,
  History,
  LogOut,
  ChevronRight,
  Sparkles
  , UserCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <>
      {isOpen && <button aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/60 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-transform duration-200 md:static md:z-auto md:min-h-screen md:w-64 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-base tracking-tight text-white">EduTrack</h1>
            <span className="flex items-center gap-0.5 rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Academic Intelligence</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav onClick={onClose} className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {/* Core Operations */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Core Operations
          </p>
          <div className="mt-2 space-y-1">
            <NavLink to="/dashboard" className={navItemClass}>
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/profile" className={navItemClass}>
              <UserCircle className="h-4 w-4" />
              <span>My Profile</span>
            </NavLink>

            <NavLink to="/students" className={navItemClass}>
              <Users className="h-4 w-4" />
              <span>Student Directory</span>
            </NavLink>

            {isAdmin && (
              <NavLink to="/students/new" className={navItemClass}>
                <UserPlus className="h-4 w-4" />
                <span>Add Student</span>
              </NavLink>
            )}

            <NavLink to="/courses" className={navItemClass}>
              <BookOpen className="h-4 w-4" />
              <span>Courses & Terms</span>
            </NavLink>

            {(isAdmin || isTeacher) && (
              <NavLink to="/grades" className={navItemClass}>
                <Award className="h-4 w-4" />
                <span>Grade Management</span>
              </NavLink>
            )}
          </div>
        </div>

        {/* Intelligence & Analytics */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Analytics & ML
          </p>
          <div className="mt-2 space-y-1">
            {(isAdmin || isTeacher) && (
              <NavLink to="/analytics" className={navItemClass}>
                <BarChart3 className="h-4 w-4" />
                <span>Academic Analytics</span>
              </NavLink>
            )}

            <NavLink to="/ml-insights" className={navItemClass}>
              <BrainCircuit className="h-4 w-4 text-sky-400" />
              <div className="flex items-center justify-between w-full">
                <span>Support Insights</span>
                <span className="rounded bg-sky-400/20 px-1.5 py-0.2 text-[10px] font-semibold text-sky-300">
                  ML
                </span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Governance & Administration */}
        {isAdmin && (
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Administration
            </p>
            <div className="mt-2 space-y-1">
              <NavLink to="/users" className={navItemClass}>
                <ShieldCheck className="h-4 w-4" />
                <span>User Management</span>
              </NavLink>

              <NavLink to="/settings" className={navItemClass}>
                <Sliders className="h-4 w-4" />
                <span>Grading Policy</span>
              </NavLink>

              <NavLink to="/audit-logs" className={navItemClass}>
                <History className="h-4 w-4" />
                <span>Audit Logs</span>
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
              {user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'User'}</p>
              <span className="inline-block rounded-xs bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-850 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
};
