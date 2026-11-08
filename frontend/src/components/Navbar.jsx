import React from 'react';
import { Leaf, LogOut, ShieldCheck, HeartHandshake, Truck, BarChart3, UserCheck } from 'lucide-react';

export default function Navbar({ currentUser, onLogout, activeTab, setActiveTab }) {
  const getRoleIcon = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case 'donor':
        return <Leaf className="w-4 h-4 text-emerald-500" />;
      case 'ngo':
        return <HeartHandshake className="w-4 h-4 text-blue-500" />;
      case 'volunteer':
        return <Truck className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-100">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                FreshLoop AI
              </span>
              <span className="block text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                Redistribution & Inspection
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {currentUser && currentUser.role === 'donor' && (
              <button
                onClick={() => setActiveTab('donor')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'donor'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Donor Console
              </button>
            )}

            {currentUser && currentUser.role === 'ngo' && (
              <button
                onClick={() => setActiveTab('ngo')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'ngo'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                NGO Matching
              </button>
            )}

            {currentUser && currentUser.role === 'volunteer' && (
              <button
                onClick={() => setActiveTab('volunteer')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === 'volunteer'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Deliveries & Pickup
              </button>
            )}

            <button
              onClick={() => setActiveTab('impact')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'impact'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Impact Analytics
            </button>
          </nav>

          {/* User profile & Demo status badge */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
              Demo Mode
            </span>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-right">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    {getRoleIcon()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                      {currentUser.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Log out and return to role selector"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Not Logged In
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
