'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, Eye, TrendingUp, AlertTriangle, Info, Lightbulb, FileText, Star, Zap, Award } from 'lucide-react';
import { ASSEMBLIES } from '@/data/assemblies';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import RichTextEditor from './RichTextEditor';

// Dynamic import for live preview
const PoliticalHistory = dynamic(() => import('@/components/PoliticalHistory'), { ssr: false });

interface Insight {
    id?: string;
    title: string;
    content: string;
    type: 'highlight' | 'trend' | 'warning' | 'info';
    order: number;
}

interface CustomCard {
    id?: string;
    title: string;
    content: string;
    icon: string;
    color: string;
    order: number;
}

interface Config {
    assemblyId: string;
    showElectoralTrends: boolean;
    showVoteSwing: boolean;
    showInsights: boolean;
    showCustomCards: boolean;
    customNarrative: string;
    insights: Insight[];
    customCards: CustomCard[];
}

const INSIGHT_TYPES = [
    { value: 'highlight', label: 'Highlight', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'trend', label: 'Trend', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
    { value: 'info', label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-800' },
];

const CARD_ICONS = [
    { value: 'star', label: 'Star', icon: Star },
    { value: 'zap', label: 'Zap', icon: Zap },
    { value: 'award', label: 'Award', icon: Award },
    { value: 'info', label: 'Info', icon: Info },
    { value: 'trend', label: 'Trend', icon: TrendingUp },
    { value: 'file', label: 'File', icon: FileText },
];

const CARD_COLORS = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
];

export default function PoliticalHistoryEditor() {
    const { user } = useAuth();
    const [assemblyId, setAssemblyId] = useState('');
    const [config, setConfig] = useState<Config>({
        assemblyId: '',
        showElectoralTrends: true,
        showVoteSwing: true,
        showInsights: true,
        showCustomCards: true,
        customNarrative: '',
        insights: [],
        customCards: []
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
    const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
    const [editingInsightIndex, setEditingInsightIndex] = useState<number | null>(null);
    const [editingCard, setEditingCard] = useState<CustomCard | null>(null);
    const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const [activeTab, setActiveTab] = useState<'settings' | 'insights' | 'cards'>('settings');

    useEffect(() => {
        fetchConfig();
    }, [assemblyId]);

    const fetchConfig = async () => {
        try {
            const docRef = doc(db, 'pageConfig', `politicalHistoryConfig_${assemblyId}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setConfig({
                    assemblyId,
                    showElectoralTrends: data.showElectoralTrends ?? true,
                    showVoteSwing: data.showVoteSwing ?? true,
                    showInsights: data.showInsights ?? true,
                    showCustomCards: data.showCustomCards ?? true,
                    customNarrative: data.customNarrative || '',
                    insights: data.insights || [],
                    customCards: data.customCards || []
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'pageConfig', `politicalHistoryConfig_${assemblyId}`), config);
            refreshPreview();
            alert('Saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
        setSaving(false);
    };

    const refreshPreview = useCallback(() => {
        setPreviewKey(prev => prev + 1);
    }, []);

    // Insight CRUD
    const addInsight = () => {
        setEditingInsight({ title: '', content: '', type: 'info', order: config.insights.length });
        setEditingInsightIndex(null);
    };

    const editInsight = (insight: Insight, index: number) => {
        setEditingInsight({ ...insight });
        setEditingInsightIndex(index);
    };

    const deleteInsight = (index: number) => {
        if (!confirm('Delete this insight?')) return;
        setConfig({ ...config, insights: config.insights.filter((_, i) => i !== index) });
    };

    const saveInsight = () => {
        if (!editingInsight) return;
        let updated;
        if (editingInsightIndex !== null) {
            updated = config.insights.map((ins, i) => i === editingInsightIndex ? editingInsight : ins);
        } else {
            updated = [...config.insights, editingInsight];
        }
        setConfig({ ...config, insights: updated });
        setEditingInsight(null);
        setEditingInsightIndex(null);
    };

    const moveInsight = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= config.insights.length) return;
        const updated = [...config.insights];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setConfig({ ...config, insights: updated });
    };

    // Custom Card CRUD
    const addCard = () => {
        setEditingCard({ title: '', content: '', icon: 'star', color: 'blue', order: config.customCards.length });
        setEditingCardIndex(null);
    };

    const editCard = (card: CustomCard, index: number) => {
        setEditingCard({ ...card });
        setEditingCardIndex(index);
    };

    const deleteCard = (index: number) => {
        if (!confirm('Delete this card?')) return;
        setConfig({ ...config, customCards: config.customCards.filter((_, i) => i !== index) });
    };

    const saveCard = () => {
        if (!editingCard) return;
        let updated;
        if (editingCardIndex !== null) {
            updated = config.customCards.map((card, i) => i === editingCardIndex ? editingCard : card);
        } else {
            updated = [...config.customCards, editingCard];
        }
        setConfig({ ...config, customCards: updated });
        setEditingCard(null);
        setEditingCardIndex(null);
    };

    const moveCard = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= config.customCards.length) return;
        const updated = [...config.customCards];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setConfig({ ...config, customCards: updated });
    };

    const getInsightTypeInfo = (type: string) => INSIGHT_TYPES.find(t => t.value === type) || INSIGHT_TYPES[3];
    const getCardIcon = (iconName: string) => CARD_ICONS.find(i => i.value === iconName) || CARD_ICONS[0];
    const getCardColor = (colorName: string) => CARD_COLORS.find(c => c.value === colorName) || CARD_COLORS[0];

    const assemblyName = ASSEMBLIES.find(a => a.id === assemblyId)?.name || `Assembly ${assemblyId}`;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Panel - Editor */}
            <div className="w-1/2 flex flex-col border-r bg-white overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp size={24} />
                        Political History & Dynamics Editor
                    </h2>
                    <p className="text-sm opacity-80 mt-1">Manage charts, insights, and cards</p>
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

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
                    >
                        Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'insights' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
                    >
                        Insights ({config.insights.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'cards' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
                    >
                        Cards ({config.customCards.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold mb-3">Section Visibility</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={config.showElectoralTrends} onChange={(e) => setConfig({ ...config, showElectoralTrends: e.target.checked })} className="w-5 h-5 rounded" />
                                        <span>Show Electoral Trends Chart</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={config.showVoteSwing} onChange={(e) => setConfig({ ...config, showVoteSwing: e.target.checked })} className="w-5 h-5 rounded" />
                                        <span>Show Vote Swing Charts</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={config.showInsights} onChange={(e) => setConfig({ ...config, showInsights: e.target.checked })} className="w-5 h-5 rounded" />
                                        <span>Show Key Insights</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={config.showCustomCards} onChange={(e) => setConfig({ ...config, showCustomCards: e.target.checked })} className="w-5 h-5 rounded" />
                                        <span>Show Custom Cards</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Custom Narrative (HTML)</label>
                                <textarea
                                    value={config.customNarrative}
                                    onChange={(e) => setConfig({ ...config, customNarrative: e.target.value })}
                                    className="w-full border rounded p-3 h-32 font-mono text-sm"
                                    placeholder="<ul><li><strong>2011-2016:</strong> BJP gained ground...</li></ul>"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">Insight cards for Key Dynamics section</p>
                                <button onClick={addInsight} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                                    <Plus size={18} /> Add Insight
                                </button>
                            </div>
                            {config.insights.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <Lightbulb size={48} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">No insights yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {config.insights.map((insight, index) => {
                                        const typeInfo = getInsightTypeInfo(insight.type);
                                        const Icon = typeInfo.icon;
                                        return (
                                            <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded ${typeInfo.color}`}><Icon size={16} /></div>
                                                        <div>
                                                            <div className="font-semibold">{insight.title || 'Untitled'}</div>
                                                            <div className="text-sm text-gray-600">{insight.content}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => moveInsight(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">↑</button>
                                                        <button onClick={() => moveInsight(index, 'down')} disabled={index === config.insights.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">↓</button>
                                                        <button onClick={() => editInsight(insight, index)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteInsight(index)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'cards' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">Custom information cards displayed below charts</p>
                                <button onClick={addCard} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                                    <Plus size={18} /> Add Card
                                </button>
                            </div>
                            {config.customCards.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">No custom cards yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {config.customCards.map((card, index) => {
                                        const iconInfo = getCardIcon(card.icon);
                                        const colorInfo = getCardColor(card.color);
                                        const CardIcon = iconInfo.icon;
                                        return (
                                            <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded text-white ${colorInfo.class}`}><CardIcon size={16} /></div>
                                                        <div>
                                                            <div className="font-semibold">{card.title || 'Untitled'}</div>
                                                            <div className="text-sm text-gray-600">{card.content}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => moveCard(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">↑</button>
                                                        <button onClick={() => moveCard(index, 'down')} disabled={index === config.customCards.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">↓</button>
                                                        <button onClick={() => editCard(card, index)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteCard(index)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-between">
                    <button onClick={refreshPreview} className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-white">
                        <RefreshCw size={16} /> Refresh Preview
                    </button>
                    <button onClick={saveConfig} disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                        <Save size={16} /> {saving ? 'Saving...' : 'Save All'}
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
                    <button onClick={refreshPreview} className="p-1 hover:bg-gray-700 rounded"><RefreshCw size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-100">
                    <PoliticalHistory
                        key={previewKey}
                        selectedAssembly={assemblyId}
                        previewData={{
                            historyNarrative: config.customNarrative || undefined,
                            showElectoralTrends: config.showElectoralTrends,
                            showVoteSwing: config.showVoteSwing,
                            showInsights: config.showInsights,
                            showCustomCards: config.showCustomCards,
                            insights: config.insights,
                            customCards: config.customCards
                        }}
                    />
                </div>
            </div>

            {/* Edit Insight Modal */}
            {editingInsight && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">{editingInsightIndex !== null ? 'Edit Insight' : 'Add Insight'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input type="text" value={editingInsight.title} onChange={(e) => setEditingInsight({ ...editingInsight, title: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g., 2016-2021 Trend" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea value={editingInsight.content} onChange={(e) => setEditingInsight({ ...editingInsight, content: e.target.value })} className="w-full border rounded px-3 py-2 h-24" placeholder="BJP gained 15% vote share..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {INSIGHT_TYPES.map(type => {
                                        const Icon = type.icon;
                                        return (
                                            <button key={type.value} onClick={() => setEditingInsight({ ...editingInsight, type: type.value as Insight['type'] })} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${editingInsight.type === type.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                                                <Icon size={20} /><span className="text-xs">{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditingInsight(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={saveInsight} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Card Modal */}
            {editingCard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">{editingCardIndex !== null ? 'Edit Card' : 'Add Card'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input type="text" value={editingCard.title} onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g., Key Takeaway" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <RichTextEditor
                                    value={editingCard.content}
                                    onChange={(html: string) => setEditingCard({ ...editingCard, content: html })}
                                    placeholder="Important information to display..."
                                    minHeight="120px"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Icon</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {CARD_ICONS.map(icon => {
                                        const Icon = icon.icon;
                                        return (
                                            <button key={icon.value} onClick={() => setEditingCard({ ...editingCard, icon: icon.value })} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${editingCard.icon === icon.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                                                <Icon size={20} /><span className="text-xs">{icon.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Color</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {CARD_COLORS.map(color => (
                                        <button key={color.value} onClick={() => setEditingCard({ ...editingCard, color: color.value })} className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${editingCard.color === color.value ? 'border-indigo-600' : 'border-gray-200'}`}>
                                            <div className={`w-6 h-6 rounded ${color.class}`}></div>
                                            <span className="text-xs">{color.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditingCard(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={saveCard} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
