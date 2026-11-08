import React, { useState, useEffect } from 'react';
import { fetchDonations, updateDonationStatus } from '../services/api';
import MapView from '../components/MapView';
import { Truck, CheckCircle, Package, ArrowRight, RefreshCw, AlertCircle, ExternalLink, MapPin, Building2 } from 'lucide-react';

export default function VolunteerDashboard({ currentUser }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      setLoading(true);
      // Fetch all donations to see active lifecycle stages
      const all = await fetchDonations();
      // Show accepted (ready for courier), picked up (in transit), and recently delivered
      setDonations(all);
    } catch (err) {
      console.error(err);
      showNotification('Failed to load delivery runs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (donationId, nextStatus) => {
    try {
      setUpdatingId(donationId);
      await updateDonationStatus(donationId, nextStatus, null, currentUser.id);
      showNotification(`Delivery status successfully updated to "${nextStatus}".`);
      await loadDeliveries();
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Failed to update delivery milestone.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeDeliveries = donations.filter(d => ['Accepted', 'Picked Up'].includes(d.status));
  const deliveredHistory = donations.filter(d => d.status === 'Delivered');

  // Build map markers: Both Origin (Pickup) and Destination (NGO)
  const mapLocations = [];
  const mapRoutes = [];

  activeDeliveries.forEach(d => {
    // 1. Pickup Origin Marker
    if (d.latitude && d.longitude) {
      mapLocations.push({
        latitude: d.latitude,
        longitude: d.longitude,
        title: `🟢 Pickup: ${d.donor_name || 'Donor'}`,
        subtitle: `${d.food_name} • ${d.pickup_address}`,
        badge: 'Pickup Origin',
        type: 'origin'
      });
    }

    // 2. Drop-off Destination Marker
    if (d.ngo_latitude && d.ngo_longitude) {
      mapLocations.push({
        latitude: d.ngo_latitude,
        longitude: d.ngo_longitude,
        title: `🔴 Drop-off: ${d.ngo_name || 'NGO Kitchen'}`,
        subtitle: `${d.ngo_address || 'Destination Hub'}`,
        badge: 'Drop-off Destination',
        type: 'destination'
      });
    }

    // 3. Route line connecting them
    if (d.latitude && d.longitude && d.ngo_latitude && d.ngo_longitude) {
      mapRoutes.push({
        from: [d.latitude, d.longitude],
        to: [d.ngo_latitude, d.ngo_longitude],
        color: d.status === 'Picked Up' ? '#eab308' : '#3b82f6'
      });
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Volunteer Courier Operations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <strong className="text-slate-700">{currentUser.name}</strong> • Active Rescue Transits
          </p>
        </div>
        <button
          onClick={loadDeliveries}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dispatch
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between border ${notification.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline ml-4 hover:opacity-75">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Deliveries Column */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-amber-600" />
              Active Redistribution Tasks ({activeDeliveries.length})
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500 py-6 text-center">Loading delivery tasks...</p>
            ) : activeDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No food packages currently awaiting volunteer courier pickup.
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeliveries.map((item) => {
                  const hasCoords = item.latitude && item.longitude && item.ngo_latitude && item.ngo_longitude;
                  const osmRouteUrl = hasCoords
                    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${item.latitude}%2C${item.longitude}%3B${item.ngo_latitude}%2C${item.ngo_longitude}`
                    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(item.pickup_address)}`;

                  return (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{item.food_name}</h3>
                          <span className="text-xs text-slate-500">Donation ID: #{item.id} • Category: {item.food_category}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.status === 'Accepted' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Origin & Destination Route Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="space-y-1">
                          <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                            ORIGIN (Pickup Location):
                          </span>
                          <p className="font-semibold text-slate-800 text-sm">{item.donor_name || 'Food Donor'}</p>
                          <p className="text-slate-600">{item.pickup_address}</p>
                        </div>

                        <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
                          <span className="font-bold text-blue-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                            DESTINATION (Drop-off Kitchen):
                          </span>
                          <p className="font-semibold text-slate-800 text-sm">{item.ngo_name || 'Assigned NGO Kitchen'}</p>
                          <p className="text-slate-600">{item.ngo_address || 'Address provided upon claim'}</p>
                        </div>
                      </div>

                      {/* Package details */}
                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Payload</span>
                          <strong>{item.quantity} {item.unit} ({item.estimated_kg} kg)</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Storage Requirement</span>
                          <strong>{item.storage_method}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Pickup Deadline</span>
                          <strong>{new Date(item.pickup_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        </div>
                      </div>

                      {/* Navigation action & Progress tracking controls */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <a
                            href={osmRouteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Navigation Directions (OSM)
                          </a>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {item.status === 'Accepted' && (
                            <button
                              onClick={() => handleStatusChange(item.id, 'Picked Up')}
                              disabled={updatingId === item.id}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                            >
                              {updatingId === item.id ? 'Updating...' : 'Mark Picked Up →'}
                            </button>
                          )}

                          {item.status === 'Picked Up' && (
                            <button
                              onClick={() => handleStatusChange(item.id, 'Delivered')}
                              disabled={updatingId === item.id}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {updatingId === item.id ? 'Confirming...' : 'Confirm Delivery Completed'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivered Archive */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3">Completed Rescues ({deliveredHistory.length})</h3>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 divide-y divide-slate-100">
              {deliveredHistory.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{d.food_name}</span>
                    <span className="text-slate-400 ml-2">({d.quantity} {d.unit})</span>
                  </div>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Delivered to {d.ngo_name || 'Community Pantry'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Route Map with Origin -> Destination Visual Routing */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-sm">Active Navigation Map</h3>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Demo Route Line</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Dashed line represents directional origin-to-destination corridor. Click any pin for address details.
            </p>
            <MapView
              locations={mapLocations}
              routes={mapRoutes}
              height="380px"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Courier Inspection Protocol</h4>
            <p>
              Before confirming pickup:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Check container seal integrity and temperature</li>
              <li>Verify packaging matches the app listing description</li>
              <li>Ensure transit time stays within safety windows</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
