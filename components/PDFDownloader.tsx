'use client';

import { useState } from 'react';
import { Download, Printer, X, FileText, ExternalLink } from 'lucide-react';
import { ASSEMBLIES } from '@/data/assemblies';

interface PDFDownloaderProps {
    selectedAssembly: string;
    onPageChange?: (page: string) => void;
}

export default function PDFDownloader({ selectedAssembly }: PDFDownloaderProps) {
    const [showModal, setShowModal] = useState(false);

    const assemblyName = ASSEMBLIES.find(a => a.id === selectedAssembly)?.name || `Assembly ${selectedAssembly}`;

    const openPrintView = () => {
        // Open the print report page with all sections
        window.open(`/print-report?assembly=${selectedAssembly}`, '_blank');
        setShowModal(false);
    };

    const printCurrentPage = () => {
        window.print();
        setShowModal(false);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md no-print"
            >
                <Download size={18} />
                <span>Download PDF</span>
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Download PDF Report</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Assembly:</strong> {assemblyName}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {/* Main option - All Pages */}
                            <button
                                onClick={openPrintView}
                                className="w-full px-4 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-3 text-left"
                            >
                                <FileText size={24} />
                                <div>
                                    <div className="font-semibold">Download Complete Report</div>
                                    <div className="text-sm text-red-200">All 5 sections in one PDF</div>
                                </div>
                                <ExternalLink size={18} className="ml-auto" />
                            </button>

                            {/* Secondary option */}
                            <button
                                onClick={printCurrentPage}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                            >
                                <Printer size={20} className="text-gray-500" />
                                <div className="text-left">
                                    <div className="font-medium text-gray-700">Print Current Page Only</div>
                                    <div className="text-xs text-gray-500">Quick print of visible content</div>
                                </div>
                            </button>

                            <div className="text-center text-gray-400 text-xs mt-2">
                                In the print dialog, select "Save as PDF" as destination
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
