/* eslint-disable */
'use client';
import ErrorBoundary from '../../../components/ErrorBoundary';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Map,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    Trophy,
    Calendar,
    TrendingUp,
    Shield,
    Loader2
} from 'lucide-react';
import { WidgetConfigProvider } from '../../../components/admin/WidgetConfigContext';
import PollingStationEditor from '../../../components/admin/PollingStationEditor';
import SurveyEditor from '../../../components/admin/SurveyEditor';
import WidgetSettings from '../../../components/admin/WidgetSettings';
import SessionProviderWrapper from '../../../components/admin/SessionProviderWrapper';
import CandidateEditor from '../../../components/admin/CandidateEditor';
import AssemblyMetaEditor from '../../../components/admin/AssemblyMetaEditor';
import RetroBoothsEditor from '../../../components/admin/RetroBoothsEditor';
import MLAEditor from '../../../components/admin/MLAEditor';
import ElectionDataEditor from '../../../components/admin/ElectionDataEditor';
import PoliticalHistoryEditor from '../../../components/admin/PoliticalHistoryEditor';
import AssemblyOverviewEditor from '../../../components/admin/AssemblyOverviewEditor';
import UserManagement from '../../../components/admin/UserManagement';
import { ADMIN_SECTIONS } from '@/data/admin-navigation';

const ICONS: Record<string, any> = {
    stations: Map,
    users: Users,
    mlas: Trophy,
    elections: Calendar,
    candidates: Users,
    survey: FileText,
    meta: FileText,
    retrobooths: Map,
    politicalhistory: TrendingUp,
    assemblyoverview: LayoutDashboard,
    widgets: Settings
};

// JSP Star Icon for sidebar header
function JSPIcon({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="49" fill="#E31E24" />
            <polygon points="50,8 75,52 25,52" fill="none" stroke="white" strokeWidth="6" strokeLinejoin="round" />
            <polygon points="50,92 25,48 75,48" fill="none" stroke="white" strokeWidth="6" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="8" fill="white" />
        </svg>
    );
}

function AdminDashboardContent() {
    const { logout, user, loading } = useAuth();
    const isAuthenticated = !!user;
    const [activeTab, setActiveTab] = useState(ADMIN_SECTIONS[0].id);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Filter sections based on user role
    const visibleSections = ADMIN_SECTIONS.filter(section => {
        if (user?.role === 'super_admin') return true;
        if (user?.role === 'admin') {
            if (section.superAdminOnly) return false;
            if (user.accessibleAdminSections) {
                return user.accessibleAdminSections.includes(section.id);
            }
            return true;
        }
        return false;
    });

    // Ensure active tab is valid
    useEffect(() => {
        if (visibleSections.length > 0 && !visibleSections.find(s => s.id === activeTab)) {
            setActiveTab(visibleSections[0].id);
        }
    }, [visibleSections, activeTab]);

    return (
        <WidgetConfigProvider>
            <ErrorBoundary componentName="AdminDashboard Content">
                <div className="min-h-screen bg-gray-100 flex">
                    {/* Sidebar */}
                    <aside
                        className={`text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
                            } flex flex-col fixed h-full z-20`}
                        style={{ background: '#1e1e2e' }}
                    >
                        <div className="p-4 flex items-center justify-between border-b border-slate-700">
                            {isSidebarOpen && (
                                <div className="flex items-center gap-2">
                                    <JSPIcon size={28} />
                                    <span className="font-bold text-lg text-white">JSP Admin</span>
                                </div>
                            )}
                            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded">
                                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>

                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {visibleSections.map(section => {
                                const Icon = ICONS[section.id] || FileText;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveTab(section.id)}
                                        className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === section.id ? 'text-white' : 'hover:bg-slate-800'
                                            }`}
                                        style={activeTab === section.id ? { backgroundColor: '#E31E24' } : {}}
                                    >
                                        <Icon size={24} />
                                        {isSidebarOpen && <span className="ml-3">{section.label}</span>}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-slate-700">
                            {/* User Profile */}
                            {isSidebarOpen && user && (
                                <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#E31E24' }}>
                                            {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</div>
                                            <div className="text-xs text-slate-400 truncate">{user.email}</div>
                                            <div className="text-xs font-medium mt-0.5" style={{ color: '#ff6b6b' }}>
                                                {user.role === 'super_admin' ? 'Super Admin' : ((user.role || 'client').charAt(0).toUpperCase() + (user.role || 'client').slice(1))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={logout}
                                className="w-full flex items-center p-3 rounded-lg hover:bg-red-900/50 text-red-300 transition-colors"
                            >
                                <LogOut size={24} />
                                {isSidebarOpen && <span className="ml-3">Sign Out</span>}
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                        <div className="bg-white min-h-screen border border-gray-200 overflow-hidden">
                            <ErrorBoundary componentName="Active Tab Component">
                                {activeTab === 'stations' && <PollingStationEditor />}
                                {activeTab === 'users' && <UserManagement />}
                                {activeTab === 'survey' && <SurveyEditor />}
                                {activeTab === 'widgets' && <WidgetSettings />}
                                {activeTab === 'candidates' && <CandidateEditor />}
                                {activeTab === 'meta' && <AssemblyMetaEditor />}
                                {activeTab === 'retrobooths' && <RetroBoothsEditor />}
                                {activeTab === 'mlas' && <MLAEditor />}
                                {activeTab === 'elections' && <ElectionDataEditor />}
                                {activeTab === 'politicalhistory' && <PoliticalHistoryEditor />}
                                {activeTab === 'assemblyoverview' && <AssemblyOverviewEditor />}
                            </ErrorBoundary>
                        </div>
                    </main>
                </div>
            </ErrorBoundary>
        </WidgetConfigProvider>
    );
}

export default function AdminDashboard() {
    return (
        <AdminDashboardContent />
    );
}
