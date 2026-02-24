'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// JSP Flag Star Icon
function JSPIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="49" fill="#E31E24" />
            <circle cx="50" cy="50" r="46" fill="#E31E24" stroke="white" strokeWidth="4" />
            <polygon points="50,8 75,52 25,52" fill="none" stroke="white" strokeWidth="4" strokeLinejoin="round" />
            <polygon points="50,92 25,48 75,48" fill="none" stroke="white" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="8" fill="white" />
        </svg>
    );
}

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            if (user.role === 'admin' || user.role === 'super_admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
        }
    }, [user, router]);

    if (user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            const userData = await login(email, password);

            // Direct role-based redirection
            if (userData.role === 'admin' || userData.role === 'super_admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/user-not-found') {
                setError('User not found. Please contact the administrator.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Invalid password.');
            } else {
                setError(`Login failed: ${err.code || err.message}`);
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #8B0000 0%, #E31E24 50%, #C1121F 100%)' }}
        >
            {/* Background decorative circles */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', filter: 'blur(60px)' }} />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', filter: 'blur(60px)' }} />

            {/* Login Card */}
            <div className="relative w-full max-w-md mx-4">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="px-8 pt-10 pb-6 text-center"
                        style={{ background: 'linear-gradient(135deg, #E31E24 0%, #8B0000 100%)' }}
                    >
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <JSPIcon />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">JSP Dashboard</h1>
                        <p className="text-red-200 text-sm mt-1 font-medium">Jana Sena Party — Andhra Pradesh</p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
                            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                <p className="text-red-700 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all pr-12"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: isLoggingIn ? '#aaa' : 'linear-gradient(135deg, #E31E24 0%, #8B0000 100%)' }}
                            >
                                {isLoggingIn ? 'Signing in...' : 'Sign In to Dashboard'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-400">
                                🔒 Secure access • Authorized personnel only
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom label */}
                <div className="text-center mt-6">
                    <p className="text-white/60 text-xs">
                        © 2025 Jana Sena Party • All rights reserved
                    </p>
                </div>
            </div>
        </div>
    );
}
