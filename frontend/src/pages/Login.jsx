import React, { useState, useEffect } from 'react';
import { fetchUsers, demoLogin } from '../services/api';
import { Utensils, HeartHandshake, Truck, ShieldAlert, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingInId, setLoggingInId] = useState(null);

  const loadDemoUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError('Cannot connect to backend API at http://127.0.0.1:8000. Ensure the FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemoUsers();
  }, []);

  const handleSelectUser = async (userId) => {
    try {
      setLoggingInId(userId);
      const user = await demoLogin(userId);
      onLoginSuccess(user);
    } catch (err) {
      alert('Could not authenticate demo user. Check server logs.');
    } finally {
      setLoggingInId(null);
    }
  };

  // Group seeded users into the 3 distinct roles required
  const donorUsers = users.filter((u) => u.role === 'donor');
  const ngoUsers = users.filter((u) => u.role === 'ngo');
  const volunteerUsers = users.filter((u) => u.role === 'volunteer');

  const roleCategories = [
    {
      role: 'donor',
      title: '1. Restaurant / Food Donor',
      description: 'Upload food photos, run MobileNetV2 category detection, EasyOCR date extraction & publish surplus donations.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: <Utensils className="w-5 h-5 text-emerald-600" />,
      accentBg: 'hover:border-emerald-500 hover:bg-emerald-50/40',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
      users: donorUsers,
    },
    {
      role: 'ngo',
      title: '2. NGO / Community Kitchen',
      description: 'View smart-matched surplus ranked by distance, urgency, capacity fit and accept/claim donations.',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <HeartHandshake className="w-5 h-5 text-blue-600" />,
      accentBg: 'hover:border-blue-500 hover:bg-blue-50/40',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      users: ngoUsers,
    },
    {
      role: 'volunteer',
      title: '3. Volunteer Courier',
      description: 'Track pickup assignments, view route maps & advance lifecycle milestones (Picked Up ➔ Delivered).',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <Truck className="w-5 h-5 text-amber-600" />,
      accentBg: 'hover:border-amber-500 hover:bg-amber-50/40',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      users: volunteerUsers,
    },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10">

        {/* Header Banner */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Hackathon MVP • Role-Based Demo Login
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            FreshLoop AI Portal
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Select one of the three verified demo roles below to launch the role-specific console and workflow.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDemoUsers}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 font-bold hover:bg-rose-100 transition shrink-0 flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm animate-pulse space-y-2">
            <div className="w-8 h-8 mx-auto border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading verified demo personas from SQLite backend...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleCategories.map((cat) => (
              <div
                key={cat.role}
                className={`flex flex-col justify-between p-6 rounded-2xl border-2 border-slate-200 bg-slate-50/50 transition-all ${cat.accentBg}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-white shadow-xs border border-slate-200">
                      {cat.icon}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                      {cat.role}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 mb-1.5">
                    {cat.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Available Persona:
                  </div>

                  {cat.users.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No personas seeded.</p>
                  ) : (
                    cat.users.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5"
                      >
                        <div className="font-bold text-xs text-slate-800">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {u.organization || u.address}
                        </div>
                        <button
                          type="button"
                          disabled={loggingInId === u.id}
                          onClick={() => handleSelectUser(u.id)}
                          className={`w-full py-2 px-3 rounded-lg text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${cat.buttonBg}`}
                        >
                          {loggingInId === u.id ? 'Authenticating...' : 'Enter Dashboard'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Notes */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>* Demo Authentication: Session state persists in SQLite without mock data.</span>
          <span>FastAPI • SQLAlchemy • PyTorch</span>
        </div>

      </div>
    </div>
  );
}
