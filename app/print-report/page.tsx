'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ASSEMBLIES } from '@/data/assemblies';
import AssemblyOverview from '@/components/AssemblyOverview';
import PoliticalHistory from '@/components/PoliticalHistory';
import RetroBoothsAnalysis from '@/components/RetroBoothsAnalysis';
import CandidatePanel from '@/components/CandidatePanel';
import CurrentScenario from '@/components/CurrentScenario';

function PrintContent() {
    const searchParams = useSearchParams();
    const assemblyId = searchParams.get('assembly') || '1';
    const assemblyName = ASSEMBLIES.find(a => a.id === assemblyId)?.name || `Assembly ${assemblyId}`;

    return (
        <div className="print-container">
            {/* Header - only visible on screen, not in print */}
            <div className="no-print bg-gradient-to-r from-red-800 to-red-900 text-white p-6 mb-6">
                <h1 className="text-2xl font-bold">{assemblyName} - Complete Report</h1>
                <p className="text-red-200 mt-1">Generated on {new Date().toISOString().split('T')[0]}</p>
                <button
                    onClick={() => window.print()}
                    className="mt-4 px-6 py-2 bg-white text-red-800 rounded-lg font-medium hover:bg-red-100"
                >
                    Print / Save as PDF
                </button>
            </div>

            {/* Print Header - only in print */}
            <div className="print-only-header">
                <h1>{assemblyName} - Election Analysis Report</h1>
                <p>Generated: {new Date().toLocaleDateString()}</p>
            </div>

            {/* All Sections */}
            <div className="print-content">
                {/* Section 1: Assembly Overview */}
                <section className="print-section">
                    <div className="section-header section-header-blue">
                        <h2>1. Assembly Overview</h2>
                    </div>
                    <div className="section-content">
                        <AssemblyOverview selectedAssembly={assemblyId} />
                    </div>
                </section>

                {/* Section 2: Political History */}
                <section className="print-section page-break">
                    <div className="section-header section-header-purple">
                        <h2>2. Political History</h2>
                    </div>
                    <div className="section-content">
                        <PoliticalHistory selectedAssembly={assemblyId} />
                    </div>
                </section>

                {/* Section 3: Historical Analysis */}
                <section className="print-section page-break">
                    <div className="section-header section-header-amber">
                        <h2>3. Historical Booth Analysis</h2>
                    </div>
                    <div className="section-content">
                        <RetroBoothsAnalysis selectedAssembly={assemblyId} />
                    </div>
                </section>

                {/* Section 4: Candidate Panel */}
                <section className="print-section page-break">
                    <div className="section-header section-header-green">
                        <h2>4. Candidate Panel</h2>
                    </div>
                    <div className="section-content">
                        <CandidatePanel selectedAssembly={assemblyId} />
                    </div>
                </section>

                {/* Section 5: Current Scenario */}
                <section className="print-section page-break">
                    <div className="section-header section-header-red">
                        <h2>5. Current Political Scenario</h2>
                    </div>
                    <div className="section-content">
                        <CurrentScenario selectedAssembly={assemblyId} />
                    </div>
                </section>

                {/* Footer */}
                <div className="print-footer">
                    <p>DOCK Consulting - {assemblyName} Election Analysis Report</p>
                    <p>Confidential - For Internal Use Only</p>
                </div>
            </div>
        </div>
    );
}

export default function PrintReportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading report...</div>}>
            <PrintContent />
        </Suspense>
    );
}
