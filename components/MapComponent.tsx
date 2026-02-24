/* eslint-disable */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { PollingStation } from '@/types/data';
import L from 'leaflet';

interface MapComponentProps {
  data: PollingStation[];
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    // Delay setView to ensure map container is ready
    const timer = requestAnimationFrame(() => {
      try {
        map.setView(center, zoom);
      } catch (e) {
        console.warn("Map update skipped:", e);
      }
    });
    return () => cancelAnimationFrame(timer);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ data }: MapComponentProps) {
  const [icons, setIcons] = useState<{ [key: string]: unknown } | null>(null);
  const [selectedYear, setSelectedYear] = useState<'2021' | '2016' | '2011'>('2021');

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const createIcon = (color: 'blue' | 'red' | 'green' | 'orange') => L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      setIcons({
        blue: createIcon('blue'),
        red: createIcon('red'),
        green: createIcon('green'),
        orange: createIcon('orange')
      });
    }
  }, []);

  // Calculate center based on data
  const { center, zoom } = useMemo(() => {
    if (data && data.length > 0) {
      const validBooths = data.filter(b => b.latitude && b.longitude);
      if (validBooths.length > 0) {
        const avgLat = validBooths.reduce((sum, b) => sum + b.latitude, 0) / validBooths.length;
        const avgLon = validBooths.reduce((sum, b) => sum + b.longitude, 0) / validBooths.length;
        return { center: [avgLat, avgLon] as [number, number], zoom: 13 };
      }
    }
    return { center: [11.9416, 79.8083] as [number, number], zoom: 11 };
  }, [data]);

  // Keys that should NOT be treated as candidate parties
  const NON_CANDIDATE_KEYS = ['VOTERS', 'NOTA', 'PS_NO', 'POLLED'];
  const isCandidateKey = (key: string): boolean => {
    return !NON_CANDIDATE_KEYS.some(nonCandidate => key.startsWith(nonCandidate));
  };

  const getWinnerForYear = (booth: PollingStation, year: string) => {
    // Calculate winner for the given year from candidate data
    const electionData = year === '2021' ? booth.election2021 : year === '2016' ? booth.election2016 : booth.election2011;
    if (!electionData || !electionData.candidates) return booth.strongestParty || null;

    let winner = 'Unknown';
    let maxVotes = -1;

    Object.entries(electionData.candidates).forEach(([party, votes]) => {
      if (!isCandidateKey(party)) return; // Skip VOTERS, NOTA, PS_NO, POLLED
      const v = typeof votes === 'string' ? parseFloat(votes) : votes;
      if (!isNaN(v) && v > maxVotes) {
        maxVotes = v;
        winner = party;
      }
    });
    return winner;
  };

  const getMarkerIcon = (booth: PollingStation) => {
    if (!icons) return null;

    const winner = getWinnerForYear(booth, selectedYear);
    const party = winner?.toUpperCase();

    if (party?.includes('BJP')) return icons.orange;
    if (party?.includes('DMK')) return icons.red;
    if (party?.includes('AIADMK')) return icons.green;
    return icons.blue;
  };

  if (!icons) {
    return <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>;
  }

  const validBooths = data.filter(booth => booth.latitude && booth.longitude);

  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative">
      {/* Year Selector */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded shadow-md p-1 flex gap-1">
        {['2021', '2016', '2011'].map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year as any)}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${selectedYear === year
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            {year}
          </button>
        ))}
      </div>

      <MapContainer
        key={`${center[0]}-${center[1]}`} // FORCE REMOUNT on location change
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
        className="z-10"
        scrollWheelZoom={true}
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Assembly boundary circle */}
        {validBooths.length > 0 && (
          <Circle
            center={center}
            radius={3000}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}

        {/* Polling station markers */}
        {validBooths.map((booth, idx) => {
          const markerIcon = getMarkerIcon(booth);
          if (!markerIcon) return null;

          const electionData = selectedYear === '2021' ? booth.election2021 : selectedYear === '2016' ? booth.election2016 : booth.election2011;
          const winner = getWinnerForYear(booth, selectedYear);

          return (
            <Marker
              key={idx}
              position={[booth.latitude, booth.longitude]}
              icon={markerIcon as L.Icon}
            >
              <Popup maxWidth={300}>
                <div className="p-3">
                  <h3 className="font-bold text-sm mb-2 text-gray-800">{booth.locality}</h3>
                  <div className="text-xs text-gray-600 mb-3 border-b pb-2">
                    Station: {booth.ps_no}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Year:</span>
                      <span className="font-bold text-sm">{selectedYear}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-700">Winner:</span>
                      <span className="font-bold text-sm">{winner || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="border-t pt-2 mt-3">
                    <p className="text-xs font-semibold text-blue-700 mb-2">{selectedYear} Results (%):</p>
                    <div className="space-y-1">
                      {electionData?.candidates && Object.entries(electionData.candidates)
                        .filter(([party]) => isCandidateKey(party))
                        .map(([party, votes]) => (
                          <div key={party} className="flex justify-between">
                            <span className="text-xs text-gray-700">{party}:</span>
                            <span className="text-xs font-semibold text-blue-600">
                              {typeof votes === 'number'
                                ? (votes <= 1 ? Math.round(votes * 100) : Math.round(votes))
                                : votes}%
                            </span>
                          </div>
                        ))}
                      {!electionData?.candidates && <p className="text-xs text-gray-500">No data available</p>}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000] text-xs">
        <div className="font-bold mb-2">Party Winners ({selectedYear})</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>BJP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>DMK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>AIADMK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Others</span>
          </div>
        </div>
        <div className="border-t mt-2 pt-2">
          <div className="font-semibold">{validBooths.length} Polling Stations</div>
        </div>
      </div>
    </div>
  );
}
