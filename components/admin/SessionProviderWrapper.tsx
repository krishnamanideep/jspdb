'use client';

import { AuthProvider } from '@/context/AuthContext';

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
