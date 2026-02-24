'use client';

import { useState } from 'react';
import { PollingStation } from '@/types/data';

interface PollingLocationFilterProps {
  pollingStations: PollingStation[];
  onSelect: (stations: PollingStation[]) => void;
}

export function PollingLocationFilter({ pollingStations, onSelect }: PollingLocationFilterProps) {
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>([]);
  const [selectedPSNames, setSelectedPSNames] = useState<string[]>([]);

  // Get unique localities
  const localities = Array.from(new Set(pollingStations.map(ps => ps.locality))).sort();
  
  // Get unique PS names
  const psNames = Array.from(new Set(pollingStations.map(ps => ps.ps_name))).sort();

  const handleLocalityChange = (locality: string, checked: boolean) => {
    const updated = checked
      ? [...selectedLocalities, locality]
      : selectedLocalities.filter(l => l !== locality);
    setSelectedLocalities(updated);
    
    // Filter stations based on selections
    const filtered = pollingStations.filter(ps => 
      updated.length === 0 || updated.includes(ps.locality)
    );
    onSelect(filtered);
  };

  const handlePSNameChange = (psName: string, checked: boolean) => {
    const updated = checked
      ? [...selectedPSNames, psName]
      : selectedPSNames.filter(p => p !== psName);
    setSelectedPSNames(updated);

    // Filter stations based on selections
    const filtered = pollingStations.filter(ps => 
      updated.length === 0 || updated.includes(ps.ps_name)
    );
    onSelect(filtered);
  };

  const handleClearAll = () => {
    setSelectedLocalities([]);
    setSelectedPSNames([]);
    onSelect(pollingStations);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Filter by Polling Location</h2>
      
      <button
        onClick={handleClearAll}
        className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
      >
        Clear All Filters
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Locality Filter */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">By Locality ({localities.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {localities.map((locality) => (
              <label key={locality} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedLocalities.includes(locality)}
                  onChange={(e) => handleLocalityChange(locality, e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">{locality}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  ({pollingStations.filter(ps => ps.locality === locality).length})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Polling Station Name Filter */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">By Polling Station ({psNames.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {psNames.map((psName) => (
              <label key={psName} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedPSNames.includes(psName)}
                  onChange={(e) => handlePSNameChange(psName, e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 truncate">{psName}</span>
                <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">
                  ({pollingStations.filter(ps => ps.ps_name === psName).length})
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
