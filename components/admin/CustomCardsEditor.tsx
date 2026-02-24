/* eslint-disable */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, StickyNote, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ASSEMBLIES } from '@/data/assemblies';

interface CustomCard {
    id?: string;
    assemblyId: string;
    heading: string;
    content: string;
    cardType: 'text' | 'note' | 'info';
    order: number;
}

export default function CustomCardsEditor() {
    const { user } = useAuth();
    const [cards, setCards] = useState<CustomCard[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<CustomCard>>({});
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

    useEffect(() => {
        fetchCards();
    }, [assemblyId]);

    const fetchCards = () => {
        fetch(`/api/customCards?assemblyId=${assemblyId}`)
            .then(res => res.json())
            .then(data => setCards(Array.isArray(data) ? data : []))
            .catch(console.error);
    };

    const handleEdit = (card: CustomCard) => {
        setEditingId(card.id!);
        setFormData(card);
    };

    const handleNew = () => {
        setEditingId('new');
        setFormData({
            assemblyId,
            heading: '',
            content: '',
            cardType: 'text',
            order: cards.length + 1
        });
    };

    const saveCard = async () => {
        const method = editingId === 'new' ? 'POST' : 'PUT';
        try {
            const res = await fetch('/api/customCards', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setEditingId(null);
                fetchCards();
            }
        } catch (e) {
            alert('Failed to save');
        }
    };

    const deleteCard = async (id: string) => {
        if (!confirm("Are you sure you want to delete this card?")) return;
        try {
            const res = await fetch(`/api/customCards?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setEditingId(null);
                fetchCards();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            alert('Failed to delete');
        }
    };

    const getCardIcon = (type: string) => {
        switch (type) {
            case 'note': return <StickyNote size={16} className="text-yellow-600" />;
            case 'info': return <Info size={16} className="text-blue-600" />;
            default: return <FileText size={16} className="text-gray-600" />;
        }
    };

    const getCardStyle = (type: string) => {
        switch (type) {
            case 'note': return 'bg-yellow-50 border-yellow-200';
            case 'info': return 'bg-blue-50 border-blue-200';
            default: return 'bg-white border-gray-200';
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Left: Editor Panel */}
            <div className="w-1/2 p-6 overflow-y-auto border-r bg-white z-10 shadow-xl">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 border-b z-20">
                    <div>
                        <h2 className="text-xl font-bold">Custom Cards Editor</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <label className="text-sm text-gray-600">Assembly:</label>
                            <select
                                value={assemblyId}
                                onChange={(e) => setAssemblyId(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                            >
                                {accessibleAssemblies.map(a => (
                                    <option key={a.id} value={a.id}>{a.id}. {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleNew} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                        <Plus size={16} /> Add Card
                    </button>
                </div>

                {editingId ? (
                    <div className="p-4 border rounded bg-gray-50 shadow-inner">
                        <h3 className="text-lg font-bold mb-4">{editingId === 'new' ? 'New Card' : 'Edit Card'}</h3>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Heading</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    placeholder="Card Heading"
                                    value={formData.heading || ''}
                                    onChange={e => setFormData({ ...formData, heading: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Content</label>
                                <textarea
                                    className="w-full border p-2 rounded min-h-[120px]"
                                    placeholder="Card content..."
                                    value={formData.content || ''}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1">Card Type</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={formData.cardType || 'text'}
                                        onChange={e => setFormData({ ...formData, cardType: e.target.value as CustomCard['cardType'] })}
                                    >
                                        <option value="text">Text Card</option>
                                        <option value="note">Note Card (Yellow)</option>
                                        <option value="info">Info Card (Blue)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Display Order</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={formData.order || 1}
                                        onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={saveCard} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                                <Save size={16} /> Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2">
                                <X size={16} /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cards.length === 0 ? (
                            <div className="text-center text-gray-500 py-12">
                                No custom cards yet. Click "Add Card" to create one.
                            </div>
                        ) : (
                            cards.map(card => (
                                <div key={card.id} className={`border rounded p-4 shadow-sm hover:shadow-md transition-shadow ${getCardStyle(card.cardType)}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getCardIcon(card.cardType)}
                                                <h4 className="font-bold text-lg">{card.heading}</h4>
                                                <span className="text-xs text-gray-400">#{card.order}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">{card.content}</p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button onClick={() => handleEdit(card)} className="text-blue-600 hover:bg-blue-50 p-2 rounded" title="Edit">
                                                <Edit size={20} />
                                            </button>
                                            <button onClick={() => deleteCard(card.id!)} className="text-red-600 hover:bg-red-50 p-2 rounded" title="Delete">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Right: Live Preview */}
            <div className="w-1/2 overflow-y-auto bg-gray-100 p-8">
                <div className="sticky top-0 bg-gray-100 z-10 pb-4 mb-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-600">Live Preview</h2>
                    {editingId && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded animate-pulse">Editing Now...</span>}
                </div>
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Custom Information Cards</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {(editingId === 'new' ? [...cards, formData as CustomCard] : cards.map(c => c.id === editingId ? { ...c, ...formData } as CustomCard : c))
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((card, idx) => (
                                <div key={card.id || idx} className={`p-4 rounded-lg border ${getCardStyle(card.cardType || 'text')}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {getCardIcon(card.cardType || 'text')}
                                        <h4 className="font-semibold text-gray-800">{card.heading || 'Untitled'}</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{card.content || 'No content yet...'}</p>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
