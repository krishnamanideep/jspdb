'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit2, Trash2, Save, Settings, FileText, AlertTriangle, MapPin, Eye, RefreshCw, Star, Zap, Award, Info, TrendingUp, Map, Users, Target } from 'lucide-react';
import RetroBoothsAnalysis from '../RetroBoothsAnalysis';
import { ASSEMBLIES } from '@/data/assemblies';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';

const CARD_ICONS = [
    { id: 'star', icon: Star, label: 'Star' },
    { id: 'zap', icon: Zap, label: 'Zap' },
    { id: 'award', icon: Award, label: 'Award' },
    { id: 'info', icon: Info, label: 'Info' },
    { id: 'trending', icon: TrendingUp, label: 'Trend' },
    { id: 'file', icon: FileText, label: 'File' },
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'target', icon: Target, label: 'Target' },
    { id: 'alert', icon: AlertTriangle, label: 'Alert' },
];

interface CustomCard {
    id?: string;
    assemblyId: string;
    heading: string;
    content: string;
    cardType: 'text' | 'note' | 'info';
    section: 'overview' | 'retro' | 'politicalhistory' | 'survey';
    icon?: string;
    order: number;
}

interface WeakBooth {
    id?: string;
    assemblyId: string;
    party: string;
    locality: string;
    psNo?: string;
    score: number;
    notes?: string;
    order: number;
}

interface IndependentHotspot {
    id?: string;
    assemblyId: string;
    locality: string;
    psNo?: string;
    psName?: string;
    candidateName: string;
    bestPerformance: number;
    bestYear: string;
    perf2021?: number;
    perf2016?: number;
    perf2011?: number;
    notes?: string;
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

type ActiveTab = 'config' | 'cards' | 'weakBooths' | 'hotspots';

export default function RetroBoothsEditor() {
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
    const [activeTab, setActiveTab] = useState<ActiveTab>('config');
    const [saving, setSaving] = useState(false);
    const [previewKey, setPreviewKey] = useState(0); // Key to force preview refresh

    // Page Config State
    const [config, setConfig] = useState<PageConfig>({
        showPollingTable: true,
        showHeatMap: true,
        showWeakBooths: true,
        showIndependentHotspots: true,
        showCustomCards: true,
        heatMapTitle: 'BJP vs DMK Vote Share Analysis (2021)',
        heatMapDescription: 'Visualizing booth-wise performance distribution.'
    });

    // Custom Cards State
    const [cards, setCards] = useState<CustomCard[]>([]);
    const [editingCard, setEditingCard] = useState<CustomCard | null>(null);

    // Weak Booths State
    const [weakBooths, setWeakBooths] = useState<WeakBooth[]>([]);
    const [editingWeakBooth, setEditingWeakBooth] = useState<WeakBooth | null>(null);

    // Independent Hotspots State
    const [hotspots, setHotspots] = useState<IndependentHotspot[]>([]);
    const [editingHotspot, setEditingHotspot] = useState<IndependentHotspot | null>(null);

    // Fetch all data on assembly change
    useEffect(() => {
        fetchConfig();
        fetchCards();
        fetchWeakBooths();
        fetchHotspots();
    }, [assemblyId]);

    // Refresh preview after data changes
    const refreshPreview = () => setPreviewKey(prev => prev + 1);

    // API calls
    const fetchConfig = async () => {
        try {
            const docRef = doc(db, 'pageConfig', `retrobooths_${assemblyId}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setConfig({
                    showPollingTable: data.showPollingTable ?? true,
                    showHeatMap: data.showHeatMap ?? true,
                    showWeakBooths: data.showWeakBooths ?? true,
                    showIndependentHotspots: data.showIndependentHotspots ?? true,
                    showCustomCards: data.showCustomCards ?? true,
                    heatMapTitle: data.heatMapTitle || 'BJP vs DMK Vote Share Analysis (2021)',
                    heatMapDescription: data.heatMapDescription || 'Visualizing booth-wise performance distribution.'
                });
            }
        } catch (e) { console.error(e); }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'pageConfig', `retrobooths_${assemblyId}`), {
                ...config,
                assemblyId,
                pageType: 'retrobooths'
            });
            alert('Configuration saved!');
            refreshPreview();
        } catch (e) {
            console.error(e);
            alert('Failed to save configuration');
        }
        setSaving(false);
    };

    const fetchCards = async () => {
        try {
            const q = query(
                collection(db, 'customCards'),
                where('assemblyId', '==', assemblyId),
                where('section', '==', 'retro')
            );
            const snapshot = await getDocs(q);
            const cardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomCard));
            const sorted = cardsData.sort((a, b) => (a.order || 0) - (b.order || 0));
            setCards(sorted);
        } catch (e) { console.error(e); }
    };

    const saveCard = async () => {
        if (!editingCard) return;
        setSaving(true);
        try {
            const payload = { ...editingCard, assemblyId, section: 'retro' };
            if (editingCard.id) {
                await updateDoc(doc(db, 'customCards', editingCard.id), payload);
            } else {
                await addDoc(collection(db, 'customCards'), payload);
            }
            setEditingCard(null);
            fetchCards();
            refreshPreview();
        } catch (e) {
            console.error(e);
            alert('Failed to save card');
        }
        setSaving(false);
    };

    const deleteCard = async (id: string) => {
        if (!confirm('Delete this card?')) return;
        try {
            await deleteDoc(doc(db, 'customCards', id));
            fetchCards();
            refreshPreview();
        } catch (e) { alert('Failed to delete'); }
    };

    const fetchWeakBooths = async () => {
        try {
            const q = query(
                collection(db, 'weakBooths'),
                where('assemblyId', '==', assemblyId)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeakBooth));
            const sorted = data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setWeakBooths(sorted);
        } catch (e) { console.error(e); }
    };

    const saveWeakBooth = async () => {
        if (!editingWeakBooth) return;
        setSaving(true);
        try {
            const payload = { ...editingWeakBooth, assemblyId };
            if (editingWeakBooth.id) {
                await updateDoc(doc(db, 'weakBooths', editingWeakBooth.id), payload);
            } else {
                await addDoc(collection(db, 'weakBooths'), payload);
            }
            setEditingWeakBooth(null);
            fetchWeakBooths();
            refreshPreview();
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
        setSaving(false);
    };

    const deleteWeakBooth = async (id: string) => {
        if (!confirm('Delete this entry?')) return;
        try {
            await deleteDoc(doc(db, 'weakBooths', id));
            fetchWeakBooths();
            refreshPreview();
        } catch (e) { alert('Failed to delete'); }
    };

    const fetchHotspots = async () => {
        try {
            const q = query(
                collection(db, 'independentHotspots'),
                where('assemblyId', '==', assemblyId)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IndependentHotspot));
            const sorted = data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setHotspots(sorted);
        } catch (e) { console.error(e); }
    };

    const saveHotspot = async () => {
        if (!editingHotspot) return;
        setSaving(true);
        try {
            const payload = { ...editingHotspot, assemblyId };
            if (editingHotspot.id) {
                await updateDoc(doc(db, 'independentHotspots', editingHotspot.id), payload);
            } else {
                await addDoc(collection(db, 'independentHotspots'), payload);
            }
            setEditingHotspot(null);
            fetchHotspots();
            refreshPreview();
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
        setSaving(false);
    };

    const deleteHotspot = async (id: string) => {
        if (!confirm('Delete this hotspot?')) return;
        try {
            await deleteDoc(doc(db, 'independentHotspots', id));
            fetchHotspots();
            refreshPreview();
        } catch (e) { alert('Failed to delete'); }
    };

    const tabs = [
        { id: 'config' as const, label: 'Page Settings', icon: Settings },
        { id: 'cards' as const, label: 'Custom Cards', icon: FileText },
        { id: 'weakBooths' as const, label: 'Weak Booths', icon: AlertTriangle },
        { id: 'hotspots' as const, label: 'Independent Hotspots', icon: MapPin },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Left Panel - Editor */}
            <div className="w-1/2 overflow-auto p-6 border-r">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Retro Booths Page Editor</h2>
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

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm p-6 border">
                    {/* Page Settings Tab */}
                    {activeTab === 'config' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold border-b pb-2">Section Visibility</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'showPollingTable', label: 'Show Polling Stations Table' },
                                    { key: 'showHeatMap', label: 'Show Heat Map Chart' },
                                    { key: 'showWeakBooths', label: 'Show Weak Booths Analysis' },
                                    { key: 'showIndependentHotspots', label: 'Show Independent Hotspots' },
                                    { key: 'showCustomCards', label: 'Show Custom Information Cards' },
                                ].map(item => (
                                    <label key={item.key} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config[item.key as keyof PageConfig] as boolean}
                                            onChange={(e) => setConfig({ ...config, [item.key]: e.target.checked })}
                                            className="w-5 h-5"
                                        />
                                        <span>{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <h3 className="text-lg font-semibold border-b pb-2 mt-8">Heat Map Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Chart Title</label>
                                    <input
                                        type="text"
                                        value={config.heatMapTitle}
                                        onChange={(e) => setConfig({ ...config, heatMapTitle: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={config.heatMapDescription}
                                        onChange={(e) => setConfig({ ...config, heatMapDescription: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={saveConfig}
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    )}

                    {/* Custom Cards Tab */}
                    {activeTab === 'cards' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Custom Cards ({cards.length})</h3>
                                <button
                                    onClick={() => setEditingCard({ assemblyId, heading: '', content: '', cardType: 'text', section: 'retro', order: cards.length + 1 })}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                                >
                                    <Plus size={18} /> Add Card
                                </button>
                            </div>

                            <div className="space-y-3">
                                {cards.map(card => (
                                    <div key={card.id} className="flex items-start justify-between p-4 border rounded-lg bg-gray-50">
                                        <div className="flex-1">
                                            <div className="font-medium">{card.heading}</div>
                                            <div className="text-sm text-gray-600 mt-1 truncate max-w-md">{card.content}</div>
                                            <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${card.cardType === 'note' ? 'bg-yellow-100 text-yellow-800' :
                                                card.cardType === 'info' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                                                }`}>{card.cardType}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingCard(card)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18} /></button>
                                            <button onClick={() => deleteCard(card.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                                {cards.length === 0 && <p className="text-gray-500 text-center py-8">No cards yet. Add your first card!</p>}
                            </div>

                        </div>
                    )}

                    {/* Weak Booths Tab */}
                    {activeTab === 'weakBooths' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Weak Booths ({weakBooths.length})</h3>
                                <button
                                    onClick={() => setEditingWeakBooth({ assemblyId, party: 'BJP', locality: '', score: 0, order: weakBooths.length + 1 })}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                                >
                                    <Plus size={18} /> Add Entry
                                </button>
                            </div>

                            <div className="space-y-6">
                                {['BJP', 'DMK', 'AIADMK'].map(party => {
                                    const partyBooths = weakBooths.filter(b => b.party === party);
                                    return (
                                        <div key={party} className="mb-4">
                                            <h4 className="font-semibold text-red-600 mb-2">{party} ({partyBooths.length})</h4>
                                            <div className="space-y-2">
                                                {partyBooths.map(booth => (
                                                    <div key={booth.id} className="flex items-center justify-between p-3 border rounded bg-red-50">
                                                        <div>
                                                            <div className="font-medium">{booth.locality}</div>
                                                            <div className="text-sm text-gray-600">Score: {(booth.score * 100).toFixed(1)}%</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setEditingWeakBooth(booth)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                            <button onClick={() => deleteWeakBooth(booth.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {partyBooths.length === 0 && <p className="text-gray-400 text-sm">No entries for {party}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Independent Hotspots Tab */}
                    {activeTab === 'hotspots' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Hotspots ({hotspots.length})</h3>
                                <button
                                    onClick={() => setEditingHotspot({
                                        assemblyId, locality: '', candidateName: '', bestPerformance: 0, bestYear: '2021', order: hotspots.length + 1
                                    })}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                                >
                                    <Plus size={18} /> Add Hotspot
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {hotspots.map(hotspot => (
                                    <div key={hotspot.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                                        <div>
                                            <div className="font-semibold">{hotspot.locality}</div>
                                            <div className="text-sm text-gray-600">{hotspot.psName}</div>
                                            <div className="text-sm text-yellow-700">{hotspot.candidateName}</div>
                                            <div className="text-xs text-gray-500">Best: {(hotspot.bestPerformance * 100).toFixed(1)}% ({hotspot.bestYear})</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingHotspot(hotspot)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                            <button onClick={() => deleteHotspot(hotspot.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {hotspots.length === 0 && <p className="text-gray-500 text-center py-8">No hotspots yet.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="w-1/2 overflow-auto bg-white">
                <div className="sticky top-0 bg-white border-b p-4 z-10 flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Eye size={20} className="text-blue-600" />
                        Live Preview
                    </h3>
                    <button
                        onClick={refreshPreview}
                        className="flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
                <div className="p-4">
                    <RetroBoothsAnalysis key={previewKey} selectedAssembly={assemblyId} />
                </div>
            </div>

            {/* Modals moved to root for better stacking context */}
            {editingCard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110]">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-lg font-semibold mb-4">{editingCard.id ? 'Edit Card' : 'New Card'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Heading</label>
                                <input
                                    type="text"
                                    value={editingCard.heading}
                                    onChange={(e) => setEditingCard({ ...editingCard, heading: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea
                                    value={editingCard.content}
                                    onChange={(e) => setEditingCard({ ...editingCard, content: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                    rows={4}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Icon</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {CARD_ICONS.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setEditingCard({ ...editingCard, icon: item.id })}
                                                className={`p-2 border rounded-lg flex flex-col items-center gap-1 transition-colors ${editingCard.icon === item.id ? 'bg-blue-600 border-blue-600 text-white' : 'hover:bg-gray-100 border-gray-200'}`}
                                            >
                                                <Icon size={20} />
                                                <span className="text-[10px] uppercase font-bold">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type</label>
                                    <select
                                        value={editingCard.cardType}
                                        onChange={(e) => setEditingCard({ ...editingCard, cardType: e.target.value as any })}
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        <option value="text">Text</option>
                                        <option value="note">Note (Yellow)</option>
                                        <option value="info">Info (Blue)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={editingCard.order}
                                        onChange={(e) => setEditingCard({ ...editingCard, order: parseInt(e.target.value) || 1 })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 sticky bottom-0 bg-white pt-2 border-t">
                            <button onClick={() => setEditingCard(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={saveCard} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingWeakBooth && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">{editingWeakBooth.id ? 'Edit Entry' : 'Add Entry'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Party</label>
                                <select
                                    value={editingWeakBooth.party}
                                    onChange={(e) => setEditingWeakBooth({ ...editingWeakBooth, party: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="BJP">BJP</option>
                                    <option value="DMK">DMK</option>
                                    <option value="AIADMK">AIADMK</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Locality</label>
                                <input
                                    type="text"
                                    value={editingWeakBooth.locality}
                                    onChange={(e) => setEditingWeakBooth({ ...editingWeakBooth, locality: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Score (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={(editingWeakBooth.score * 100).toFixed(1)}
                                        onChange={(e) => setEditingWeakBooth({ ...editingWeakBooth, score: parseFloat(e.target.value) / 100 || 0 })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={editingWeakBooth.order}
                                        onChange={(e) => setEditingWeakBooth({ ...editingWeakBooth, order: parseInt(e.target.value) || 1 })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditingWeakBooth(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={saveWeakBooth} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingHotspot && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">{editingHotspot.id ? 'Edit' : 'Add'} Hotspot</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Locality</label>
                                    <input
                                        type="text"
                                        value={editingHotspot.locality}
                                        onChange={(e) => setEditingHotspot({ ...editingHotspot, locality: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">PS Name</label>
                                    <input
                                        type="text"
                                        value={editingHotspot.psName || ''}
                                        onChange={(e) => setEditingHotspot({ ...editingHotspot, psName: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Candidate Name</label>
                                <input
                                    type="text"
                                    value={editingHotspot.candidateName}
                                    onChange={(e) => setEditingHotspot({ ...editingHotspot, candidateName: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Best Performance (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={(editingHotspot.bestPerformance * 100).toFixed(1)}
                                        onChange={(e) => setEditingHotspot({ ...editingHotspot, bestPerformance: parseFloat(e.target.value) / 100 || 0 })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Best Year</label>
                                    <select
                                        value={editingHotspot.bestYear}
                                        onChange={(e) => setEditingHotspot({ ...editingHotspot, bestYear: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        <option value="2021">2021</option>
                                        <option value="2016">2016</option>
                                        <option value="2011">2011</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">2021 (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={((editingHotspot.perf2021 || 0) * 100).toFixed(1)}
                                        onChange={(e) => setEditingHotspot({ ...editingHotspot, perf2021: parseFloat(e.target.value) / 100 || 0 })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">2016 (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={((editingHotspot.perf2016 || 0) * 100).toFixed(1)}
                                        onChange={(e) => setEditingHotspot({ ...editingHotspot, perf2016: parseFloat(e.target.value) / 100 || 0 })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">2011 (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={((editingHotspot.perf2011 || 0) * 100).toFixed(1)}
                                        onChange={(e) => setEditingHotspot({ ...editingHotspot, perf2011: parseFloat(e.target.value) / 100 || 0 })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditingHotspot(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={saveHotspot} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
