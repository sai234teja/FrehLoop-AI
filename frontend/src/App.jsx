import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import ImpactDashboard from './pages/ImpactDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('impact');

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'donor') setActiveTab('donor');
    else if (user.role === 'ngo') setActiveTab('ngo');
    else if (user.role === 'volunteer') setActiveTab('volunteer');
    else setActiveTab('impact');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('impact');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1">
        {!currentUser ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {activeTab === 'donor' && <DonorDashboard currentUser={currentUser} />}
            {activeTab === 'ngo' && <NgoDashboard currentUser={currentUser} />}
            {activeTab === 'volunteer' && <VolunteerDashboard currentUser={currentUser} />}
            {activeTab === 'impact' && <ImpactDashboard />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreshLoop AI • Intelligent Surplus Food Redistribution & Inspection</span>
          <span className="text-[11px] text-slate-400">
            PyTorch MobileNetV2 • EasyOCR • FastAPI • Leaflet OpenStreetMap • SQLite
          </span>
        </div>
      </footer>
    </div>
  );
}
