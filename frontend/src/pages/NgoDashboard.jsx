import React, { useState, useEffect } from 'react';
import { fetchMatchesForNgo, updateDonationStatus } from '../services/api';
import MapView from '../components/MapView';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Navigation,
  Clock,
  AlertTriangle,
  Boxes,
  RefreshCw,
  Info
} from 'lucide-react';

export default function NgoDashboard({ currentUser }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    loadMatches();
  }, [currentUser]);

  async function loadMatches() {
    try {
      setLoading(true);
      const data = await fetchMatchesForNgo(currentUser.id);
      setMatches(data);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to load matching feed from server.');
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = async (donationId) => {
    try {
      setActionInProgress(donationId);
      await updateDonationStatus(donationId, 'Accepted', currentUser.id, null);
      await loadMatches();
      showNotification('success', 'Donation successfully claimed! Courier dispatch has been notified for pickup.');
    } catch (err) {
      console.error(err);
      showNotification('error', err.message || 'Failed to accept donation.');
    } finally {
      setActionInProgress(null);
    }
  };

  const mapLocations = matches.map((m) => ({
    latitude: m.donation.latitude,
    longitude: m.donation.longitude,
    title: m.donation.food_name,
    subtitle: `${m.score_details.distance_km} km away • Score: ${m.score_details.total_score}/100`,
    badge: `${m.score_details.total_score} pts`
  }));

  // Add NGO's own location
  if (currentUser.latitude && currentUser.longitude) {
    mapLocations.push({
      latitude: currentUser.latitude,
      longitude: currentUser.longitude,
      title: `📍 ${currentUser.organization || currentUser.name} (Your Kitchen)`,
      subtitle: 'Distribution Point',
      badge: 'Hub'
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border shadow-sm transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">NGO Smart Allocation Dispatch</h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.organization}) • Max Capacity: {currentUser.capacity_kg} kg
          </p>
        </div>
        <button
          onClick={loadMatches}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Matching Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Matches list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Ranked Surplus Opportunities ({matches.length})
            </h2>
            <span className="text-xs text-slate-500">
              Ranked dynamically by proximity, deadline urgency & capacity fit
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm animate-pulse">
              Calculating real multi-factor proximity and capacity scores...
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              No unclaimed donations available right now. Check back soon!
            </div>
          ) : (
            matches.map(({ donation, score_details }) => {
              const score = score_details.total_score;
              const isHighPriority = score >= 70;

              return (
                <div
                  key={donation.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {donation.food_name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {donation.food_category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📍 {donation.pickup_address} ({score_details.distance_km} km away)
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-xl font-extrabold ${isHighPriority ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {score}<span className="text-xs font-normal text-slate-400">/100</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Match Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Score breakdown metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Distance Weight</span>
                      <strong className="text-slate-700">{score_details.distance_score} / 35 pts</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Urgency Weight</span>
                      <strong className="text-slate-700">{score_details.urgency_score} / 25 pts</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Capacity Fit</span>
                      <strong className="text-slate-700">{score_details.capacity_score} / 20 pts</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Category Match</span>
                      <strong className={score_details.category_match ? "text-emerald-700" : "text-rose-600"}>
                        {score_details.category_score} / 15 pts
                      </strong>
                    </div>
                  </div>

                  {/* Summary & Reasoning */}
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Algorithm Notes:</strong> {score_details.recommendation_reason}
                    </div>
                  </div>

                  {/* Safety Details */}
                  {donation.safety_notes && (
                    <div className="text-xs text-amber-800 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                      ⚠️ <strong>Safety Flag:</strong> {donation.safety_notes}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-500">
                      Quantity: <strong>{donation.quantity} {donation.unit}</strong> (~{donation.estimated_kg} kg)
                      {donation.donor_name && (
                        <span className="block text-[11px] text-slate-400">Donor: {donation.donor_name}</span>
                      )}
                    </div>

                    {donation.safety_status === 'Flagged' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                        Ineligible for Claim (Safety Flagged)
                      </span>
                    ) : donation.safety_status === 'Needs Review' && !donation.human_reviewed ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                        Pending Human Safety Review
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAccept(donation.id)}
                        disabled={actionInProgress === donation.id}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {actionInProgress === donation.id ? 'Claiming...' : 'Claim & Accept Donation'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Regional Map */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Surplus Food Proximity Map</h3>
            <MapView
              locations={mapLocations}
              center={[currentUser.latitude || 17.4697, currentUser.longitude || 78.3657]}
              zoom={13}
              height="400px"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Smart Matching Transparency</h4>
            <p>
              FreshLoop evaluates 5 distinct mathematical parameters for every donation: distance (35%), shelf-life urgency (25%), kitchen capacity constraints (20%), food category preferences (15%), and real-time NGO availability (5%).
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
