'use client';

import { useState, useEffect, useMemo } from 'react';
import { Save, Edit2, Plus, Trash2, Calendar } from 'lucide-react';
import { ASSEMBLIES } from '@/data/assemblies';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

interface ElectionResults {
    candidates: { [key: string]: number };
    year: number;
    total_votes?: number;
}

interface PollingStation {
    id: string;
    ac_id: string;
    ps_no: string;
    ps_name: string;
    locality: string;
    election2009?: ElectionResults;
    election2014?: ElectionResults;
    election2019?: ElectionResults;
    election2024?: ElectionResults;
}

const ELECTION_YEARS = ['2024', '2019', '2014', '2009'];
const PARTIES = ['TDP', 'YSRCP', 'JANASENA', 'BJP', 'INC', 'PRP', 'BSP', 'LSP', 'IND', 'NOTA', 'OTHERS'];

import { useAuth } from '@/context/AuthContext';

export default function ElectionDataEditor() {
    const { user } = useAuth();
    const [assemblyId, setAssemblyId] = useState('');

    // Filter assemblies based on user access
    const accessibleAssemblies = useMemo(() => {
        if (!user) return [];
        if (user.role === 'super_admin') return ASSEMBLIES;
        if (user.role === 'admin' && user.accessibleAssemblies && user.accessibleAssemblies.length > 0) {
            return ASSEMBLIES.filter(a => user.accessibleAssemblies?.includes(a.id));
        }
        return [];
    }, [user]);

    // Set initial assembly selection
    useEffect(() => {
        if (accessibleAssemblies.length > 0) {
            if (!assemblyId || !accessibleAssemblies.find(a => a.id === assemblyId)) {
                setAssemblyId(accessibleAssemblies[0].id);
            }
        }
    }, [accessibleAssemblies, assemblyId]);
    const [stations, setStations] = useState<PollingStation[]>([]);
    const [selectedStation, setSelectedStation] = useState<PollingStation | null>(null);
    const [editingYear, setEditingYear] = useState<string | null>(null);
    const [electionForm, setElectionForm] = useState<{
        total_votes: number;
        candidates: { party: string; share: number }[];
    }>({ total_votes: 0, candidates: [] });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStations();
    }, [assemblyId]);

    const fetchStations = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'pollingStations'), where('ac_id', '==', assemblyId));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PollingStation));
            setStations(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const getElectionKey = (year: string) => {
        return `election${year}` as 'election2024' | 'election2019' | 'election2014' | 'election2009';
    };

    const startEditingYear = (station: PollingStation, year: string) => {
        setSelectedStation(station);
        setEditingYear(year);
        const key = getElectionKey(year);
        const existing = station[key];
        if (existing) {
            setElectionForm({
                total_votes: existing.total_votes || 0,
                candidates: Object.entries(existing.candidates).map(([party, share]) => ({
                    party,
                    share: share * 100 // Convert to percentage for display
                }))
            });
        } else {
            setElectionForm({
                total_votes: 0,
                candidates: [{ party: 'BJP', share: 0 }, { party: 'YSRCP', share: 0 }]
            });
        }
    };

    const addPartyRow = () => {
        setElectionForm({
            ...electionForm,
            candidates: [...electionForm.candidates, { party: '', share: 0 }]
        });
    };

    const removePartyRow = (index: number) => {
        setElectionForm({
            ...electionForm,
            candidates: electionForm.candidates.filter((_, i) => i !== index)
        });
    };

    const saveElectionData = async () => {
        if (!selectedStation || !editingYear) return;
        setSaving(true);
        try {
            const key = getElectionKey(editingYear);
            const candidatesObj: { [key: string]: number } = {};
            electionForm.candidates.forEach(c => {
                if (c.party) {
                    candidatesObj[c.party] = c.share / 100; // Convert percentage to decimal
                }
            });

            const updatedStation = {
                ...selectedStation,
                [key]: {
                    year: parseInt(editingYear),
                    total_votes: electionForm.total_votes,
                    candidates: candidatesObj
                }
            };

            const docRef = doc(db, 'pollingStations', selectedStation.id);
            await updateDoc(docRef, updatedStation);

            // Update local state
            setStations(stations.map(s => s.id === selectedStation.id ? updatedStation : s));
            setEditingYear(null);
            setSelectedStation(null);
            alert('Election data saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
        setSaving(false);
    };

    const hasElectionData = (station: PollingStation, year: string) => {
        const key = getElectionKey(year);
        const data = station[key];
        return data && data.total_votes && data.total_votes > 0;
    };

    const getTopParty = (station: PollingStation, year: string) => {
        const key = getElectionKey(year);
        const data = station[key];
        if (!data?.candidates) return null;
        const entries = Object.entries(data.candidates);
        if (entries.length === 0) return null;
        entries.sort((a, b) => b[1] - a[1]);
        return { party: entries[0][0], share: (entries[0][1] * 100).toFixed(1) };
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                    <Calendar className="text-blue-600" />
                    Election Data Editor
                </h2>
                <p className="text-gray-600 mb-4">Add or edit historical election results for each polling station.</p>
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Assembly:</label>
                    <select
                        value={assemblyId}
                        onChange={(e) => setAssemblyId(e.target.value)}
                        className="border rounded px-3 py-2 bg-white"
                    >
                        {accessibleAssemblies.map(a => (
                            <option key={a.id} value={a.id}>{a.id}. {a.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading stations...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-700">PS No</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Station Name</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-700">2024</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-700">2019</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-700">2014</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-700">2009</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stations.slice(0, 50).map(station => (
                                    <tr key={station.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{station.ps_no}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{station.ps_name}</div>
                                            <div className="text-xs text-gray-500">{station.locality}</div>
                                        </td>
                                        {ELECTION_YEARS.map(year => {
                                            const hasData = hasElectionData(station, year);
                                            const topParty = getTopParty(station, year);
                                            return (
                                                <td key={year} className="px-4 py-3 text-center">
                                                    {hasData ? (
                                                        <button
                                                            onClick={() => startEditingYear(station, year)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200"
                                                        >
                                                            <span className="font-medium">{topParty?.party}</span>
                                                            <span className="text-xs">({topParty?.share}%)</span>
                                                            <Edit2 size={12} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEditingYear(station, year)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-red-100 hover:text-red-700"
                                                        >
                                                            <Plus size={14} /> Add
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {stations.length > 50 && (
                        <div className="p-4 bg-yellow-50 text-yellow-700 text-sm">
                            Showing first 50 stations. Use search to find specific stations.
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingYear && selectedStation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-2">
                            Edit {editingYear} Election Data
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Station: {selectedStation.ps_name} (#{selectedStation.ps_no})
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Total Votes Cast</label>
                            <input
                                type="number"
                                value={electionForm.total_votes}
                                onChange={(e) => setElectionForm({ ...electionForm, total_votes: parseInt(e.target.value) || 0 })}
                                className="w-full border rounded px-3 py-2"
                                placeholder="e.g., 1500"
                            />
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium">Party Vote Shares</label>
                                <button
                                    onClick={addPartyRow}
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Party
                                </button>
                            </div>
                            <div className="space-y-2">
                                {electionForm.candidates.map((c, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <select
                                            value={c.party}
                                            onChange={(e) => {
                                                const updated = [...electionForm.candidates];
                                                updated[i].party = e.target.value;
                                                setElectionForm({ ...electionForm, candidates: updated });
                                            }}
                                            className="flex-1 border rounded px-3 py-2"
                                        >
                                            <option value="">Select Party</option>
                                            {PARTIES.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={c.share}
                                                onChange={(e) => {
                                                    const updated = [...electionForm.candidates];
                                                    updated[i].share = parseFloat(e.target.value) || 0;
                                                    setElectionForm({ ...electionForm, candidates: updated });
                                                }}
                                                className="w-24 border rounded px-3 py-2 pr-8"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-3 top-2 text-gray-400">%</span>
                                        </div>
                                        <button
                                            onClick={() => removePartyRow(i)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Total: {electionForm.candidates.reduce((sum, c) => sum + c.share, 0).toFixed(1)}%
                                {electionForm.candidates.reduce((sum, c) => sum + c.share, 0) !== 100 &&
                                    <span className="text-orange-600 ml-2">(Should be ~100%)</span>
                                }
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button
                                onClick={() => { setEditingYear(null); setSelectedStation(null); }}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveElectionData}
                                disabled={saving}
                                className="px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                                style={{ backgroundColor: '#E31E24' }}
                            >
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Election Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
