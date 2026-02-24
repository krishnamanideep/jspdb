/* eslint-disable */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Save, X, CreditCard, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { Candidate, CandidateCard } from '@/types/data';
import { ASSEMBLIES } from '@/data/assemblies';
import CandidatePanel from '../CandidatePanel';
import { db, storage } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import RichTextEditor from './RichTextEditor';

import { useAuth } from '@/context/AuthContext';

export default function CandidateEditor() {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Candidate>>({});

    // Initial assembly ID - will be updated based on access
    const [assemblyId, setAssemblyId] = useState('');

    // Filter assemblies based on user access


    const visibleAssemblies = useMemo(() => {
        if (!user) return [];
        if (user.role === 'super_admin') return ASSEMBLIES;
        if (user.role === 'admin' && user.accessibleAssemblies && user.accessibleAssemblies.length > 0) {
            return ASSEMBLIES.filter(a => user.accessibleAssemblies?.includes(a.id));
        }
        return [];
    }, [user]);

    // Set initial assembly selection
    useEffect(() => {
        if (visibleAssemblies.length > 0) {
            if (!assemblyId || !visibleAssemblies.find(a => a.id === assemblyId)) {
                setAssemblyId(visibleAssemblies[0].id);
            }
        }
    }, [visibleAssemblies, assemblyId]);

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newCard, setNewCard] = useState<Partial<CandidateCard>>({ title: '', content: '', type: 'info' });

    useEffect(() => {
        if (assemblyId) fetchCandidates();
    }, [assemblyId]);

    const fetchCandidates = async () => {
        try {
            const q = query(collection(db, 'candidates'), where('assemblyId', '==', assemblyId));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
            setCandidates(data);
        } catch (error) {
            console.error("Error fetching candidates:", error);
        }
    };

    const getAssemblyName = (id: string) => {
        return ASSEMBLIES.find(a => a.id === id)?.name || `Assembly ${id}`;
    };

    const handleEdit = (candidate: Candidate) => {
        setEditingId(candidate.id!);
        setFormData({
            ...candidate,
            advantages: candidate.advantages || [],
            opportunities: candidate.opportunities || [],
            threats: candidate.threats || [],
            customCards: candidate.customCards || [],
            headers: candidate.headers || {
                strengths: 'Strengths',
                weaknesses: 'Weaknesses/Challenges',
                advantages: 'Advantages',
                opportunities: 'Opportunities',
                threats: 'Threats',
                strengthsColor: '#15803d',
                weaknessesColor: '#b91c1c',
                advantagesColor: '#1d4ed8',
                opportunitiesColor: '#7e22ce',
                threatsColor: '#c2410c'
            }
        });
    };

    const handleNew = () => {
        setEditingId('new');
        setFormData({
            assemblyId,
            name: '',
            party: '',
            caste: '',
            designation: '',
            strengths: [],
            weaknesses: [],
            advantages: [],
            opportunities: [],
            threats: [],
            customCards: [],
            constituency: getAssemblyName(assemblyId),
            headers: {
                strengths: 'Strengths',
                weaknesses: 'Weaknesses/Challenges',
                advantages: 'Advantages',
                opportunities: 'Opportunities',
                threats: 'Threats',
                strengthsColor: '#15803d',
                weaknessesColor: '#b91c1c',
                advantagesColor: '#1d4ed8',
                opportunitiesColor: '#7e22ce',
                threatsColor: '#c2410c'
            }
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `candidates/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            setFormData({ ...formData, image: downloadURL });
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const saveCandidate = async () => {
        try {
            if (editingId === 'new') {
                await addDoc(collection(db, 'candidates'), formData);
            } else if (editingId) {
                await updateDoc(doc(db, 'candidates', editingId), formData);
            }
            setEditingId(null);
            fetchCandidates();
        } catch (e) {
            alert('Failed to save');
            console.error(e);
        }
    };

    const deleteCandidate = async (id: string) => {
        if (!confirm("Are you sure you want to delete this candidate?")) return;

        try {
            await deleteDoc(doc(db, 'candidates', id));
            setEditingId(null);
            fetchCandidates();
        } catch (e) {
            alert('Failed to delete');
            console.error(e);
        }
    };

    const addCustomCard = () => {
        if (!newCard.title || !newCard.content) return;
        const card: CandidateCard = {
            id: `card_${Date.now()}`,
            title: newCard.title,
            content: newCard.content,
            type: newCard.type || 'info'
        };
        setFormData({
            ...formData,
            customCards: [...(formData.customCards || []), card]
        });
        setNewCard({ title: '', content: '', type: 'info' });
    };

    const removeCustomCard = (cardId: string) => {
        setFormData({
            ...formData,
            customCards: (formData.customCards || []).filter(c => c.id !== cardId)
        });
    };

    // Preview Data
    const previewCandidates = candidates.map(c =>
        c.id === editingId ? { ...c, ...formData } as Candidate : c
    );
    if (editingId === 'new') {
        previewCandidates.push(formData as Candidate);
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Left: Editor List */}
            <div className="w-1/2 p-6 overflow-y-auto border-r bg-white z-10 shadow-xl">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 border-b z-20">
                    <h2 className="text-xl font-bold">Candidates Editor</h2>
                    <button onClick={handleNew} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                        <Plus size={16} /> Add Candidate
                    </button>
                </div>

                {/* Assembly Selector */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-semibold text-blue-800 mb-2">Select Assembly</label>
                    <select
                        value={assemblyId}
                        onChange={(e) => {
                            setAssemblyId(e.target.value);
                            setEditingId(null);
                        }}
                        className="w-full border border-blue-300 p-3 rounded-lg bg-white text-gray-800 font-medium"
                    >
                        {visibleAssemblies.map(a => (
                            <option key={a.id} value={a.id}>{a.id}. {a.name}</option>
                        ))}
                    </select>
                </div>

                {editingId ? (
                    <div className="p-4 border rounded bg-gray-50 shadow-inner space-y-4">
                        <h3 className="text-lg font-bold">{editingId === 'new' ? 'New Candidate' : 'Edit Candidate'}</h3>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Candidate Image</label>
                                <div className="flex items-center gap-4">
                                    {formData.image && (
                                        <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300">
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        disabled={uploading}
                                    />
                                    {uploading && <span className="text-sm text-blue-600">Uploading...</span>}
                                </div>
                            </div>
                            <input className="border p-2 rounded" placeholder="Name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <select className="border p-2 rounded" value={formData.party || ''} onChange={e => setFormData({ ...formData, party: e.target.value })}>
                                <option value="">Select Party</option>
                                <option value="BJP">BJP</option>
                                <option value="DMK">DMK</option>
                                <option value="AIADMK">AIADMK</option>
                                <option value="INC">INC</option>
                                <option value="PMK">PMK</option>
                                <option value="NRC">NRC</option>
                                <option value="AINRC">AINRC</option>
                                <option value="LJK">LJK</option>
                                <option value="IND">Independent</option>
                                <option value="Others">Others</option>
                            </select>
                            <input className="border p-2 rounded" placeholder="Age" value={formData.age || ''} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                            <input className="border p-2 rounded" placeholder="Caste" value={formData.caste || ''} onChange={e => setFormData({ ...formData, caste: e.target.value })} />
                            <input className="border p-2 rounded" placeholder="Designation" value={formData.designation || ''} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                            <select
                                className="border p-2 rounded bg-white"
                                value={formData.assemblyId || assemblyId}
                                onChange={e => {
                                    const newAssemblyId = e.target.value;
                                    setFormData({
                                        ...formData,
                                        assemblyId: newAssemblyId,
                                        constituency: getAssemblyName(newAssemblyId)
                                    });
                                }}
                            >
                                {visibleAssemblies.map(a => (
                                    <option key={a.id} value={a.id}>{a.id}. {a.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Strengths */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    className="text-sm font-bold border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none bg-transparent flex-1"
                                    style={{ color: formData.headers?.strengthsColor || '#15803d' }}
                                    value={formData.headers?.strengths || 'Strengths'}
                                    onChange={e => setFormData({ ...formData, headers: { ...formData.headers, strengths: e.target.value } })}
                                />
                                <label className="flex items-center gap-1 cursor-pointer" title="Change heading color">
                                    <Palette size={14} className="text-gray-400" />
                                    <input type="color" className="w-6 h-6 rounded cursor-pointer border-0 p-0" value={formData.headers?.strengthsColor || '#15803d'} onChange={e => setFormData({ ...formData, headers: { ...formData.headers, strengthsColor: e.target.value } })} />
                                </label>
                            </div>
                            <RichTextEditor
                                value={formData.strengths?.join('<br>') || ''}
                                onChange={(html: string) => {
                                    const items = html.split('<br>').filter((s: string) => s.trim());
                                    setFormData({ ...formData, strengths: items });
                                }}
                                placeholder="Enter strengths (use formatting toolbar)..."
                                minHeight="80px"
                            />
                        </div>

                        {/* Weaknesses */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    className="text-sm font-bold border-b border-transparent hover:border-gray-300 focus:border-red-500 outline-none bg-transparent flex-1"
                                    style={{ color: formData.headers?.weaknessesColor || '#b91c1c' }}
                                    value={formData.headers?.weaknesses || 'Weaknesses/Challenges'}
                                    onChange={e => setFormData({ ...formData, headers: { ...formData.headers, weaknesses: e.target.value } })}
                                />
                                <label className="flex items-center gap-1 cursor-pointer" title="Change heading color">
                                    <Palette size={14} className="text-gray-400" />
                                    <input type="color" className="w-6 h-6 rounded cursor-pointer border-0 p-0" value={formData.headers?.weaknessesColor || '#b91c1c'} onChange={e => setFormData({ ...formData, headers: { ...formData.headers, weaknessesColor: e.target.value } })} />
                                </label>
                            </div>
                            <RichTextEditor
                                value={formData.weaknesses?.join('<br>') || ''}
                                onChange={(html: string) => {
                                    const items = html.split('<br>').filter((s: string) => s.trim());
                                    setFormData({ ...formData, weaknesses: items });
                                }}
                                placeholder="Enter weaknesses (use formatting toolbar)..."
                                minHeight="80px"
                            />
                        </div>

                        {/* Advantages */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    className="text-sm font-bold border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent flex-1"
                                    style={{ color: formData.headers?.advantagesColor || '#1d4ed8' }}
                                    value={formData.headers?.advantages || 'Advantages'}
                                    onChange={e => setFormData({ ...formData, headers: { ...formData.headers, advantages: e.target.value } })}
                                />
                                <label className="flex items-center gap-1 cursor-pointer" title="Change heading color">
                                    <Palette size={14} className="text-gray-400" />
                                    <input type="color" className="w-6 h-6 rounded cursor-pointer border-0 p-0" value={formData.headers?.advantagesColor || '#1d4ed8'} onChange={e => setFormData({ ...formData, headers: { ...formData.headers, advantagesColor: e.target.value } })} />
                                </label>
                            </div>
                            <RichTextEditor
                                value={formData.advantages?.join('<br>') || ''}
                                onChange={(html: string) => {
                                    const items = html.split('<br>').filter((s: string) => s.trim());
                                    setFormData({ ...formData, advantages: items });
                                }}
                                placeholder="Enter advantages (use formatting toolbar)..."
                                minHeight="80px"
                            />
                        </div>

                        {/* Advanced Section Toggle */}
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        >
                            <span className="font-semibold">Advanced Fields (Opportunities, Threats, Custom Cards)</span>
                            {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {showAdvanced && (
                            <div className="space-y-4 p-4 bg-gray-100 rounded-lg border">
                                {/* Opportunities */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <input
                                            className="text-sm font-bold border-b border-transparent hover:border-gray-300 focus:border-purple-500 outline-none bg-transparent flex-1"
                                            style={{ color: formData.headers?.opportunitiesColor || '#7e22ce' }}
                                            value={formData.headers?.opportunities || 'Opportunities'}
                                            onChange={e => setFormData({ ...formData, headers: { ...formData.headers, opportunities: e.target.value } })}
                                        />
                                        <label className="flex items-center gap-1 cursor-pointer" title="Change heading color">
                                            <Palette size={14} className="text-gray-400" />
                                            <input type="color" className="w-6 h-6 rounded cursor-pointer border-0 p-0" value={formData.headers?.opportunitiesColor || '#7e22ce'} onChange={e => setFormData({ ...formData, headers: { ...formData.headers, opportunitiesColor: e.target.value } })} />
                                        </label>
                                    </div>
                                    <RichTextEditor
                                        value={formData.opportunities?.join('<br>') || ''}
                                        onChange={(html: string) => {
                                            const items = html.split('<br>').filter((s: string) => s.trim());
                                            setFormData({ ...formData, opportunities: items });
                                        }}
                                        placeholder="Enter opportunities (use formatting toolbar)..."
                                        minHeight="80px"
                                    />
                                </div>

                                {/* Threats */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <input
                                            className="text-sm font-bold border-b border-transparent hover:border-gray-300 focus:border-orange-500 outline-none bg-transparent flex-1"
                                            style={{ color: formData.headers?.threatsColor || '#c2410c' }}
                                            value={formData.headers?.threats || 'Threats'}
                                            onChange={e => setFormData({ ...formData, headers: { ...formData.headers, threats: e.target.value } })}
                                        />
                                        <label className="flex items-center gap-1 cursor-pointer" title="Change heading color">
                                            <Palette size={14} className="text-gray-400" />
                                            <input type="color" className="w-6 h-6 rounded cursor-pointer border-0 p-0" value={formData.headers?.threatsColor || '#c2410c'} onChange={e => setFormData({ ...formData, headers: { ...formData.headers, threatsColor: e.target.value } })} />
                                        </label>
                                    </div>
                                    <RichTextEditor
                                        value={formData.threats?.join('<br>') || ''}
                                        onChange={(html: string) => {
                                            const items = html.split('<br>').filter((s: string) => s.trim());
                                            setFormData({ ...formData, threats: items });
                                        }}
                                        placeholder="Enter threats (use formatting toolbar)..."
                                        minHeight="80px"
                                    />
                                </div>

                                {/* Custom Cards */}
                                <div className="border-t pt-4">
                                    <h4 className="font-bold flex items-center gap-2 mb-3">
                                        <CreditCard size={18} /> Custom Cards
                                    </h4>

                                    {/* Existing Cards */}
                                    {(formData.customCards || []).length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            {formData.customCards?.map(card => (
                                                <div key={card.id} className={`p-3 rounded-lg border flex justify-between items-start ${card.type === 'highlight' ? 'bg-green-50 border-green-200' :
                                                    card.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                                        'bg-blue-50 border-blue-200'
                                                    }`}>
                                                    <div>
                                                        <div className="font-semibold text-sm">{card.title}</div>
                                                        <div className="text-xs text-gray-600">{card.content}</div>
                                                    </div>
                                                    <button onClick={() => removeCustomCard(card.id!)} className="text-red-500 hover:bg-red-100 p-1 rounded">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Card */}
                                    <div className="p-3 bg-white rounded-lg border space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                className="border p-2 rounded text-sm"
                                                placeholder="Card Title"
                                                value={newCard.title || ''}
                                                onChange={e => setNewCard({ ...newCard, title: e.target.value })}
                                            />
                                            <select
                                                className="border p-2 rounded text-sm"
                                                value={newCard.type || 'info'}
                                                onChange={e => setNewCard({ ...newCard, type: e.target.value as CandidateCard['type'] })}
                                            >
                                                <option value="info">Info (Blue)</option>
                                                <option value="highlight">Highlight (Green)</option>
                                                <option value="warning">Warning (Yellow)</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                        <RichTextEditor
                                            value={newCard.content || ''}
                                            onChange={(html: string) => setNewCard({ ...newCard, content: html })}
                                            placeholder="Card Content (use formatting toolbar)..."
                                            minHeight="60px"
                                        />
                                        <button
                                            onClick={addCustomCard}
                                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add Card
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t">
                            <button onClick={saveCandidate} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Save size={16} /> Save</button>
                            <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2"><X size={16} /> Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {candidates.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No candidates for {getAssemblyName(assemblyId)}</p>
                                <p className="text-sm text-gray-400 mt-1">Click &quot;Add Candidate&quot; to create one</p>
                            </div>
                        ) : (
                            candidates.map(c => (
                                <div key={c.id} className="border rounded p-4 shadow-sm hover:shadow-md transition-shadow bg-white flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-lg">{c.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded text-white ${c.party === 'BJP' ? 'bg-orange-500' : c.party === 'DMK' ? 'bg-red-500' : c.party === 'AIADMK' ? 'bg-green-600' : c.party === 'INC' ? 'bg-blue-500' : c.party === 'AINRC' ? 'bg-teal-600' : 'bg-gray-500'}`}>{c.party}</span>
                                            <span className="text-xs text-gray-500">{c.constituency || getAssemblyName(c.assemblyId || assemblyId)}</span>
                                            {(c.customCards?.length || 0) > 0 && (
                                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{c.customCards?.length} cards</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded" title="Edit">
                                            <Edit size={20} />
                                        </button>
                                        <button onClick={() => deleteCandidate(c.id!)} className="text-red-600 hover:bg-red-50 p-2 rounded" title="Delete">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Right: Preview */}
            <div className="w-1/2 overflow-y-auto bg-gray-100 p-8">
                <div className="sticky top-0 bg-gray-100 z-10 pb-4 mb-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-600">Live Preview</h2>
                    {editingId && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded animate-pulse">Editing Now...</span>}
                </div>
                <div className="transform scale-90 origin-top">
                    <CandidatePanel selectedAssembly={assemblyId} previewData={previewCandidates} />
                </div>
            </div>
        </div>
    );
}
