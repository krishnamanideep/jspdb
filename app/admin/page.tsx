/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { login, user } = useAuth();
    const isAuthenticated = !!user;

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/admin/dashboard');
        }
    }, [isAuthenticated, router]);

    if (isAuthenticated) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        setError('');

        try {
            await login(email, password);
            router.push('/admin/dashboard');
        } catch (err: any) {
            console.error(err);
            setError('Invalid email or password.');
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B0000 0%, #E31E24 50%, #C1121F 100%)' }}>
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex flex-col items-center mb-6">
                    <div className="p-3 rounded-full mb-4" style={{ background: '#fee2e2' }}>
                        <ShieldCheck className="w-8 h-8" style={{ color: '#E31E24' }} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">JSP Admin Portal</h1>
                    <p className="text-gray-500 text-sm mt-1">Authorized Personnel Only</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={localLoading}
                        className="w-full text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center"
                        style={{ background: '#E31E24' }}
                    >
                        {localLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Dashboard'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    Restricted System • IP Logged
                </div>
            </div>
        </div>
    );
}
