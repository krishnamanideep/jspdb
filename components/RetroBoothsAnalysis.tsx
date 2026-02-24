'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Star, Zap, Award, Info, TrendingUp, FileText, Map as MapIcon, Users, Target, AlertTriangle, Globe, BarChart3
} from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PollingStation, Candidate } from '@/types/data';
import { ASSEMBLIES } from '@/data/assemblies';
import { ASSEMBLY_COORDINATES, getRegionCenter } from '@/data/assemblyCoordinates';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import rawPollingData from '@/data/Form20_Localities_Pct.json';

// Dynamically import Leaflet components (client-side only)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

// Valid political parties to filter out fields like NOTA, VOTERS, etc.
const VALID_CANDIDATES = ['BJP', 'DMK', 'AIADMK', 'INC', 'NRC', 'NR Congress', 'PMK', 'VCK', 'CPI', 'CPI(M)', 'IND', 'OTHERS'];

const CARD_ICONS: Record<string, React.ComponentType<any>> = {
  star: Star,
  zap: Zap,
  award: Award,
  info: Info,
  trending: TrendingUp,
  file: FileText,
  map: MapIcon,
  users: Users,
  target: Target,
  alert: AlertTriangle
};

interface CustomCard {
  id?: string;
  assemblyId: string;
  heading: string;
  content: string;
  cardType: 'text' | 'note' | 'info';
  section: string;
  icon?: string;
  order: number;
}

interface ManualWeakBooth {
  id?: string;
  assemblyId: string;
  party: string;
  locality: string;
  score: number;
  order: number;
}

interface ManualHotspot {
  id?: string;
  assemblyId: string;
  locality: string;
  psName?: string;
  candidateName: string;
  bestPerformance: number;
  bestYear: string;
  perf2021?: number;
  perf2016?: number;
  perf2011?: number;
  order: number;
}

interface PageConfig {
  showPollingTable: boolean;
  showHeatMap: boolean;
  showWeakBooths: boolean;
  showIndependentHotspots: boolean;
  showCustomCards: boolean;
  heatMapTitle: string;
  heatMapDescription: string;
}

const defaultConfig: PageConfig = {
  showPollingTable: true,
  showHeatMap: true,
  showWeakBooths: true,
  showIndependentHotspots: true,
  showCustomCards: true,
  heatMapTitle: 'BJP vs DMK Vote Share Analysis (2021)',
  heatMapDescription: 'Visualizing booth-wise performance distribution. Each point represents a polling booth.'
};

// Keys that should NOT be treated as candidate parties
const NON_CANDIDATE_KEYS = ['VOTERS', 'NOTA', 'PS_NO', 'POLLED'];

/** Safely parse a value to a number, returning 0 for non-numeric values like "NEW_BOOTH" */
const parseNumeric = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/** Check if a key represents a real candidate (not VOTERS, NOTA, PS_NO, POLLED) */
const isCandidateKey = (key: string): boolean => {
  return !NON_CANDIDATE_KEYS.some(nonCandidate => key.startsWith(nonCandidate));
};

const processLocalPollingData = (targetAssemblyId: string | null, jsonData: Record<string, unknown[]>): PollingStation[] => {
  let allStations: PollingStation[] = [];

  Object.keys(jsonData).forEach(key => {
    if (key.startsWith('AC_') && key.endsWith('_FINAL')) {
      const acId = key.replace('AC_', '').replace('_FINAL', '');

      // Skip if specific assembly requested and doesn't match
      if (targetAssemblyId && acId !== targetAssemblyId) return;

      const entries = jsonData[key] as Record<string, unknown>[];
      const stations = entries.map((station, index) => {
        const candidates2021: Record<string, number> = {};
        const candidates2016: Record<string, number> = {};
        const candidates2011: Record<string, number> = {};

        Object.keys(station).forEach(k => {
          if (k.endsWith('_2021_pct')) {
            const candidateKey = k.replace('_2021_pct', '');
            if (isCandidateKey(candidateKey)) {
              candidates2021[candidateKey] = parseNumeric(station[k]);
            }
          } else if (k.endsWith('_2016_pct')) {
            const candidateKey = k.replace('_2016_pct', '');
            if (isCandidateKey(candidateKey)) {
              candidates2016[candidateKey] = parseNumeric(station[k]);
            }
          } else if (k.endsWith('_2011_pct')) {
            const candidateKey = k.replace('_2011_pct', '');
            if (isCandidateKey(candidateKey)) {
              candidates2011[candidateKey] = parseNumeric(station[k]);
            }
          }
        });

        return {
          id: `${acId}_${station.PS_NO_2021 || index}`,
          ac_id: acId,
          ac_name: String(station.LOCALITY_EXTRACTED ?? `AC ${acId}`),
          ps_no: String(station.PS_NO_2021 ?? index),
          ps_name: String(station.PS_NO_2021 ?? index),
          locality: String(station.LOCALITY_EXTRACTED ?? ''),
          latitude: parseNumeric(station.Latitude),
          longitude: parseNumeric(station.Longitude),
          category: String(station.TOP_SCORE_CATEGORY ?? ''),
          strongestParty: String(station.TOP_SCORE_PARTY ?? ''),
          election2021: { year: 2021, total_votes: parseNumeric(station.POLLED_2021), candidates: candidates2021 },
          election2016: { year: 2016, total_votes: parseNumeric(station.POLLED_2016), candidates: candidates2016 },
          election2011: { year: 2011, total_votes: parseNumeric(station.POLLED_2011), candidates: candidates2011 }
        };
      });
      allStations = [...allStations, ...stations];
    }
  });
  return allStations;
};

export default function RetroBoothsAnalysis({ selectedAssembly }: { selectedAssembly: string }) {
  const [data, setData] = useState<PollingStation[]>([]);
  const [allAssembliesData, setAllAssembliesData] = useState<PollingStation[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [customCards, setCustomCards] = useState<CustomCard[]>([]);
  const [pageConfig, setPageConfig] = useState<PageConfig>(defaultConfig);
  const [retroBooths, setRetroBooths] = useState<PollingStation[]>([]);
  const [weakBooths, setWeakBooths] = useState<{ [party: string]: PollingStation[] }>({});
  const [independentHotspots, setIndependentHotspots] = useState<ManualHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Heatmap-specific state
  const [activeHeatmapView, setActiveHeatmapView] = useState<'party' | 'candidate' | 'map'>('party');
  const [selectedYear, setSelectedYear] = useState<'2021' | '2016' | '2011'>('2021');
  const [selectedPartyFilter, setSelectedPartyFilter] = useState<string>('All');
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        // 1. Local Processing for Polling Data
        const assemblyData = processLocalPollingData(selectedAssembly, rawPollingData);
        const allData = processLocalPollingData(null, rawPollingData);

        setData(assemblyData);
        setAllAssembliesData(allData);

        // 2. Firestore Fetches for Dynamic Data
        const [candidatesSnap, cardsSnap] = await Promise.all([
          getDocs(query(collection(db, 'candidates'), where('assemblyId', '==', selectedAssembly))),
          getDocs(query(collection(db, 'customCards'), where('assemblyId', '==', selectedAssembly)))
        ]);

        const candidatesList = candidatesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Candidate));
        const cardsList = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CustomCard));

        setCandidates(candidatesList);
        setCustomCards(cardsList.filter(c => c.section === 'retro').sort((a, b) => (a.order || 0) - (b.order || 0)));

        setLoading(false);

      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Error loading data:', err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    loadData();
  }, [selectedAssembly]);

  // Helper function to get party color
  const getPartyColor = (party: string) => {
    const colors: Record<string, string> = {
      'BJP': '#FF6B35',
      'DMK': '#E63946',
      'AIADMK': '#06A77D',
      'INC': '#0077B6',
      'NR Congress': '#00B4D8',
      'NRC': '#00B4D8',
      'PMK': '#FFC300',
      'VCK': '#9D4EDD',
      'CPI': '#FF006E',
      'CPI(M)': '#D62828',
      'IND': '#6C757D',
      'OTHERS': '#9CA3AF',
    };
    return colors[party] || '#9CA3AF';
  };

  // Compute Weak Booths - REACTIVE to year
  const computedWeakBooths = useMemo(() => {
    if (!data.length) return {};
    const parties = ['BJP', 'DMK', 'AIADMK'];
    const weak: { [party: string]: { locality: string; score: number }[] } = {};
    const yearKey = `election${selectedYear}` as 'election2021' | 'election2016' | 'election2011';

    parties.forEach((party) => {
      weak[party] = data
        .map((b) => ({
          locality: b.locality,
          score: (b[yearKey]?.candidates[party] || 0) * 100
        }))
        .filter(b => b.score > 0)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5);
    });
    return weak;
  }, [data, selectedYear]);

  // Compute Independent Hotspots - REACTIVE to year
  const computedIndependentHotspots = useMemo(() => {
    if (!data.length) return [];
    const yearKey = `election${selectedYear}` as 'election2021' | 'election2016' | 'election2011';

    return data
      .filter((b) => (b[yearKey]?.candidates['IND'] || 0) > 0.05)
      .map((booth) => ({
        locality: booth.locality,
        psName: booth.ps_name,
        candidateName: 'Independent Candidate',
        bestPerformance: booth[yearKey]?.candidates['IND'] || 0,
        bestYear: selectedYear,
        perf2021: booth.election2021?.candidates['IND'] || 0,
        perf2016: booth.election2016?.candidates['IND'] || 0,
        perf2011: booth.election2011?.candidates['IND'] || 0,
      }))
      .sort((a, b) => b.bestPerformance - a.bestPerformance)
      .slice(0, 6);
  }, [data, selectedYear]);


  // Compute party heatmap data - BOOTH LEVEL for selected assembly
  const partyHeatmapData = useMemo(() => {
    if (!data.length) return [];

    const parties = ['BJP', 'DMK', 'AIADMK', 'INC', 'NR Congress', 'PMK', 'VCK', 'CPI', 'CPI(M)', 'IND'];
    const yearKey = `election${selectedYear}` as 'election2021' | 'election2016' | 'election2011';

    // Return booth-level data for the selected assembly
    return data.map(booth => {
      const partyShares: Record<string, number> = {};

      parties.forEach(party => {
        const voteShare = booth[yearKey]?.candidates[party] || 0;
        partyShares[party] = voteShare * 100; // Convert to percentage
      });

      return {
        boothId: booth.ps_no,
        boothName: booth.locality || `PS ${booth.ps_no}`,
        stationName: booth.ps_name,
        ...partyShares
      };
    });
  }, [data, selectedYear]);

  // Compute candidate heatmap data - BOOTH LEVEL for selected assembly
  const candidateHeatmapData = useMemo(() => {
    if (!data.length) return [];

    const yearKey = `election${selectedYear}` as 'election2021' | 'election2016' | 'election2011';

    return data.map(booth => {
      const candidates = booth[yearKey]?.candidates || {};
      const partyShares = Object.entries(candidates)
        .filter(([party]) => isCandidateKey(party))
        .map(([party, share]) => ({ party, share: (share as number) * 100 }))
        .sort((a, b) => b.share - a.share);

      const winner = partyShares[0];

      return {
        boothId: booth.ps_no,
        boothName: booth.locality || `PS ${booth.ps_no}`,
        stationName: booth.ps_name,
        winningParty: winner?.party || 'Unknown',
        voteShare: winner?.share || 0,
        topParties: partyShares.slice(0, 3),
        totalVotes: booth[yearKey]?.total_votes || 0
      };
    }).sort((a, b) => b.voteShare - a.voteShare);
  }, [data, selectedYear]);

  // Compute map marker data - BOOTH LEVEL using ACTUAL COORDINATES
  const mapMarkersData = useMemo(() => {
    if (!data.length) return [];

    const yearKey = `election${selectedYear}` as 'election2021' | 'election2016' | 'election2011';

    return data.map((booth) => {
      const candidates = booth[yearKey]?.candidates || {};
      const partyShares = Object.entries(candidates)
        .filter(([party]) => isCandidateKey(party))
        .map(([party, share]) => ({ party, share: (share as number) * 100 }))
        .filter(p => p.share > 0)
        .sort((a, b) => b.share - a.share);

      const winner = partyShares[0];

      // Use actual coordinates from data
      // Fallback to assembly center if missing (though we fixed nulls in cleaning)
      const lat = booth.latitude || ASSEMBLY_COORDINATES[selectedAssembly]?.lat || 0;
      const lng = booth.longitude || ASSEMBLY_COORDINATES[selectedAssembly]?.lng || 0;

      return {
        boothId: booth.ps_no,
        boothName: booth.locality || `PS ${booth.ps_no}`,
        stationName: booth.ps_name,
        lat,
        lng,
        winningParty: winner?.party || 'Unknown',
        voteShare: winner?.share || 0,
        topParties: partyShares.slice(0, 3),
        totalVotes: booth[yearKey]?.total_votes || 0,
        category: booth.category || 'Unknown'
      };
    }).filter(m => m.lat !== 0 && m.lng !== 0); // Filter out invalid coordinates
  }, [data, selectedYear, selectedAssembly]);



  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading booth analysis...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error loading data: {error}</div>;
  }

  if (!data.length) {
    return <div className="p-8 text-center text-gray-500">No data available for Assembly {selectedAssembly}</div>;
  }

  const heatMapData = data.map((booth) => {
    // Percentages are already 0.0-1.0, so multiply by 100 for Chart display
    return {
      x: (booth.election2021?.candidates['BJP'] || 0) * 100,
      y: (booth.election2021?.candidates['DMK'] || 0) * 100,
      locality: booth.locality,
      category: booth.category || 'Unknown',
    };
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      A: '#10b981', // Green
      B: '#3b82f6', // Blue
      C: '#f59e0b', // Amber
      D: '#ef4444', // Red
    };
    return colors[category] || '#9ca3af';
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Assembly {selectedAssembly} - Retro-Booths & Performance</h2>

      {/* Assembly-Wide Heatmaps Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="text-blue-600" size={32} />
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Booth-Wise Performance Heatmaps</h3>
            <p className="text-gray-600">Visualize party and candidate performance across all polling booths in Assembly {selectedAssembly}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Election Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as '2021' | '2016' | '2011')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="2021">2021</option>
              <option value="2016">2016</option>
              <option value="2011">2011</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Filter Party:</label>
            <select
              value={selectedPartyFilter}
              onChange={(e) => setSelectedPartyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Parties</option>
              <option value="BJP">BJP</option>
              <option value="DMK">DMK</option>
              <option value="AIADMK">AIADMK</option>
              <option value="INC">INC</option>
              <option value="NR Congress">NR Congress</option>
              <option value="PMK">PMK</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveHeatmapView('party')}
            className={`px-6 py-3 font-semibold transition-all ${activeHeatmapView === 'party'
              ? 'bg-blue-600 text-white border-b-4 border-blue-600'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              } rounded-t-lg`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={20} />
              Party Heatmap
            </div>
          </button>
          <button
            onClick={() => setActiveHeatmapView('candidate')}
            className={`px-6 py-3 font-semibold transition-all ${activeHeatmapView === 'candidate'
              ? 'bg-blue-600 text-white border-b-4 border-blue-600'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              } rounded-t-lg`}
          >
            <div className="flex items-center gap-2">
              <Users size={20} />
              Candidate Heatmap
            </div>
          </button>
          <button
            onClick={() => setActiveHeatmapView('map')}
            className={`px-6 py-3 font-semibold transition-all ${activeHeatmapView === 'map'
              ? 'bg-blue-600 text-white border-b-4 border-blue-600'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              } rounded-t-lg`}
          >
            <div className="flex items-center gap-2">
              <MapIcon size={20} />
              Geographic Map
            </div>
          </button>
        </div>

        {/* Visualization Area */}
        <div className="bg-white p-6 rounded-lg shadow-md min-h-[600px] relative" style={{ isolation: 'isolate' }}>
          {/* Party Heatmap View */}
          {activeHeatmapView === 'party' && (
            <div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">Party Performance Across All Booths ({selectedYear})</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-gray-100 px-4 py-3 text-left text-sm font-bold text-gray-700 border-b-2 border-gray-300 z-10">
                        Polling Booth
                      </th>
                      {['BJP', 'DMK', 'AIADMK', 'INC', 'NR Congress', 'PMK', 'VCK', 'CPI', 'CPI(M)', 'IND']
                        .filter(party => selectedPartyFilter === 'All' || party === selectedPartyFilter)
                        .map(party => (
                          <th key={party} className="px-4 py-3 text-center text-sm font-bold border-b-2 border-gray-300" style={{ color: getPartyColor(party) }}>
                            {party}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {partyHeatmapData.map((row: Record<string, string | number>, idx) => (
                      <tr key={row.boothId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="sticky left-0 bg-inherit px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200 z-10">
                          PS {row.boothId} - {row.boothName}
                        </td>
                        {['BJP', 'DMK', 'AIADMK', 'INC', 'NR Congress', 'PMK', 'VCK', 'CPI', 'CPI(M)', 'IND']
                          .filter(party => selectedPartyFilter === 'All' || party === selectedPartyFilter)
                          .map(party => {
                            const voteShare = row[party] as number || 0;
                            const intensity = Math.min(voteShare / 60, 1); // Normalize to 0-1 (60% = max intensity)
                            const bgColor = voteShare === 0 ? '#f3f4f6' :
                              `rgba(${voteShare > 40 ? '16, 185, 129' : voteShare > 20 ? '251, 191, 36' : '239, 68, 68'}, ${0.2 + intensity * 0.6})`;

                            return (
                              <td
                                key={party}
                                className="px-4 py-3 text-center text-sm font-semibold border-r border-gray-100 transition-all hover:scale-105 cursor-pointer"
                                style={{ backgroundColor: bgColor }}
                                title={`${party} in ${row.boothName}: ${voteShare.toFixed(2)}%`}
                              >
                                {voteShare > 0 ? `${voteShare.toFixed(1)}%` : '-'}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-6 justify-center p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">Vote Share:</span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-6 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }}></div>
                  <span className="text-sm text-gray-600">0-20%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-6 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.6)' }}></div>
                  <span className="text-sm text-gray-600">20-40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-6 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.6)' }}></div>
                  <span className="text-sm text-gray-600">40%+</span>
                </div>
              </div>
            </div>
          )}

          {/* Candidate Heatmap View */}
          {activeHeatmapView === 'candidate' && (
            <div>
              <h4 className="text-xl font-bold mb-4 text-gray-800">Booth Winners & Performance ({selectedYear})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidateHeatmapData
                  .filter((c: any) => selectedPartyFilter === 'All' || c.winningParty === selectedPartyFilter)
                  .sort((a: any, b: any) => b.voteShare - a.voteShare)
                  .map((candidate: any) => (
                    <div
                      key={`${candidate.boothId}-${candidate.winningParty}`}
                      className="p-4 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer"
                      style={{
                        borderColor: getPartyColor(candidate.winningParty),
                        backgroundColor: `${getPartyColor(candidate.winningParty)}10`
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-bold text-gray-800">{candidate.boothName}</h5>
                          <p className="text-sm text-gray-600">PS {candidate.boothId} • {candidate.stationName}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: getPartyColor(candidate.winningParty) }}>
                            {candidate.voteShare.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                          style={{ backgroundColor: getPartyColor(candidate.winningParty) }}
                        >
                          {candidate.winningParty}
                        </span>
                        <span className="text-xs text-gray-500">Winner</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Geographic Map View */}
          {activeHeatmapView === 'map' && (
            <div className="relative">
              <h4 className="text-xl font-bold mb-4 text-gray-800">Booth-Wise Geographic Distribution ({selectedYear})</h4>
              <div className="h-[600px] rounded-lg overflow-hidden border-2 border-gray-200 relative isolate">
                {typeof window !== 'undefined' && (
                  <MapContainer
                    center={[11.9345, 79.8145]}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapMarkersData
                      .filter((marker: any) => selectedPartyFilter === 'All' || marker.winningParty === selectedPartyFilter)
                      .map((marker: any) => (
                        <CircleMarker
                          key={marker.boothId}
                          center={[marker.lat, marker.lng]}
                          radius={Math.max(8, marker.voteShare / 5)}
                          fillColor={getPartyColor(marker.winningParty)}
                          color="#fff"
                          weight={2}
                          opacity={1}
                          fillOpacity={0.7}
                        >
                          <Popup>
                            <div className="p-2 min-w-[200px]">
                              <h5 className="font-bold text-lg mb-2">{marker.boothName}</h5>
                              <p className="text-sm text-gray-600 mb-3">PS {marker.boothId} • {marker.stationName}</p>
                              <p className="text-xs text-gray-500 mb-2">Category: {marker.category}</p>

                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold">Winner:</span>
                                  <span
                                    className="px-2 py-1 rounded text-white text-sm font-bold"
                                    style={{ backgroundColor: getPartyColor(marker.winningParty) }}
                                  >
                                    {marker.winningParty}
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-center" style={{ color: getPartyColor(marker.winningParty) }}>
                                  {marker.voteShare.toFixed(2)}%
                                </div>
                              </div>

                              <div className="border-t pt-2">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Top 3 Parties:</p>
                                {marker.topParties.map((p: { party: string; share: number }, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between text-sm mb-1">
                                    <span style={{ color: getPartyColor(p.party) }} className="font-semibold">
                                      {idx + 1}. {p.party}
                                    </span>
                                    <span className="font-bold">{p.share.toFixed(1)}%</span>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t pt-2 mt-2">
                                <p className="text-xs text-gray-600">
                                  Total Votes: <span className="font-semibold">{marker.totalVotes.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                  </MapContainer>
                )}
              </div>

              {/* Map Legend */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-3">Party Colors:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['BJP', 'DMK', 'AIADMK', 'INC', 'NR Congress', 'PMK', 'IND'].map(party => (
                    <div key={party} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: getPartyColor(party) }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{party}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * Marker size represents vote share percentage
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white shadow-lg">
            <p className="text-sm opacity-90">Total Booths</p>
            <p className="text-3xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white shadow-lg">
            <p className="text-sm opacity-90">Election Year</p>
            <p className="text-3xl font-bold">{selectedYear}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white shadow-lg">
            <p className="text-sm opacity-90">Active View</p>
            <p className="text-3xl font-bold capitalize">{activeHeatmapView}</p>
          </div>
        </div>
      </div>

      {/* Polling Stations Data Table */}
      {pageConfig.showPollingTable && (
        <div className="bg-white p-6 rounded-lg shadow overflow-hidden">
          <h3 className="text-xl font-semibold mb-4">Polling Stations Data ({data.length})</h3>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PS No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Locality</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Station Name</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Votes (2021)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-blue-50">Winner 2021</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Winner 2016</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Winner 2011</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...data].sort((a, b) => parseInt(a.ps_no) - parseInt(b.ps_no)).map((booth, idx) => {

                  const getWinner = (electionData: PollingStation['election2021']) => {
                    if (!electionData?.candidates) return { winner: "-", margin: "" };

                    // Filter out ALL non-candidate fields (VOTERS, NOTA, PS_NO, POLLED, OTHERS)
                    const sorted = Object.entries(electionData.candidates)
                      .filter(([party]) => isCandidateKey(party) && party !== 'OTHERS')
                      .sort(([, a], [, b]) => (b as number) - (a as number));

                    if (sorted.length > 0) {
                      const winner = sorted[0][0];
                      const winnerShare = (sorted[0][1] as number);
                      const runnerShare = sorted[1] ? (sorted[1][1] as number) : 0;

                      const wVal = winnerShare <= 1 ? winnerShare * 100 : winnerShare;
                      const rVal = runnerShare <= 1 ? runnerShare * 100 : runnerShare;

                      return {
                        winner: winner === 'NRC' ? 'NR Congress' : winner,
                        margin: (wVal - rVal).toFixed(1) + '%'
                      };
                    }
                    return { winner: "-", margin: "" };
                  };

                  const w21 = getWinner(booth.election2021);
                  const w16 = getWinner(booth.election2016);
                  const w11 = getWinner(booth.election2011);

                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">{booth.ps_no}</td>
                      <td className="px-4 py-2 text-sm text-gray-800 font-medium">{booth.locality}</td>
                      <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate" title={booth.ps_name}>{booth.ps_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{booth.election2021?.total_votes?.toLocaleString() || '-'}</td>

                      {/* 2021 */}
                      <td className="px-4 py-2 text-sm text-center bg-blue-50 border-x border-blue-100">
                        <div className="font-bold text-gray-800">{w21.winner}</div>
                        <div className="text-xs text-blue-600">+{w21.margin}</div>
                      </td>

                      {/* 2016 */}
                      <td className="px-4 py-2 text-sm text-center">
                        <div className="font-medium text-gray-700">{w16.winner}</div>
                        {w16.winner !== '-' && <div className="text-xs text-gray-500">+{w16.margin}</div>}
                      </td>

                      {/* 2011 */}
                      <td className="px-4 py-2 text-sm text-center">
                        <div className="font-medium text-gray-700">{w11.winner}</div>
                        {w11.winner !== '-' && <div className="text-xs text-gray-500">+{w11.margin}</div>}
                      </td>

                      <td className="px-4 py-2 text-sm text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white
                        ${(booth.category || 'C') === 'A' ? 'bg-green-500' :
                            (booth.category || 'C') === 'B' ? 'bg-blue-500' :
                              (booth.category || 'C') === 'C' ? 'bg-yellow-500' :
                                'bg-red-500'
                          }`}>
                          {booth.category || 'C'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heat Map Replacement: Performance Quadrant */}
      {pageConfig.showHeatMap && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">{pageConfig.heatMapTitle}</h3>
          <p className="text-sm text-gray-500 mb-6">{pageConfig.heatMapDescription}</p>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="BJP Vote %"
                unit="%"
                label={{ value: 'BJP Vote Share %', position: 'insideBottom', offset: -10 }}
                domain={[0, 100]}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="DMK Vote %"
                unit="%"
                label={{ value: 'DMK Vote Share %', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow text-xs">
                        <p className="font-bold">{data.locality}</p>
                        <p>BJP: {data.x.toFixed(1)}%</p>
                        <p>DMK: {data.y.toFixed(1)}%</p>
                        <p>Category: {data.category}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" />
              <Scatter name="Booth Category" data={heatMapData} fill="#8884d8">
                {heatMapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center">
            {['A', 'B', 'C', 'D'].map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }}></div>
                <span>Category {cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retro Booths */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Retro Booths ({retroBooths.length} booths)</h3>
        <p className="text-gray-600 mb-4">Booths with consistent strong performance for a party</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locality</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BJP 2021</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DMK 2021</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {retroBooths.slice(0, 10).map((booth, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-sm">{booth.locality}</td>
                  <td className="px-4 py-3 text-sm">{((booth.election2021?.candidates['BJP'] || 0) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm">{((booth.election2021?.candidates['DMK'] || 0) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${(booth.category || 'C') === 'A' ? 'bg-green-100 text-green-800' :
                      (booth.category || 'C') === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                      {booth.category || 'C'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weak Booths Section */}
      {pageConfig.showWeakBooths && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(computedWeakBooths).map((party) => (
            <div key={party} className="bg-white p-6 rounded-lg shadow border-t-4" style={{ borderTopColor: getPartyColor(party) }}>
              <h4 className="text-lg font-bold mb-4" style={{ color: getPartyColor(party) }}>{party === 'NRC' ? 'NR Congress' : party} - Weak Booths</h4>
              <div className="space-y-4">
                {computedWeakBooths[party].map((booth: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="font-bold text-gray-800 uppercase text-sm">{booth.locality}</p>
                    <p className="text-xs text-gray-500">Score: {booth.score.toFixed(1)}%</p>
                  </div>
                ))}
                {computedWeakBooths[party].length === 0 && (
                  <p className="text-sm text-gray-400 italic">No low performance data for this year.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Independent Hotspots Section */}
      {pageConfig.showIndependentHotspots && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Independent Candidate Hotspots</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {computedIndependentHotspots.map((hotspot, idx: number) => (
              <div key={idx} className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-100 hover:shadow-md transition-shadow">
                <div className="mb-2">
                  <h5 className="font-bold text-gray-800 uppercase">{hotspot.locality}</h5>
                  <p className="text-xs text-gray-500 truncate">{hotspot.psName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-yellow-700">Independent Candidate</p>
                  <p className="text-xs text-gray-600">Best Performance: {(hotspot.bestPerformance * 100).toFixed(1)}% ({hotspot.bestYear})</p>
                </div>
                <div className="mt-3 pt-3 border-t border-yellow-200 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500">2021</p>
                    <p className="text-xs font-bold text-gray-700">{(hotspot.perf2021 * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500">2016</p>
                    <p className="text-xs font-bold text-gray-700">{(hotspot.perf2016 * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500">2011</p>
                    <p className="text-xs font-bold text-gray-700">{(hotspot.perf2011 * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
            {computedIndependentHotspots.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-400 italic">
                No significant independent candidate performance found for {selectedYear}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Information Cards */}
      {pageConfig.showCustomCards && customCards.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Additional Information</h3>
          <div className="space-y-6">
            {customCards.sort((a, b) => (a.order || 0) - (b.order || 0)).map((card) => (
              <div
                key={card.id || card.heading}
                className={`p-6 rounded-xl border-2 transition-all hover:shadow-md ${card.cardType === 'note' ? 'bg-yellow-50 border-yellow-100' :
                  card.cardType === 'info' ? 'bg-blue-50 border-blue-100' :
                    'bg-white border-gray-100'
                  }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {card.icon && CARD_ICONS[card.icon] && (
                    <div className={`p-3 rounded-lg ${card.cardType === 'note' ? 'bg-yellow-100 text-yellow-700' : card.cardType === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {(() => {
                        const Icon = CARD_ICONS[card.icon];
                        return <Icon size={24} />;
                      })()}
                    </div>
                  )}
                  <h4 className="font-bold text-gray-900 text-xl">{card.heading}</h4>
                </div>
                <div
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: card.content }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
