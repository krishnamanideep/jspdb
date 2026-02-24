import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Save, Plus, Trash2, Settings, Edit2, Star, Zap, Award, Info, TrendingUp, FileText, Map, Users, Target, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import CurrentScenario from '../CurrentScenario';
import PoliticalHistory from '../PoliticalHistory';
import AssemblyOverview from '../AssemblyOverview';
import { ASSEMBLIES } from '@/data/assemblies';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import RichTextEditor from './RichTextEditor';

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

export default function AssemblyMetaEditor() {
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

    const [activeTab, setActiveTab] = useState<'scenario' | 'history' | 'cards' | 'settings'>('scenario');
    const [loading, setLoading] = useState(false);
    const [customCards, setCustomCards] = useState<any[]>([]);
    const [editingCard, setEditingCard] = useState<any | null>(null);
    const [savingCard, setSavingCard] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const [data, setData] = useState<any>({
        headers: {
            pageTitle: 'Current Political Scenario',
            scenariosTitle: 'Current Scenarios',
            reportsTitle: 'Recent Ground Reports',
            factorsTitle: 'Key Deciding Factors',
            outlookTitle: 'Electoral Outlook'
        },
        scenarios: [],
        groundReports: [],
        decidingFactors: [],
        electoralOutlook: [],
        historyNarrative: '',

    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchData();
        fetchCards();
    }, [assemblyId]);

    const refreshPreview = useCallback(() => {
        setPreviewKey(prev => prev + 1);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'assemblyMeta', assemblyId);
            const docSnap = await getDoc(docRef);
            const fetched = docSnap.exists() ? docSnap.data() : null;

            if (fetched && Object.keys(fetched).length > 0) {
                // Ensure headers exist
                if (!fetched.headers) {
                    fetched.headers = {
                        pageTitle: 'Current Political Scenario',
                        scenariosTitle: 'Current Scenarios',
                        reportsTitle: 'Recent Ground Reports',
                        factorsTitle: 'Key Deciding Factors',
                        outlookTitle: 'Electoral Outlook'
                    };
                }
                setData(fetched);
            } else {
                // Defaults
                setData({
                    headers: {
                        pageTitle: 'Current Political Scenario',
                        scenariosTitle: 'Current Scenarios',
                        reportsTitle: 'Recent Ground Reports',
                        factorsTitle: 'Key Deciding Factors',
                        outlookTitle: 'Electoral Outlook'
                    },
                    scenarios: [
                        { title: 'Coalition Dynamics', icon: 'users', content: '', status: 'Active', color: 'blue' },
                        { title: 'Key Issues', icon: 'alert', content: '', status: 'Critical', color: 'red' },
                        { title: 'Vote Bank Analysis', icon: 'target', content: '', status: 'Evolving', color: 'green' },
                        { title: 'Campaign Momentum', icon: 'trending', content: '', status: 'Shifting', color: 'orange' }
                    ],
                    groundReports: [],
                    decidingFactors: [],
                    electoralOutlook: [
                        { party: 'BJP', range: '0-0%', value: 0, color: 'orange' },
                        { party: 'DMK', range: '0-0%', value: 0, color: 'red' },
                        { party: 'AIADMK', range: '0-0%', value: 0, color: 'green' },
                        { party: 'Others', range: '0-0%', value: 0, color: 'gray' }
                    ],
                    historyNarrative: '<h3>Political History</h3><p>Enter history details here...</p>',

                });
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const fetchCards = async () => {
        try {
            const q = query(
                collection(db, 'customCards'),
                where('assemblyId', '==', assemblyId),
                where('section', '==', 'overview')
            );
            const snapshot = await getDocs(q);
            const cardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sorted = cardsData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            setCustomCards(sorted);
        } catch (e) { console.error(e); }
    };

    const saveCard = async () => {
        if (!editingCard) return;
        setSavingCard(true);
        try {
            const payload = { ...editingCard, assemblyId, section: 'overview' };
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
        setSavingCard(false);
    };

    const deleteCard = async (id: string) => {
        if (!confirm('Delete this card?')) return;
        try {
            await deleteDoc(doc(db, 'customCards', id));
            fetchCards();
            refreshPreview();
        } catch (e) { alert('Failed to delete'); }
    };

    const saveData = async () => {
        try {
            await setDoc(doc(db, 'assemblyMeta', assemblyId), data);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
    };

    const updateArrayItem = (arrayField: string, index: number, field: string | null, value: any) => {
        const newArray = [...(data[arrayField] || [])];
        if (field) {
            newArray[index] = { ...newArray[index], [field]: value };
        } else {
            newArray[index] = value;
        }
        setData({ ...data, [arrayField]: newArray });
    };

    const addArrayItem = (arrayField: string, template: any) => {
        setData({ ...data, [arrayField]: [...(data[arrayField] || []), template] });
    };

    const removeArrayItem = (arrayField: string, index: number) => {
        const newArray = [...(data[arrayField] || [])];
        newArray.splice(index, 1);
        setData({ ...data, [arrayField]: newArray });
    };

    const updateHeader = (key: string, value: string) => {
        setData({ ...data, headers: { ...data.headers, [key]: value } });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Left: Editor Panel */}
            <div className="w-1/2 flex flex-col border-r bg-white shadow-xl z-20">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-lg">Meta Editor</h2>
                        <select
                            value={assemblyId}
                            onChange={(e) => setAssemblyId(e.target.value)}
                            className="bg-white border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        >
                            {accessibleAssemblies.map(a => (
                                <option key={a.id} value={a.id}>{a.id}. {a.name}</option>
                            ))}
                        </select>
                        <div className="flex bg-gray-200 rounded p-1">
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-3 py-1 rounded text-sm font-medium ${activeTab === 'settings' ? 'bg-white shadow text-blue-600' : ''}`}
                            >
                                Settings
                            </button>
                            <button
                                onClick={() => setActiveTab('scenario')}
                                className={`px-3 py-1 rounded text-sm font-medium ${activeTab === 'scenario' ? 'bg-white shadow text-blue-600' : ''}`}
                            >
                                Current Scenario
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-3 py-1 rounded text-sm font-medium ${activeTab === 'history' ? 'bg-white shadow text-blue-600' : ''}`}
                            >
                                History
                            </button>
                            <button
                                onClick={() => setActiveTab('cards')}
                                className={`px-3 py-1 rounded text-sm font-medium ${activeTab === 'cards' ? 'bg-white shadow text-blue-600' : ''}`}
                            >
                                Overview Cards
                            </button>

                        </div>
                    </div>
                    <button
                        onClick={saveData}
                        className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-colors ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        <Save size={18} /> {saved ? 'Saved!' : 'Save'}
                    </button>
                </div >

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {activeTab === 'scenario' ? (
                        <>
                            {/* Page Config */}
                            <div className="bg-blue-50 p-3 rounded border border-blue-100 mb-4 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-blue-800 block mb-1">Page Title</label>
                                    <input
                                        className="w-full text-sm border-blue-200 rounded p-1"
                                        value={data.headers?.pageTitle || ''}
                                        onChange={e => updateHeader('pageTitle', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Scenarios */}
                            <section className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-700">Scenario Cards</h3>
                                        <button onClick={() => addArrayItem('scenarios', { title: 'New', icon: 'users', content: '', status: 'Active', color: 'blue' })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add</button>
                                    </div>
                                    <input
                                        className="w-full text-sm border-gray-200 bg-gray-50 rounded p-1 text-gray-600 italic"
                                        value={data.headers?.scenariosTitle || ''}
                                        onChange={e => updateHeader('scenariosTitle', e.target.value)}
                                        placeholder="Section Header Text..."
                                    />
                                </div>

                                {data.scenarios?.map((s: any, i: number) => (
                                    <div key={i} className="border p-4 rounded bg-gray-50 text-sm">
                                        <div className="flex justify-between mb-2 gap-2">
                                            <input className="font-bold border rounded p-1 flex-1" value={s.title} onChange={e => updateArrayItem('scenarios', i, 'title', e.target.value)} placeholder="Title" />
                                            <select className="border rounded p-1" value={s.icon} onChange={e => updateArrayItem('scenarios', i, 'icon', e.target.value)}>
                                                <option value="users">Icon: Users</option>
                                                <option value="alert">Icon: Alert</option>
                                                <option value="target">Icon: Target</option>
                                                <option value="trending">Icon: Trend</option>
                                                <option value="zap">Icon: Zap</option>
                                                <option value="bar">Icon: Bar</option>
                                                <option value="flag">Icon: Flag</option>
                                                <option value="message">Icon: Msg</option>
                                            </select>
                                            <select className="border rounded p-1" value={s.status} onChange={e => updateArrayItem('scenarios', i, 'status', e.target.value)}>
                                                <option>Active</option><option>Critical</option><option>Evolving</option><option>Shifting</option>
                                            </select>
                                            <select className="border rounded p-1" value={s.color} onChange={e => updateArrayItem('scenarios', i, 'color', e.target.value)}>
                                                <option value="blue">Blue</option><option value="red">Red</option><option value="green">Green</option><option value="orange">Orange</option>
                                            </select>
                                            <button onClick={() => removeArrayItem('scenarios', i)} className="text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                        <RichTextEditor
                                            value={s.content || ''}
                                            onChange={(html: string) => updateArrayItem('scenarios', i, 'content', html)}
                                            placeholder="Content (use formatting toolbar)..."
                                            minHeight="80px"
                                        />
                                    </div>
                                ))}
                            </section>

                            {/* Ground Reports */}
                            <section className="space-y-4 pt-4 border-t">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-700">Ground Reports</h3>
                                        <button onClick={() => addArrayItem('groundReports', { locality: 'Locality', date: new Date().toISOString().split('T')[0], sentiment: 'Neutral', observation: '' })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add</button>
                                    </div>
                                    <input
                                        className="w-full text-sm border-gray-200 bg-gray-50 rounded p-1 text-gray-600 italic"
                                        value={data.headers?.reportsTitle || ''}
                                        onChange={e => updateHeader('reportsTitle', e.target.value)}
                                        placeholder="Section Header Text..."
                                    />
                                </div>
                                {data.groundReports?.map((r: any, i: number) => (
                                    <div key={i} className="border p-4 rounded bg-gray-50 text-sm">
                                        <div className="flex justify-between mb-2 gap-2">
                                            <input className="border rounded p-1 flex-1" value={r.locality} onChange={e => updateArrayItem('groundReports', i, 'locality', e.target.value)} placeholder="Locality" />
                                            <input type="date" className="border rounded p-1" value={r.date} onChange={e => updateArrayItem('groundReports', i, 'date', e.target.value)} />
                                            <div className="flex gap-2 flex-1">
                                                {(() => {
                                                    const parseSentiment = (str: string) => {
                                                        if (!str) return { type: 'Neutral', party: '' };
                                                        const lower = str.toLowerCase();
                                                        let type = 'Neutral';
                                                        let party = '';

                                                        if (lower.includes('positive') || lower.includes('pro')) type = 'Pro';
                                                        else if (lower.includes('negative') || lower.includes('anti')) type = 'Anti';
                                                        else if (lower.includes('neutral')) type = 'Neutral';

                                                        // Extract party
                                                        const commonParties = ['BJP', 'DMK', 'AIADMK', 'INC', 'PMK', 'NRC', 'AINRC', 'LJK', 'IND'];
                                                        const foundParty = commonParties.find(p => str.includes(p));

                                                        if (foundParty) party = foundParty;
                                                        else if (type !== 'Neutral') {
                                                            // If no common party found but has sentiment, assume the rest is custom party
                                                            // content after "for" or space
                                                            party = str.replace(/^(Positive for|Negative for|Pro|Anti)\s*/i, '').trim();
                                                            if (!commonParties.includes(party)) party = 'Others';
                                                        }

                                                        return { type, party };
                                                    };

                                                    const { type, party } = parseSentiment(r.sentiment);
                                                    const PARTIES = ['BJP', 'DMK', 'AIADMK', 'INC', 'PMK', 'NRC', 'AINRC', 'LJK', 'IND', 'Others'];

                                                    const handleUpdate = (newType: string, newParty: string, customText: string = '') => {
                                                        let finalSentiment = newType;
                                                        if (newType !== 'Neutral') {
                                                            const p = newParty === 'Others' ? customText : newParty;
                                                            if (p) finalSentiment = `${newType} ${p}`;
                                                        }
                                                        updateArrayItem('groundReports', i, 'sentiment', finalSentiment);
                                                    };

                                                    return (
                                                        <>
                                                            <div className="flex gap-1">
                                                                <select
                                                                    className={`border rounded p-1 ${type === 'Pro' ? 'bg-green-50 text-green-700 font-bold' : type === 'Anti' ? 'bg-red-50 text-red-700 font-bold' : 'bg-gray-50'}`}
                                                                    value={type}
                                                                    onChange={e => handleUpdate(e.target.value, party)}
                                                                >
                                                                    <option value="Pro">Pro ( + )</option>
                                                                    <option value="Anti">Anti ( - )</option>
                                                                    <option value="Neutral">Neutral</option>
                                                                </select>
                                                                <select
                                                                    className="border rounded p-1 font-medium"
                                                                    value={PARTIES.includes(party) ? party : 'Others'}
                                                                    onChange={e => handleUpdate(type, e.target.value)}
                                                                >
                                                                    <option value="">Select Party</option>
                                                                    {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                                                                </select>
                                                            </div>
                                                            {(!PARTIES.includes(party) || party === 'Others') && (
                                                                <input
                                                                    className="border rounded p-1 flex-1 placeholder-gray-400"
                                                                    placeholder="Custom Party/Entity..."
                                                                    value={r.sentiment.replace(/^(Positive for|Negative for|Pro|Anti)\s*/i, '')}
                                                                    onChange={e => handleUpdate(type, 'Others', e.target.value)}
                                                                />
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <button onClick={() => removeArrayItem('groundReports', i)} className="text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                        <RichTextEditor
                                            value={r.observation || ''}
                                            onChange={(html: string) => updateArrayItem('groundReports', i, 'observation', html)}
                                            placeholder="Observation (use formatting toolbar)..."
                                            minHeight="60px"
                                        />
                                    </div>
                                ))}
                            </section>

                            {/* Deciding Factors */}
                            <section className="space-y-4 pt-4 border-t">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-700">Key Deciding Factors</h3>
                                        <button onClick={() => addArrayItem('decidingFactors', { title: 'Factor', description: '' })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add</button>
                                    </div>
                                    <input
                                        className="w-full text-sm border-gray-200 bg-gray-50 rounded p-1 text-gray-600 italic"
                                        value={data.headers?.factorsTitle || ''}
                                        onChange={e => updateHeader('factorsTitle', e.target.value)}
                                        placeholder="Section Header Text..."
                                    />
                                </div>
                                {data.decidingFactors?.map((f: any, i: number) => (
                                    <div key={i} className="border p-3 rounded bg-gray-50 text-sm">
                                        <div className="flex justify-between gap-2 mb-1">
                                            <input className="font-bold border rounded p-1 flex-1" value={f.title} onChange={e => updateArrayItem('decidingFactors', i, 'title', e.target.value)} placeholder="Title" />
                                            <button onClick={() => removeArrayItem('decidingFactors', i)} className="text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                        <RichTextEditor
                                            value={f.description || ''}
                                            onChange={(html: string) => updateArrayItem('decidingFactors', i, 'description', html)}
                                            placeholder="Description (use formatting toolbar)..."
                                            minHeight="80px"
                                        />
                                    </div>
                                ))}
                            </section>

                            {/* Electoral Outlook */}
                            <section className="space-y-4 pt-4 border-t">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-700">Electoral Outlook</h3>
                                        <button onClick={() => addArrayItem('electoralOutlook', { party: 'Party', range: '0-0%', value: 0, color: 'gray' })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add</button>
                                    </div>
                                    <input
                                        className="w-full text-sm border-gray-200 bg-gray-50 rounded p-1 text-gray-600 italic"
                                        value={data.headers?.outlookTitle || ''}
                                        onChange={e => updateHeader('outlookTitle', e.target.value)}
                                        placeholder="Section Header Text..."
                                    />
                                </div>
                                {data.electoralOutlook?.map((o: any, i: number) => (
                                    <div key={i} className="border p-3 rounded bg-gray-50 flex gap-2 items-center text-sm">
                                        <input className="w-20 border rounded p-1 font-bold" value={o.party} onChange={e => updateArrayItem('electoralOutlook', i, 'party', e.target.value)} placeholder="Party" />
                                        <input className="w-20 border rounded p-1" value={o.range} onChange={e => updateArrayItem('electoralOutlook', i, 'range', e.target.value)} placeholder="Range" />
                                        <input type="number" className="w-16 border rounded p-1" value={o.value} onChange={e => updateArrayItem('electoralOutlook', i, 'value', Number(e.target.value))} placeholder="%" />
                                        <select className="border rounded p-1" value={o.color} onChange={e => updateArrayItem('electoralOutlook', i, 'color', e.target.value)}>
                                            <option value="orange">Orange</option><option value="red">Red</option><option value="green">Green</option><option value="gray">Gray</option>
                                        </select>
                                        <button onClick={() => removeArrayItem('electoralOutlook', i)} className="text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </section>
                        </>
                    ) : activeTab === 'history' ? (
                        /* History Narrative Editor */
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-700">Political History & Dynamics</h3>
                            <p className="text-xs text-gray-500">HTML Supported</p>
                            <RichTextEditor
                                value={data.historyNarrative || ''}
                                onChange={(html: string) => setData({ ...data, historyNarrative: html })}
                                placeholder="Write the detailed political history here..."
                                minHeight="400px"
                            />
                        </div>

                    ) : activeTab === 'settings' ? (
                        /* Settings Tab - Assembly Configuration */
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-gray-700 text-lg mb-2">Assembly Configuration</h3>
                                <p className="text-sm text-gray-500">Configure assembly-level settings and metadata</p>
                            </div>

                            {/* Assembly Map Upload */}
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Map size={20} className="text-blue-600" />
                                    <h4 className="font-bold text-gray-800">Constituency Map</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload a custom map image for this assembly constituency. This will be displayed in the Assembly Overview section.
                                </p>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">Map Image URL</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            className="flex-1 text-sm border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={data.assemblyMapUrl || ''}
                                            onChange={e => setData({ ...data, assemblyMapUrl: e.target.value })}
                                            placeholder="Enter image URL or upload a file..."
                                        />
                                        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Upload
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    // Validate file size (5MB max)
                                                    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                                                    if (file.size > maxSize) {
                                                        alert('❌ File too large! Maximum size is 5MB. Your file is ' + (file.size / 1024 / 1024).toFixed(2) + 'MB');
                                                        return;
                                                    }

                                                    // Show loading state
                                                    const uploadBtn = e.target.parentElement;
                                                    if (uploadBtn) uploadBtn.textContent = 'Uploading...';

                                                    try {
                                                        console.log('Starting upload for file:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB');

                                                        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                                                        const { storage } = await import('@/lib/firebase/client');

                                                        const storagePath = `assembly-maps/${assemblyId}/${Date.now()}_${file.name}`;
                                                        console.log('Upload path:', storagePath);

                                                        const storageRef = ref(storage, storagePath);

                                                        console.log('Uploading to Firebase Storage...');
                                                        await uploadBytes(storageRef, file);

                                                        console.log('Getting download URL...');
                                                        const url = await getDownloadURL(storageRef);
                                                        console.log('Download URL:', url);

                                                        // Update local state
                                                        setData((prev: any) => ({ ...prev, assemblyMapUrl: url }));

                                                        // Auto-save to Firestore - use the fresh URL, not stale data
                                                        console.log('Saving to Firestore...');
                                                        const docRef = doc(db, 'assemblyMeta', assemblyId);
                                                        await setDoc(docRef, { assemblyMapUrl: url }, { merge: true });
                                                        console.log('Saved successfully!');

                                                        alert('✅ Map image uploaded and saved successfully!');
                                                        refreshPreview();
                                                    } catch (err: any) {
                                                        console.error('Upload error:', err);

                                                        // Provide specific error messages
                                                        let errorMessage = '❌ Upload failed: ';
                                                        if (err.code === 'storage/unauthorized') {
                                                            errorMessage += 'Permission denied. Please check Firebase Storage rules.';
                                                        } else if (err.code === 'storage/canceled') {
                                                            errorMessage += 'Upload was canceled.';
                                                        } else if (err.code === 'storage/unknown') {
                                                            errorMessage += 'Unknown error occurred. Check your internet connection.';
                                                        } else if (err.message) {
                                                            errorMessage += err.message;
                                                        } else {
                                                            errorMessage += 'Unknown error. Check console for details.';
                                                        }

                                                        alert(errorMessage);
                                                        console.error('Full error details:', err);
                                                    } finally {
                                                        // Reset button text
                                                        if (uploadBtn) uploadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Upload';
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WebP. Max size: 5MB</p>
                                </div>

                                {data.assemblyMapUrl && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Eye size={16} className="text-green-600" />
                                            Current Map Preview
                                        </div>
                                        <div className="relative">
                                            <img
                                                src={data.assemblyMapUrl}
                                                alt="Assembly Map Preview"
                                                className="w-full max-w-2xl border-2 border-gray-300 rounded-lg shadow-sm"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x400?text=Image+Load+Failed";
                                                }}
                                            />
                                        </div>
                                        <div className="flex gap-3 mt-3">
                                            <a
                                                href={data.assemblyMapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                                            >
                                                Open in new tab →
                                            </a>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(data.assemblyMapUrl);
                                                    alert('✅ URL copied to clipboard!');
                                                }}
                                                className="text-xs text-gray-600 hover:text-gray-800 underline"
                                            >
                                                Copy URL
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Additional Settings Can Go Here */}
                            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-6">
                                <div className="flex items-start gap-3">
                                    <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-1">Settings Auto-Save</h4>
                                        <p className="text-sm text-blue-700">
                                            Changes to the map URL are automatically saved when you upload a file.
                                            For manual URL entries, click the "Save" button at the top to persist your changes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Overview Cards Editor */
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Overview Custom Cards ({customCards.length})</h3>
                                <button
                                    onClick={() => setEditingCard({ assemblyId, heading: '', content: '', cardType: 'text', section: 'overview', order: customCards.length + 1 })}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                                >
                                    <Plus size={18} /> Add Card
                                </button>
                            </div>

                            <div className="space-y-4">
                                {customCards.map(card => (
                                    <div key={card.id} className={`border-2 rounded-xl overflow-hidden transition-all hover:shadow-md ${card.cardType === 'note' ? 'bg-yellow-50 border-yellow-200' :
                                        card.cardType === 'info' ? 'bg-blue-50 border-blue-200' :
                                            card.cardType === 'table' ? 'bg-green-50 border-green-200' :
                                                card.cardType === 'small' ? 'bg-purple-50 border-purple-200' :
                                                    'bg-white border-gray-200'
                                        }`}>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                    {card.icon && CARD_ICONS.find(i => i.id === card.icon) && (() => {
                                                        const Icon = CARD_ICONS.find(i => i.id === card.icon)!.icon;
                                                        return (
                                                            <div className={`p-2 rounded-lg ${card.cardType === 'note' ? 'bg-yellow-100 text-yellow-700' :
                                                                card.cardType === 'info' ? 'bg-blue-100 text-blue-700' :
                                                                    card.cardType === 'table' ? 'bg-green-100 text-green-700' :
                                                                        card.cardType === 'small' ? 'bg-purple-100 text-purple-700' :
                                                                            'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                <Icon size={20} strokeWidth={2.5} />
                                                            </div>
                                                        );
                                                    })()}
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-lg">{card.heading}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Order: {card.order} • Type: {card.cardType}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => setEditingCard(card)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Edit card"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCard(card.id!)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Delete card"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: card.content || '<em class="text-gray-400">No content</em>' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {customCards.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <p className="text-gray-500 text-lg mb-2">No overview cards yet</p>
                                        <p className="text-gray-400 text-sm">Click "Add Card" to create your first custom information card</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div >

            {/* Modals */}
            {
                editingCard && (
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
                                    <RichTextEditor
                                        value={editingCard.content || ''}
                                        onChange={(html: string) => setEditingCard({ ...editingCard, content: html })}
                                        placeholder="Card content (use formatting toolbar)..."
                                        minHeight="80px"
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
                                            <option value="table">Table</option>
                                            <option value="small">Small Card</option>
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
                                <button onClick={saveCard} disabled={savingCard} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    {savingCard ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Right: Preview Panel */}
            <div className="w-1/2 overflow-y-auto bg-gray-200 p-8">
                <div className="sticky top-0 bg-gray-200 z-10 pb-4 mb-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-600">Live Preview ({activeTab === 'scenario' ? 'Current Scenario' : activeTab === 'history' ? 'History' : activeTab === 'settings' ? 'Settings' : 'Overview'})</h2>
                    <div className="flex gap-2">
                        <button onClick={refreshPreview} className="p-1 hover:bg-gray-300 rounded"><RefreshCw size={18} /></button>
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Live Preview</span>
                    </div>
                </div>
                <div className="transform scale-90 origin-top">
                    {activeTab === 'scenario' ? (
                        <CurrentScenario selectedAssembly={assemblyId} previewData={data} />
                    ) : activeTab === 'history' ? (
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <PoliticalHistory selectedAssembly={assemblyId} previewData={data} />
                        </div>
                    ) : activeTab === 'settings' ? (
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Assembly Overview Preview</h3>
                            <p className="text-sm text-gray-600 mb-4">The map will appear in the Assembly Overview section below:</p>
                            <AssemblyOverview key={previewKey} selectedAssembly={assemblyId} />
                        </div>
                    ) : (
                        <AssemblyOverview key={previewKey} selectedAssembly={assemblyId} />
                    )}
                </div>
            </div>
        </div >
    );
}
