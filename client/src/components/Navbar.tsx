import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, Stethoscope, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 hover:opacity-95 transition shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-sky-200 shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="flex items-center">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Medi<span className="text-sky-600">Track</span>
              </span>
              <span className="hidden md:inline-block ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                AI Clinical Triage
              </span>
            </div>
          </Link>

          {/* Right side navigation & user status */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Current user badge */}
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 max-w-[150px] sm:max-w-none">
                {user.role === 'DOCTOR' ? (
                  <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                )}
                <div className="text-left text-xs min-w-0">
                  <p className="font-semibold text-slate-800 leading-tight truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {user.role === 'DOCTOR' ? `Doctor (${user.specialization || 'Clinical'})` : 'Patient'}
                  </p>
                </div>
              </div>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
