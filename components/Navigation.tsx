'use client';

import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { DASHBOARD_PAGES } from '@/data/navigation';

interface NavigationProps {
    currentPage: string;
    onPageChange: (page: string) => void;
    allowedPages?: string[];
    user?: {
        displayName?: string;
        email?: string;
        role?: string;
    };
    onLogout?: () => void;
}

// JSP Flag Icon inline SVG
function JSPIcon({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="49" fill="#E31E24" />
            <circle cx="50" cy="50" r="46" fill="#E31E24" stroke="white" strokeWidth="4" />
            <polygon points="50,8 75,52 25,52" fill="none" stroke="white" strokeWidth="4" strokeLinejoin="round" />
            <polygon points="50,92 25,48 75,48" fill="none" stroke="white" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="8" fill="white" />
        </svg>
    );
}

export default function Navigation({ currentPage, onPageChange, allowedPages, user, onLogout }: NavigationProps) {
    const [isOpen, setIsOpen] = useState(false);

    // If allowedPages is provided, filter the pages. Otherwise show all
    const visiblePages = allowedPages
        ? DASHBOARD_PAGES.filter(page => allowedPages.includes(page.id))
        : DASHBOARD_PAGES;

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="w-full px-6">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <JSPIcon size={32} />
                        <h1 className="text-xl font-bold" style={{ color: '#E31E24' }}>JSP Dashboard</h1>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center flex-wrap gap-1">
                        {visiblePages.map((page) => (
                            <button
                                key={page.id}
                                onClick={() => onPageChange(page.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === page.id
                                    ? 'text-white'
                                    : 'text-gray-700 hover:bg-red-50'
                                    }`}
                                style={currentPage === page.id ? { backgroundColor: '#E31E24' } : {}}
                            >
                                {page.label}
                            </button>
                        ))}

                        {/* User Profile */}
                        {user && (
                            <div className="ml-4 flex items-center gap-3 pl-4 border-l border-gray-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: '#E31E24' }}>
                                        {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-900">{user.displayName || 'User'}</div>
                                        <div className="text-xs text-gray-500">{user.role?.replaceAll('_', ' ').toUpperCase()}</div>
                                    </div>
                                </div>
                                {onLogout && (
                                    <button
                                        onClick={onLogout}
                                        className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-700 hover:text-red-600"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden pb-4">
                        {visiblePages.map((page) => (
                            <button
                                key={page.id}
                                onClick={() => {
                                    onPageChange(page.id);
                                    setIsOpen(false);
                                }}
                                className={`block w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === page.id
                                    ? 'text-white'
                                    : 'text-gray-700 hover:bg-red-50'
                                    }`}
                                style={currentPage === page.id ? { backgroundColor: '#E31E24' } : {}}
                            >
                                {page.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
