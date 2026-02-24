'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'admin' && user.role !== 'super_admin') {
                router.push('/'); // Redirect non-admins to client dashboard
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return null; // Don't render protected content while redirecting
    }

    return (
        <>
            {children}
        </>
    );
}
