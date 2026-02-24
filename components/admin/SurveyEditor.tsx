import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Save, Plus, Trash2, Layout, BarChart, Star, Zap, Award, Info, TrendingUp, FileText, Eye, EyeOff } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import RichTextEditor from './RichTextEditor';
import Survey from '@/components/Survey';
import { ASSEMBLIES } from '@/data/assemblies';

const ICONS = [
    { name: 'star', icon: <Star size={16} /> },
    { name: 'zap', icon: <Zap size={16} /> },
    { name: 'award', icon: <Award size={16} /> },
    { name: 'info', icon: <Info size={16} /> },
    { name: 'trend', icon: <TrendingUp size={16} /> },
    { name: 'file', icon: <FileText size={16} /> },
];

const COLORS = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'indigo', class: 'bg-indigo-500' },
];

export default function SurveyEditor() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [selectedAssembly, setSelectedAssembly] = useState('');
    const [activeTab, setActiveTab] = useState<'settings' | 'data' | 'cards'>('data');

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
            if (!selectedAssembly || !accessibleAssemblies.find(a => a.id === selectedAssembly)) {
                setSelectedAssembly(accessibleAssemblies[0].id);
            }
        }
    }, [accessibleAssemblies, selectedAssembly]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'surveyData', selectedAssembly);
                const docSnap = await getDoc(docRef);
                const fetched = docSnap.exists() ? docSnap.data() : null;

                const defaultData = {
                    totalRespondents: 0,
                    sampleDate: new Date().toISOString().split('T')[0],
                    votingIntention: [],
                    issuesPriority: [],
                    leaderApproval: [],
                    surveyInsights: [],
                    ageWiseVoting: [],
                    genderWiseVoting: [],
                    showVotingIntention: true,
                    showIssues: true,
                    showLeaderApproval: true,
                    showDemographics: true,
                    showKeyFindings: true,
                    customCards: []
                };
                setData(fetched ? { ...defaultData, ...fetched } : defaultData);
            } catch (e) {
                console.error("Error loading survey data:", e);
            }
            setLoading(false);
        };
        loadData();
    }, [selectedAssembly]);

    const handleSave = async () => {
        try {
            await setDoc(doc(db, 'surveyData', selectedAssembly), data);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error("Error saving survey data:", e);
            alert('Failed to save');
        }
    };

    const updateField = (field: string, value: any) => {
        setData({ ...data, [field]: value });
    };

    const updateArrayItem = (arrayName: string, index: number, field: string, value: any) => {
        const newArray = [...(data[arrayName] || [])];
        newArray[index] = { ...newArray[index], [field]: value };
        setData({ ...data, [arrayName]: newArray });
    };

    const addArrayItem = (arrayName: string, template: any) => {
        setData({ ...data, [arrayName]: [...(data[arrayName] || []), template] });
    };

    const removeArrayItem = (arrayName: string, index: number) => {
        const newArray = [...(data[arrayName] || [])];
        newArray.splice(index, 1);
        setData({ ...data, [arrayName]: newArray });
    };

    if (loading || !data) return <div>Loading Editor...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Left: Editor Panel */}
            <div className="w-1/2 overflow-y-auto p-6 border-r bg-white shadow-xl z-10">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-20 py-2 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {ASSEMBLIES.find(a => a.id === selectedAssembly)?.name || `Assembly ${selectedAssembly}`} Survey
                    </h2>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedAssembly}
                            onChange={(e) => setSelectedAssembly(e.target.value)}
                            className="border p-2 rounded text-sm bg-gray-50 max-w-[150px]"
                        >
                            {accessibleAssemblies.map(a => (
                                <option key={a.id} value={a.id}>{a.id}. {a.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleSave}
                            className={`px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-colors ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <Save size={18} /> {saved ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b mb-6">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layout size={18} /> Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'data' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <BarChart size={18} /> Survey Data
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'cards' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Star size={18} /> Custom Cards
                    </button>
                </div>

                <div className="space-y-8">
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <section className="space-y-4 border p-4 rounded bg-gray-50">
                                <h3 className="font-semibold text-gray-700 border-b pb-2">Section Visibility</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'showVotingIntention', label: 'Voting Intention' },
                                        { key: 'showIssues', label: 'Top Issues' },
                                        { key: 'showLeaderApproval', label: 'Leader Approval' },
                                        { key: 'showDemographics', label: 'Age & Gender Charts' },
                                        { key: 'showKeyFindings', label: 'Key Survey Insights' }
                                    ].map(toggle => (
                                        <div key={toggle.key} className="flex items-center justify-between p-2 bg-white rounded border">
                                            <span className="text-sm font-medium">{toggle.label}</span>
                                            <button
                                                onClick={() => updateField(toggle.key, !data[toggle.key])}
                                                className={`p-1 rounded ${data[toggle.key] ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}
                                            >
                                                {data[toggle.key] ? <Eye size={20} /> : <EyeOff size={20} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4 border p-4 rounded bg-gray-50">
                                <h3 className="font-semibold text-gray-700 border-b pb-2">Survey Metadata</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Total Respondents</label>
                                        <input
                                            type="number"
                                            className="w-full border p-2 rounded"
                                            value={data.totalRespondents}
                                            onChange={e => updateField('totalRespondents', Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Sample Date</label>
                                        <input
                                            type="date"
                                            className="w-full border p-2 rounded"
                                            value={data.sampleDate}
                                            onChange={e => updateField('sampleDate', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-8">
                            {/* Voting Intention */}
                            <section className="space-y-4 border p-4 rounded bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-700">Voting Intention</h3>
                                    <button onClick={() => addArrayItem('votingIntention', { party: 'New', percentage: 0, votes: 0 })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add Party</button>
                                </div>
                                {data.votingIntention?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input className="border p-2 rounded w-1/3 text-sm" placeholder="Party" value={item.party} onChange={e => updateArrayItem('votingIntention', idx, 'party', e.target.value)} />
                                        <input type="number" className="border p-2 rounded w-1/4 text-sm" placeholder="%" value={item.percentage} onChange={e => updateArrayItem('votingIntention', idx, 'percentage', Number(e.target.value))} />
                                        <input type="number" className="border p-2 rounded w-1/4 text-sm" placeholder="Votes" value={item.votes} onChange={e => updateArrayItem('votingIntention', idx, 'votes', Number(e.target.value))} />
                                        <button onClick={() => removeArrayItem('votingIntention', idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </section>

                            {/* Issues Priority */}
                            <section className="space-y-4 border p-4 rounded bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-700">Top Issues</h3>
                                    <button onClick={() => addArrayItem('issuesPriority', { issue: 'New Issue', icon: 'info' })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add Issue</button>
                                </div>
                                {data.issuesPriority?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <div className="relative group">
                                            <button className="p-2 border rounded bg-white hover:bg-gray-50">
                                                {ICONS.find(i => i.name === item.icon)?.icon || <Info size={16} />}
                                            </button>
                                            <div className="absolute top-full left-0 z-10 bg-white border shadow-lg rounded p-2 hidden group-hover:grid grid-cols-3 gap-1 w-24">
                                                {ICONS.map(icon => (
                                                    <button
                                                        key={icon.name}
                                                        onClick={() => updateArrayItem('issuesPriority', idx, 'icon', icon.name)}
                                                        className={`p-1 rounded hover:bg-blue-50 ${item.icon === icon.name ? 'text-blue-600' : 'text-gray-500'}`}
                                                    >
                                                        {icon.icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <input className="border p-2 rounded w-full text-sm" placeholder="Issue Description" value={item.issue} onChange={e => updateArrayItem('issuesPriority', idx, 'issue', e.target.value)} />
                                        <button onClick={() => removeArrayItem('issuesPriority', idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </section>

                            {/* Leader Approval */}
                            <section className="space-y-4 border p-4 rounded bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-700">Leader Approval</h3>
                                    <button onClick={() => addArrayItem('leaderApproval', { leader: 'Name', approval: 0, disapproval: 0, neutral: 0 })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add Leader</button>
                                </div>
                                {data.leaderApproval?.map((item: any, idx: number) => (
                                    <div key={idx} className="border p-3 rounded bg-white relative">
                                        <button onClick={() => removeArrayItem('leaderApproval', idx)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                        <div className="mb-2">
                                            <input className="font-bold border-b outline-none w-3/4" value={item.leader} onChange={e => updateArrayItem('leaderApproval', idx, 'leader', e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-400">Approve %</label>
                                                <input type="number" className="w-full border rounded p-1" value={item.approval} onChange={e => updateArrayItem('leaderApproval', idx, 'approval', Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-400">Neutral %</label>
                                                <input type="number" className="w-full border rounded p-1" value={item.neutral} onChange={e => updateArrayItem('leaderApproval', idx, 'neutral', Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-400">Dis %</label>
                                                <input type="number" className="w-full border rounded p-1" value={item.disapproval} onChange={e => updateArrayItem('leaderApproval', idx, 'disapproval', Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            {/* Age-wise Voting */}
                            <section className="space-y-4 border p-4 rounded bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-700">Age-wise Voting Pattern</h3>
                                    <button onClick={() => addArrayItem('ageWiseVoting', { group: '18-25', percentage: 0, party: '' })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add Group</button>
                                </div>
                                {data.ageWiseVoting?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input className="border p-2 rounded w-1/3 text-sm" placeholder="Age Group" value={item.group} onChange={e => updateArrayItem('ageWiseVoting', idx, 'group', e.target.value)} />
                                        <input type="number" className="border p-2 rounded w-1/4 text-sm" placeholder="%" value={item.percentage} onChange={e => updateArrayItem('ageWiseVoting', idx, 'percentage', Number(e.target.value))} />
                                        <input className="border p-2 rounded w-1/3 text-sm" placeholder="Leaning Party" value={item.party} onChange={e => updateArrayItem('ageWiseVoting', idx, 'party', e.target.value)} />
                                        <button onClick={() => removeArrayItem('ageWiseVoting', idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </section>

                            {/* Gender-wise Voting */}
                            <section className="space-y-4 border p-4 rounded bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-700">Gender-wise Voting Pattern</h3>
                                    <button onClick={() => addArrayItem('genderWiseVoting', { gender: 'Male', percentage: 0, party: '' })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add Group</button>
                                </div>
                                {data.genderWiseVoting?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input className="border p-2 rounded w-1/3 text-sm" placeholder="Gender" value={item.gender} onChange={e => updateArrayItem('genderWiseVoting', idx, 'gender', e.target.value)} />
                                        <input type="number" className="border p-2 rounded w-1/4 text-sm" placeholder="%" value={item.percentage} onChange={e => updateArrayItem('genderWiseVoting', idx, 'percentage', Number(e.target.value))} />
                                        <input className="border p-2 rounded w-1/3 text-sm" placeholder="Leaning Party" value={item.party} onChange={e => updateArrayItem('genderWiseVoting', idx, 'party', e.target.value)} />
                                        <button onClick={() => removeArrayItem('genderWiseVoting', idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </section>

                            {/* Survey Insights */}
                            <section className="space-y-4 border p-4 rounded bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-700">Key Survey Insights</h3>
                                    <button onClick={() => addArrayItem('surveyInsights', { text: 'New Insight...' })} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> Add Insight</button>
                                </div>
                                {data.surveyInsights?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <span className="text-blue-500 font-bold">•</span>
                                        <input className="border p-2 rounded w-full text-sm" placeholder="Insight text..." value={item.text} onChange={e => updateArrayItem('surveyInsights', idx, 'text', e.target.value)} />
                                        <button onClick={() => removeArrayItem('surveyInsights', idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </section>
                        </div>
                    )}

                    {activeTab === 'cards' && (
                        <section className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700">Custom Insight Cards</h3>
                                <button
                                    onClick={() => addArrayItem('customCards', { title: 'New Insight', content: 'Detailed analysis here...', icon: 'info', color: 'blue' })}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 hover:bg-blue-700"
                                >
                                    <Plus size={14} /> Add Card
                                </button>
                            </div>
                            <div className="space-y-4">
                                {data.customCards?.map((card: any, idx: number) => (
                                    <div key={idx} className="border p-4 rounded-lg bg-gray-50 flex gap-4 relative">
                                        <button
                                            onClick={() => removeArrayItem('customCards', idx)}
                                            className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                                <input
                                                    className="w-full border p-2 rounded font-semibold"
                                                    value={card.title}
                                                    onChange={e => updateArrayItem('customCards', idx, 'title', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content</label>
                                                <RichTextEditor
                                                    value={card.content || ''}
                                                    onChange={(html: string) => updateArrayItem('customCards', idx, 'content', html)}
                                                    placeholder="Card content (use formatting toolbar)..."
                                                    minHeight="80px"
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {ICONS.map(item => (
                                                            <button
                                                                key={item.name}
                                                                onClick={() => updateArrayItem('customCards', idx, 'icon', item.name)}
                                                                className={`p-2 rounded border transition-colors ${card.icon === item.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hocus:border-blue-300'}`}
                                                                title={item.name}
                                                            >
                                                                {item.icon}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {COLORS.map(item => (
                                                            <button
                                                                key={item.name}
                                                                onClick={() => updateArrayItem('customCards', idx, 'color', item.name)}
                                                                className={`w-8 h-8 rounded-full border-2 transition-transform ${item.class} ${card.color === item.name ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                                                title={item.name}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Right: Live Preview */}
            <div className="w-1/2 overflow-y-auto bg-gray-100 p-8">
                <div className="sticky top-0 bg-gray-100 z-10 pb-4 mb-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-600">Live Preview</h2>
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Changes reflected instantly</span>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden min-h-[500px] transform scale-90 origin-top">
                    <Survey selectedAssembly={selectedAssembly} previewData={data} />
                </div>
            </div>
        </div>
    );
}

