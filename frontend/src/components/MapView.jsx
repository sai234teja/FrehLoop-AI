import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix standard Leaflet default icon paths in bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom colored icons for Origin (Pickup) and Destination (NGO)
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function FitBounds({ locations, routes }) {
  const map = useMap();
  useEffect(() => {
    const points = [];
    locations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        points.push([loc.latitude, loc.longitude]);
      }
    });
    routes.forEach(route => {
      if (route.from && route.to) {
        points.push(route.from);
        points.push(route.to);
      }
    });

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [locations, routes, map]);
  return null;
}

export default function MapView({
  locations = [],
  routes = [], // Array of { from: [lat, lng], to: [lat, lng], color: string }
  center = [17.4401, 78.3489], // Default center: Gachibowli, Hyderabad (Demo Location)
  zoom = 12,
  height = '350px'
}) {
  return (
    <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }} className="border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds locations={locations} routes={routes} />

        {/* Render Route Polylines */}
        {routes.map((r, i) => (
          r.from && r.to ? (
            <Polyline
              key={`route-${i}`}
              positions={[r.from, r.to]}
              pathOptions={{
                color: r.color || '#3b82f6',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.8
              }}
            />
          ) : null
        ))}

        {/* Render Location Markers */}
        {locations.map((loc, idx) => {
          if (!loc.latitude || !loc.longitude) return null;
          let icon = new L.Icon.Default();
          if (loc.type === 'origin' || loc.type === 'pickup') icon = originIcon;
          else if (loc.type === 'destination' || loc.type === 'dropoff') icon = destIcon;

          return (
            <Marker key={idx} position={[loc.latitude, loc.longitude]} icon={icon}>
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-slate-800">{loc.title || 'Location'}</div>
                  <div className="text-slate-600 text-xs mt-1">{loc.subtitle || ''}</div>
                  {loc.badge && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                      {loc.badge}
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
