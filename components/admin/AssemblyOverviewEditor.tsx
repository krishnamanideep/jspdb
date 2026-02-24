'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, RefreshCw, Eye, ChevronUp, ChevronDown, BarChart3 } from 'lucide-react';
import { ASSEMBLIES } from '@/data/assemblies';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

// Dynamic import for live preview
const AssemblyOverview = dynamic(() => import('@/components/AssemblyOverview'), { ssr: false });

interface PartyConfig {
    assemblyId: string;
    selectedParties: string[];
}

// Common parties in the data
const AVAILABLE_PARTIES = [
    'BJP',
    'DMK',
    'AIADMK',
    'NRC',
    'PMK',
    'IND',
    'OTHERS',
    'INC',
    'NOTA'
];

export default function AssemblyOverviewEditor() {
    const { user } = useAuth();
    const [assemblyId, setAssemblyId] = useState('');
    const [config, setConfig] = useState<PartyConfig>({
        assemblyId: '',
        selectedParties: []
    });

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
                setConfig(prev => ({ ...prev, assemblyId: accessibleAssemblies[0].id }));
            }
        }
    }, [accessibleAssemblies, assemblyId]);
    const [saving, setSaving] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);

    useEffect(() => {
        fetchConfig();
    }, [assemblyId]);

    const fetchConfig = async () => {
        try {
            const docRef = doc(db, 'pageConfig', `assemblyOverview_${assemblyId}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setConfig({
                    assemblyId,
                    selectedParties: data.selectedParties || []
                });
            } else {
                // Default: top 5 parties
                setConfig({
                    assemblyId,
                    selectedParties: ['BJP', 'DMK', 'AIADMK', 'NRC', 'PMK']
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'pageConfig', `assemblyOverview_${assemblyId}`), config);
            refreshPreview();
            alert('Configuration saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save configuration');
        }
        setSaving(false);
    };

    const refreshPreview = useCallback(() => {
        setPreviewKey(prev => prev + 1);
    }, []);

    const toggleParty = (party: string) => {
        const isSelected = config.selectedParties.includes(party);
        if (isSelected) {
            setConfig({
                ...config,
                selectedParties: config.selectedParties.filter(p => p !== party)
            });
        } else {
            setConfig({
                ...config,
                selectedParties: [...config.selectedParties, party]
            });
        }
    };

    const moveParty = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= config.selectedParties.length) return;

        const updated = [...config.selectedParties];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setConfig({ ...config, selectedParties: updated });
    };

    const assemblyName = ASSEMBLIES.find(a => a.id === assemblyId)?.name || `Assembly ${assemblyId}`;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Panel - Editor */}
            <div className="w-1/2 flex flex-col border-r bg-white overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BarChart3 size={24} />
                        Assembly Overview Editor
                    </h2>
                    <p className="text-sm opacity-80 mt-1">Configure party vote share graph</p>
                </div>

                {/* Assembly Selector */}
                <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium">Assembly:</label>
                        <select
                            value={assemblyId}
                            onChange={(e) => {
                                setAssemblyId(e.target.value);
                                setConfig(prev => ({ ...prev, assemblyId: e.target.value }));
                            }}
                            className="border rounded px-3 py-2 bg-white flex-1"
                        >
                            {accessibleAssemblies.map(a => (
                                <option key={a.id} value={a.id}>{a.id}. {a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Select which parties to display in the vote share graph</li>
                                <li>• Use ↑↓ buttons to reorder parties</li>
                                <li>• Changes are reflected in the live preview</li>
                                <li>• Click "Save All" to apply changes</li>
                            </ul>
                        </div>

                        {/* Party Selection */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold mb-3">Available Parties</h3>
                            <div className="space-y-2">
                                {AVAILABLE_PARTIES.map(party => (
                                    <label
                                        key={party}
                                        className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={config.selectedParties.includes(party)}
                                            onChange={() => toggleParty(party)}
                                            className="w-5 h-5 rounded"
                                        />
                                        <span className="font-medium">{party}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Selected Parties Order */}
                        {config.selectedParties.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold mb-3">
                                    Selected Parties ({config.selectedParties.length})
                                </h3>
                                <p className="text-xs text-gray-600 mb-3">
                                    Parties will appear in this order on the graph
                                </p>
                                <div className="space-y-2">
                                    {config.selectedParties.map((party, index) => (
                                        <div
                                            key={party}
                                            className="flex items-center justify-between p-3 bg-white border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                                                <span className="font-medium">{party}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => moveParty(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Move up"
                                                >
                                                    <ChevronUp size={18} />
                                                </button>
                                                <button
                                                    onClick={() => moveParty(index, 'down')}
                                                    disabled={index === config.selectedParties.length - 1}
                                                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Move down"
                                                >
                                                    <ChevronDown size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {config.selectedParties.length === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ No parties selected. The graph will show the top 5 parties by default.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-between">
                    <button
                        onClick={refreshPreview}
                        className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-white"
                    >
                        <RefreshCw size={16} />
                        Refresh Preview
                    </button>
                    <button
                        onClick={saveConfig}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save All'}
                    </button>
                </div>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="w-1/2 flex flex-col bg-gray-200 overflow-hidden">
                <div className="p-3 bg-gray-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Eye size={18} />
                        <span className="font-medium">Live Preview</span>
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{assemblyName}</span>
                    </div>
                    <button onClick={refreshPreview} className="p-1 hover:bg-gray-700 rounded">
                        <RefreshCw size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-100">
                    <AssemblyOverview key={previewKey} selectedAssembly={assemblyId} />
                </div>
            </div>
        </div>
    );
}
