'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Comprehensive HTML cleaning function
const cleanHTML = (html: string): string => {
    if (!html) return '';

    let cleaned = html.replace(/\s*style="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s*class="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s*id="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s*dir="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s*aria-[^=]*="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s*data-[^=]*="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s*role="[^"]*"/gi, '');
    cleaned = cleaned.replace(/<span[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/span>/gi, '');
    cleaned = cleaned.replace(/<div>/gi, '<p>');
    cleaned = cleaned.replace(/<\/div>/gi, '</p>');
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned.trim();
};

const cleanArray = (arr: any[]): any[] => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => typeof item === 'string' ? cleanHTML(item) : item);
};

export default function CleanupPage() {
    const [status, setStatus] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const runCleanup = async () => {
        setIsRunning(true);
        setStatus('Starting cleanup...');
        setLogs([]);
        addLog('🧹 Starting database cleanup...');

        try {
            const candidatesRef = collection(db, 'candidates');
            const snapshot = await getDocs(candidatesRef);

            addLog(`Found ${snapshot.size} candidates to clean`);

            let cleaned = 0;

            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();
                const updates: any = {};

                // Clean SWOT fields
                if (data.strengths) updates.strengths = cleanArray(data.strengths);
                if (data.weaknesses) updates.weaknesses = cleanArray(data.weaknesses);
                if (data.advantages) updates.advantages = cleanArray(data.advantages);
                if (data.opportunities) updates.opportunities = cleanArray(data.opportunities);
                if (data.threats) updates.threats = cleanArray(data.threats);

                // Clean custom cards
                if (data.customCards && Array.isArray(data.customCards)) {
                    updates.customCards = data.customCards.map((card: any) => ({
                        ...card,
                        content: cleanHTML(card.content || '')
                    }));
                }

                // Only update if there are changes
                if (Object.keys(updates).length > 0) {
                    await updateDoc(doc(db, 'candidates', docSnapshot.id), updates);
                    cleaned++;
                    addLog(`✅ Cleaned candidate: ${data.name}`);
                }
            }

            setStatus(`✅ Cleanup complete! Cleaned ${cleaned} candidates`);
            addLog(`🎉 Cleanup complete! Cleaned ${cleaned} candidates`);

        } catch (error: any) {
            setStatus(`❌ Cleanup failed: ${error.message}`);
            addLog(`❌ Error: ${error.message}`);
            console.error('Cleanup error:', error);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">🧹 Database Cleanup Tool</h1>
                    <p className="text-gray-600 mb-6">
                        This tool will clean all HTML pollution from the database by removing inline styles,
                        unwanted attributes, and normalizing HTML tags.
                    </p>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <p className="text-yellow-800 font-semibold">⚠️ Warning</p>
                        <p className="text-yellow-700 text-sm">
                            This will modify all candidate records in the database. Make sure you have a backup if needed.
                        </p>
                    </div>

                    <button
                        onClick={runCleanup}
                        disabled={isRunning}
                        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${isRunning
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isRunning ? '🔄 Cleaning...' : '🧹 Run Cleanup'}
                    </button>

                    {status && (
                        <div className={`mt-6 p-4 rounded-lg ${status.includes('✅') ? 'bg-green-50 text-green-800' :
                                status.includes('❌') ? 'bg-red-50 text-red-800' :
                                    'bg-blue-50 text-blue-800'
                            }`}>
                            <p className="font-semibold">{status}</p>
                        </div>
                    )}

                    {logs.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Activity Log:</h2>
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1">{log}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t">
                        <h3 className="font-semibold text-gray-800 mb-2">What this cleans:</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>✅ Removes all <code className="bg-gray-100 px-1 rounded">style</code> attributes</li>
                            <li>✅ Removes all <code className="bg-gray-100 px-1 rounded">class</code>, <code className="bg-gray-100 px-1 rounded">id</code>, <code className="bg-gray-100 px-1 rounded">dir</code> attributes</li>
                            <li>✅ Removes all <code className="bg-gray-100 px-1 rounded">aria-*</code>, <code className="bg-gray-100 px-1 rounded">data-*</code>, <code className="bg-gray-100 px-1 rounded">role</code> attributes</li>
                            <li>✅ Removes <code className="bg-gray-100 px-1 rounded">&lt;span&gt;</code> tags (keeps content)</li>
                            <li>✅ Converts <code className="bg-gray-100 px-1 rounded">&lt;div&gt;</code> to <code className="bg-gray-100 px-1 rounded">&lt;p&gt;</code></li>
                            <li>✅ Removes empty paragraphs</li>
                        </ul>
                    </div>

                    <div className="mt-6">
                        <a
                            href="/admin/dashboard"
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                            ← Back to Admin Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
