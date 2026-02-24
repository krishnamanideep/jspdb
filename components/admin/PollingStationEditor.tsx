/* eslint-disable */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PollingStation } from '@/types/data';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Plus, Search, Edit2, Save, X, ArrowLeft, MapPin, Trash2, Database } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ASSEMBLIES } from '@/data/assemblies';
import { db } from '@/lib/firebase/client';

import { useAuth } from '@/context/AuthContext';

// Dynamic import for Map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function PollingStationEditor() {
    const { user } = useAuth();
    const [stations, setStations] = useState<PollingStation[]>([]);
    const [filtered, setFiltered] = useState<PollingStation[]>([]);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState<PollingStation | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial assembly ID - will be updated based on access
    const [assemblyId, setAssemblyId] = useState('');

    // Filter assemblies based on user access
    const accessibleAssemblies = useMemo(() => {
        if (!user) return [];
        if (user.role === 'super_admin') return ASSEMBLIES;
        if (user.role === 'admin' && user.accessibleAssemblies && user.accessibleAssemblies.length > 0) {
            return ASSEMBLIES.filter(a => user.accessibleAssemblies?.includes(a.id));
        }
        return []; // No access
    }, [user]);

    // Set initial assembly selection
    useEffect(() => {
        if (accessibleAssemblies.length > 0 && !assemblyId) {
            setAssemblyId(accessibleAssemblies[0].id);
        } else if (accessibleAssemblies.length > 0 && !accessibleAssemblies.find(a => a.id === assemblyId)) {
            // If current selection is no longer accessible, switch to first accessible
            setAssemblyId(accessibleAssemblies[0].id);
        }
    }, [accessibleAssemblies, assemblyId]);

    const getAssemblyName = (id: string) => {
        return ASSEMBLIES.find(a => a.id === id)?.name || `Assembly ${id}`;
    };

    useEffect(() => {
        setLoading(true);
        // Fetch only selected assembly stations
        const q = query(collection(db, 'pollingStations'), where('ac_id', '==', assemblyId));

        getDocs(q)
            .then(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PollingStation));
                // If data is empty, maybe fallback to JSON? For now assume DB populated.

                // Sort by PS No
                data.sort((a, b) => parseInt(a.ps_no) - parseInt(b.ps_no));

                setStations(data);
                setFiltered(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [assemblyId]);

    useEffect(() => {
        const lower = search.toLowerCase();
        setFiltered(stations.filter(s =>
            String(s.ps_name || '').toLowerCase().includes(lower) ||
            String(s.locality || '').toLowerCase().includes(lower) ||
            String(s.ps_no || '').includes(lower)
        ));
    }, [search, stations]);

    const startEditing = (station: PollingStation) => {
        setEditingId(station.id);
        setFormState({ ...station });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setFormState(null);
    };

    const handleSave = async () => {
        if (!formState) return;

        // Optimistic update
        const updated = stations.map(s => s.id === formState.id ? formState : s);
        setStations(updated);
        setFiltered(filterStations(updated, search));

        const currentId = editingId; // Capture ID

        try {
            const docRef = doc(db, 'pollingStations', formState.id);
            await setDoc(docRef, formState, { merge: true });

            setEditingId(null);
            setFormState(null);
        } catch (e) {
            alert('Failed to save changes');
            console.error(e);
        }
    };

    const handleSeedData = async () => {
        if (!confirm(`Are you sure you want to seed data for Assembly ${assemblyId}? This will overwrite existing data if any match IDs.`)) return;

        setLoading(true);
        try {
            // Dynamically import the JSON data
            const module = await import('@/data/Form20_Localities_Pct.json');
            const jsonData = module.default as any;

            const key = `AC_${assemblyId}_FINAL`;
            const stationsList = jsonData[key];

            if (!stationsList || !Array.isArray(stationsList)) {
                alert(`No data found in JSON for key: ${key}`);
                setLoading(false);
                return;
            }

            const batch = writeBatch(db);
            const newStations: PollingStation[] = [];
            let count = 0;

            for (let i = 0; i < stationsList.length; i++) {
                const item = stationsList[i];
                const psNo = (i + 1).toString();
                const id = `${assemblyId}-${psNo}`;

                const newStation: PollingStation = {
                    id: id,
                    ac_id: assemblyId,
                    ac_name: getAssemblyName(assemblyId),
                    ps_no: psNo,
                    ps_name: item.PS_NO_2021 || `Station ${psNo}`,
                    locality: item.LOCALITY_EXTRACTED || '',
                    latitude: item.Latitude || 0,
                    longitude: item.Longitude || 0,
                    category: item.TOP_SCORE_CATEGORY || 'C',
                    strongestParty: item.TOP_SCORE_PARTY || '',

                    // Add election data if needed, matching the schema
                    election2021: {
                        year: 2021,
                        candidates: {
                            BJP: item.BJP_2021_pct || 0,
                            DMK: item.DMK_2021_pct || 0,
                            NRC: item.NRC_2021_pct || 0,
                            OTHERS: item.OTHERS_2021_pct || 0
                        }
                    },
                    election2016: {
                        year: 2016,
                        candidates: {
                            NRC: item.NRC_2016_pct || 0,
                            DMK: item.DMK_2016_pct || 0,
                            AIADMK: item.AIADMK_2016_pct || 0,
                            OTHERS: item.OTHERS_2016_pct || 0
                        }
                    },
                    election2011: {
                        year: 2011,
                        candidates: {
                            NRC: item.NRC_2011_pct || 0,
                            PMK: item.PMK_2011_pct || 0,
                            IND: item.IND_2011_pct || 0,
                            OTHERS: item.OTHERS_2011_pct || 0
                        }
                    }
                };

                const docRef = doc(db, 'pollingStations', id);
                batch.set(docRef, newStation);
                newStations.push(newStation);
                count++;
            }

            await batch.commit();
            setStations(newStations);
            setFiltered(newStations);
            alert(`Successfully seeded ${count} stations for Assembly ${assemblyId}`);

        } catch (error) {
            console.error("Seeding failed:", error);
            alert("Failed to seed data. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const filterStations = (list: PollingStation[], query: string) => {
        const lower = query.toLowerCase();
        return list.filter(s =>
            s.ps_name?.toLowerCase().includes(lower) ||
            s.locality?.toLowerCase().includes(lower) ||
            s.ps_no?.toString().includes(lower)
        );
    };

    // Determine what to show on the map
    // If editing, show only the station being edited (so map centers on it)
    // OR show all, but highlight the one being edited?
    // User wants "visualize". Centering is better for editing location.
    const mapData = useMemo(() => {
        if (formState) {
            return [formState];
        }
        return filtered;
    }, [formState, filtered]);

    if (loading) return <div className="p-8 text-center">Loading Stations...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Left Panel: List or Editor */}
            <div className="w-1/2 flex flex-col border-r bg-white shadow-xl z-20">

                {/* Header */}
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    {editingId ? (
                        <div className="flex items-center gap-2">
                            <button onClick={cancelEditing} className="p-2 hover:bg-gray-200 rounded-full">
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="font-bold text-lg">{editingId === 'new' ? 'Adding New Station' : `Editing Station ${formState?.ps_no}`}</h2>
                        </div>
                    ) : (
                        <div className="relative flex-1 flex gap-2 items-center">
                            <select
                                className="border rounded-lg px-2 py-2 bg-white font-bold text-sm"
                                value={assemblyId}
                                onChange={(e) => setAssemblyId(e.target.value)}
                            >
                                {accessibleAssemblies.map(a => (
                                    <option key={a.id} value={a.id}>{a.id}. {a.name}</option>
                                ))}
                            </select>
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search stations..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setEditingId('new');
                                    setFormState({
                                        id: `ps_${Date.now()}`,
                                        ac_id: assemblyId,
                                        ac_name: getAssemblyName(assemblyId),
                                        ps_no: (stations.length + 1).toString(),
                                        ps_name: '',
                                        locality: '',
                                        category: 'B',
                                        latitude: 11.9416,
                                        longitude: 79.8083,
                                        strongestParty: 'BJP',
                                        election2021: { year: 2021, candidates: { BJP: 0, DMK: 0, AIADMK: 0, OTHERS: 0 } },
                                        election2016: { year: 2016, candidates: { BJP: 0, DMK: 0, AIADMK: 0, OTHERS: 0 } },
                                        election2011: { year: 2011, candidates: { BJP: 0, DMK: 0, AIADMK: 0, OTHERS: 0 } }
                                    });
                                }}
                                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                title="Add New Station"
                            >
                                <Plus size={20} /> <span className="hidden xl:inline">Add</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4">
                    {editingId && formState ? (
                        <div className="space-y-6 animate-in slide-in-from-left duration-200">
                            {/* Form */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Station Name</label>
                                <input className="w-full p-2 border rounded" value={formState.ps_name} onChange={e => setFormState({ ...formState, ps_name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Locality</label>
                                    <input className="w-full p-2 border rounded" value={formState.locality} onChange={e => setFormState({ ...formState, locality: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                    <select className="w-full p-2 border rounded" value={formState.category} onChange={e => setFormState({ ...formState, category: e.target.value })}>
                                        <option value="A">A (Strong)</option><option value="B">B</option><option value="C">C</option><option value="D">D (Weak)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2"><MapPin size={16} /> Location Coordinates</h3>
                                <p className="text-xs text-blue-700 mb-3">Adjusting these will update the map preview instantly.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Latitude</label>
                                        <input type="number" step="0.0001" className="w-full p-2 border rounded" value={formState.latitude} onChange={e => setFormState({ ...formState, latitude: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Longitude</label>
                                        <input type="number" step="0.0001" className="w-full p-2 border rounded" value={formState.longitude} onChange={e => setFormState({ ...formState, longitude: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Strongest Party</label>
                                <input className="w-full p-2 border rounded" value={formState.strongestParty} onChange={e => setFormState({ ...formState, strongestParty: e.target.value })} />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                                    <Save size={18} /> Save Changes
                                </button>
                                <button onClick={cancelEditing} className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Seed Data Option if Empty */}
                            {filtered.length === 0 && !loading && (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 mb-4">No stations found for this assembly.</p>
                                    <button
                                        onClick={handleSeedData}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 mx-auto"
                                    >
                                        <Database size={18} />
                                        Seed Data for {getAssemblyName(assemblyId)}
                                    </button>
                                </div>
                            )}

                            {filtered.slice(0, 50).map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => startEditing(s)}
                                    className="p-4 border rounded-lg bg-white hover:shadow-md cursor-pointer transition-all hover:border-blue-300 group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-800">{s.ps_name}</div>
                                            <div className="text-sm text-gray-500">{s.locality} • Station #{s.ps_no}</div>
                                        </div>
                                        <Edit2 size={16} className="text-gray-300 group-hover:text-blue-500" />
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded ${s.category === 'A' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                                Cat {s.category}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                                {s.strongestParty}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete station ${s.ps_no}?`)) {
                                                    deleteDoc(doc(db, 'pollingStations', s.id))
                                                        .then(() => setStations(prev => prev.filter(p => p.id !== s.id)))
                                                        .catch(err => alert('Delete failed'));
                                                }
                                            }}
                                            className="p-1 text-gray-300 hover:text-red-500 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && loading && <div className="text-center text-gray-500 py-10">Loading...</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Map Preview */}
            <div className="w-1/2 relative bg-gray-200">
                <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm text-xs font-medium text-gray-600">
                    {editingId ? 'Previewing Selection Location' : 'Viewing All Stations'}
                </div>
                <MapComponent data={mapData} />
            </div>
        </div>
    );
}
