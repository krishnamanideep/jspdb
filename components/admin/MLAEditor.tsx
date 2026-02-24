'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Trophy } from 'lucide-react';
import { ASSEMBLIES } from '@/data/assemblies';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

interface MLA {
    id?: string;
    assemblyId: string;
    year: string;
    name: string;
    party: string;
    voteShare?: number;
    votes?: number;
    margin?: number;
    image?: string;
}

const ELECTION_YEARS = ['2021', '2016', '2011'];
const PARTIES = ['BJP', 'DMK', 'AIADMK', 'INC', 'NR Congress', 'PMK', 'VCK', 'CPI', 'CPI(M)', 'LJK', 'IND', 'Others'];

export default function MLAEditor() {
    const { user } = useAuth();
    const [assemblyId, setAssemblyId] = useState('');
    const [selectedYear, setSelectedYear] = useState('2021');
    const [mlas, setMlas] = useState<MLA[]>([]);
    const [editing, setEditing] = useState<MLA | null>(null);
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        if (assemblyId) fetchMLAs();
    }, [assemblyId]);

    const fetchMLAs = async () => {
        try {
            const q = query(collection(db, 'mlas'), where('assemblyId', '==', assemblyId));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MLA));
            setMlas(data);
        } catch (e) { console.error(e); }
    };

    const saveMLA = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            if (editing.id) {
                await updateDoc(doc(db, 'mlas', editing.id), { ...editing, assemblyId });
            } else {
                await addDoc(collection(db, 'mlas'), { ...editing, assemblyId });
            }
            setEditing(null);
            fetchMLAs();
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
        setSaving(false);
    };

    const deleteMLA = async (id: string) => {
        if (!confirm('Delete this MLA record?')) return;
        try {
            await deleteDoc(doc(db, 'mlas', id));
            fetchMLAs();
        } catch (e) { alert('Failed to delete'); }
    };

    const getPartyColor = (party: string) => {
        switch (party) {
            case 'BJP': return 'bg-orange-500';
            case 'DMK': return 'bg-red-600';
            case 'AIADMK': return 'bg-green-600';
            case 'INC': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const assemblyName = ASSEMBLIES.find(a => a.id === assemblyId)?.name || `Assembly ${assemblyId}`;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                    <Trophy className="text-yellow-500" />
                    MLA / Election Winners Editor
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
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
                    <button
                        onClick={() => setEditing({ assemblyId, year: '2021', name: '', party: 'BJP' })}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                    >
                        <Plus size={18} /> Add MLA Record
                    </button>
                </div>
            </div>

            {/* Current Assembly Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800">{assemblyName}</h3>
                <p className="text-sm text-blue-600">Managing top 3 candidates for each election year</p>
            </div>

            {/* Tabbed View by Year */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        {ELECTION_YEARS.map(year => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`flex-1 px-6 py-4 font-semibold transition-colors ${selectedYear === year
                                    ? 'bg-blue-600 text-white border-b-4 border-blue-700'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {year} Election
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {/* Add Candidate Button */}
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-gray-800">
                            Top 3 Candidates - {selectedYear}
                        </h4>
                        <button
                            onClick={() => setEditing({ assemblyId, year: selectedYear, name: '', party: 'BJP' })}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                        >
                            <Plus size={18} /> Add Candidate
                        </button>
                    </div>

                    {/* Candidates List */}
                    <div className="space-y-4">
                        {mlas
                            .filter(m => m.year === selectedYear)
                            .sort((a, b) => (b.voteShare || 0) - (a.voteShare || 0))
                            .map((mla, index) => {
                                const positionColors = [
                                    'bg-gradient-to-r from-yellow-400 to-yellow-600',
                                    'bg-gradient-to-r from-gray-300 to-gray-400',
                                    'bg-gradient-to-r from-orange-400 to-orange-600'
                                ];
                                const positionLabels = ['1st Place - Winner', '2nd Place - Runner-up', '3rd Place'];

                                return (
                                    <div
                                        key={mla.id}
                                        className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                                    >
                                        {/* Position Badge */}
                                        <div className="flex-shrink-0">
                                            <div className={`w-16 h-16 rounded-xl ${positionColors[index] || 'bg-gray-400'} flex flex-col items-center justify-center text-white shadow-lg`}>
                                                <div className="text-2xl font-bold">{index + 1}</div>
                                                <div className="text-[10px] uppercase font-bold">
                                                    {index === 0 ? 'Winner' : index === 1 ? 'Runner' : '3rd'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Candidate Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                                    {mla.image ? (
                                                        <img src={mla.image} alt={mla.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={24} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-lg">{mla.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getPartyColor(mla.party)}`}>
                                                            {mla.party}
                                                        </span>
                                                        <span className="text-sm text-gray-500">{positionLabels[index]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                {mla.voteShare && (
                                                    <div className="bg-green-50 px-3 py-2 rounded">
                                                        <div className="text-xs text-gray-600">Vote Share</div>
                                                        <div className="font-bold text-green-700">{mla.voteShare}%</div>
                                                    </div>
                                                )}
                                                {mla.votes && (
                                                    <div className="bg-blue-50 px-3 py-2 rounded">
                                                        <div className="text-xs text-gray-600">Total Votes</div>
                                                        <div className="font-bold text-blue-700">{mla.votes.toLocaleString()}</div>
                                                    </div>
                                                )}
                                                {mla.margin && (
                                                    <div className="bg-purple-50 px-3 py-2 rounded">
                                                        <div className="text-xs text-gray-600">Margin</div>
                                                        <div className="font-bold text-purple-700">{mla.margin.toLocaleString()}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setEditing(mla)}
                                                className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm flex items-center gap-2"
                                            >
                                                <Edit2 size={16} /> Edit
                                            </button>
                                            <button
                                                onClick={() => deleteMLA(mla.id!)}
                                                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm flex items-center gap-2"
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                        {/* Empty State */}
                        {mlas.filter(m => m.year === selectedYear).length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <Trophy size={48} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 mb-4">No candidates added for {selectedYear} yet</p>
                                <button
                                    onClick={() => setEditing({ assemblyId, year: selectedYear, name: '', party: 'BJP' })}
                                    className="text-blue-600 border border-blue-200 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium"
                                >
                                    + Add First Candidate
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">{editing.id ? 'Edit' : 'Add'} MLA / Winner</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Election Year</label>
                                    <select
                                        value={editing.year}
                                        onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        {ELECTION_YEARS.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Party</label>
                                    <select
                                        value={editing.party}
                                        onChange={(e) => setEditing({ ...editing, party: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        {PARTIES.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Winner Name</label>
                                <input
                                    type="text"
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="e.g., John Doe"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vote Share (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editing.voteShare || ''}
                                        onChange={(e) => setEditing({ ...editing, voteShare: parseFloat(e.target.value) || undefined })}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="26.9"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Total Votes</label>
                                    <input
                                        type="number"
                                        value={editing.votes || ''}
                                        onChange={(e) => setEditing({ ...editing, votes: parseInt(e.target.value) || undefined })}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="7588"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Victory Margin</label>
                                    <input
                                        type="number"
                                        value={editing.margin || ''}
                                        onChange={(e) => setEditing({ ...editing, margin: parseInt(e.target.value) || undefined })}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="1234"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Photo URL (optional)</label>
                                <input
                                    type="text"
                                    value={editing.image || ''}
                                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="https://example.com/photo.jpg"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={saveMLA} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
