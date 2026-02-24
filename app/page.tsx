'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import AssemblyOverview from '@/components/AssemblyOverview';
import PoliticalHistory from '@/components/PoliticalHistory';
import RetroBoothsAnalysis from '@/components/RetroBoothsAnalysis';
import CandidatePanel from '@/components/CandidatePanel';
import CurrentScenario from '@/components/CurrentScenario';
import Survey from '@/components/Survey';
import PDFDownloader from '@/components/PDFDownloader';
import { ASSEMBLIES } from '@/data/assemblies';
import { DASHBOARD_PAGES } from '@/data/navigation';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState('overview');
    const [selectedAssembly, setSelectedAssembly] = useState('');

    // Import logout from AuthContext
    const { logout } = useAuth();

    // Calculate allowed assemblies based on user role
    const allowedAssemblies = (user?.role === 'admin' || user?.role === 'super_admin')
        ? ASSEMBLIES
        : ASSEMBLIES.filter(a => user?.accessibleAssemblies?.includes(a.id));

    // Calculate allowed pages based on user role
    const allowedPages = (user?.role === 'admin' || user?.role === 'super_admin')
        ? undefined // Undefined means all pages for admin
        : user?.accessiblePages;

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (!loading && user && (user.role === 'admin' || user.role === 'super_admin')) {
            // Redirect admins to admin dashboard
            router.push('/admin');
        }
    }, [user, loading, router]);

    // Set initial selected assembly when filtered list is ready
    useEffect(() => {
        if (allowedAssemblies && allowedAssemblies.length > 0) {
            // If currently selected assembly is not in the allowed list, select the first one
            const isCurrentValid = allowedAssemblies.find(a => a.id === selectedAssembly);
            if (!isEmpty(selectedAssembly) && !isCurrentValid) {
                setSelectedAssembly(allowedAssemblies[0].id);
            } else if (isEmpty(selectedAssembly)) {
                setSelectedAssembly(allowedAssemblies[0].id);
            }
        } else if (!loading && user && (!allowedAssemblies || allowedAssemblies.length === 0)) {
            // No access
            setSelectedAssembly('');
        }
    }, [allowedAssemblies, user, loading]);

    // Ensure current page is allowed
    useEffect(() => {
        if (allowedPages && allowedPages.length > 0) {
            if (!allowedPages.includes(currentPage)) {
                setCurrentPage(allowedPages[0]);
            }
        }
    }, [allowedPages, currentPage]);

    const isEmpty = (str: string) => !str || str.length === 0;

    if (!user || user.role === 'admin' || user.role === 'super_admin') {
        return null;
    }

    // If user has no access to any assembly
    if (allowedAssemblies && allowedAssemblies.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Access Restricted</h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">
                            You do not have access to any Assembly data yet. Please contact the administrator to request access.
                        </p>
                    </div>
                    <div className="mt-6">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If user has access to assemblies but NO pages allowed
    if (allowedPages && allowedPages.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Section Access Restricted</h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">
                            You have access to Assembly data but no specific dashboard sections are enabled for your account. Please contact support.
                        </p>
                    </div>
                    <div className="mt-6">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderPage = () => {
        // Extra safety check in case useEffect hasn't redirected yet
        if (allowedPages && !allowedPages.includes(currentPage)) {
            return <div className="p-8 text-center text-gray-500">Access Denied to this section.</div>;
        }

        switch (currentPage) {
            case 'overview':
                return <AssemblyOverview selectedAssembly={selectedAssembly} />;
            case 'political-history':
                return <PoliticalHistory selectedAssembly={selectedAssembly} />;
            case 'retro-booths':
                return <RetroBoothsAnalysis selectedAssembly={selectedAssembly} />;
            case 'candidates':
                return <CandidatePanel selectedAssembly={selectedAssembly} />;
            case 'current-scenario':
                return <CurrentScenario selectedAssembly={selectedAssembly} />;
            case 'survey':
                return <Survey selectedAssembly={selectedAssembly} />;
            default:
                return <AssemblyOverview selectedAssembly={selectedAssembly} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                allowedPages={allowedPages}
                user={user ? {
                    displayName: user.displayName || undefined,
                    email: user.email || undefined,
                    role: user.role
                } : undefined}
                onLogout={async () => {
                    await logout();
                    router.push('/login');
                }}
            />

            {/* Assembly Selector & Actions */}
            <div className="bg-white shadow-sm border-b">
                <div className="w-full px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <label className="font-semibold text-gray-700">Select Assembly:</label>
                            <select
                                value={selectedAssembly}
                                onChange={(e) => setSelectedAssembly(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            >
                                {allowedAssemblies?.map((ac) => (
                                    <option key={ac.id} value={ac.id}>
                                        {ac.id}. {ac.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* PDF Downloader */}
                        <div className="flex gap-2">
                            <PDFDownloader selectedAssembly={selectedAssembly} onPageChange={setCurrentPage} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="w-full px-6">
                {renderPage()}
            </main>
        </div>
    );
}
