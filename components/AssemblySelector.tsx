'use client';

import { ASSEMBLIES } from '@/lib/assemblies';

interface AssemblySelectorProps {
  selectedAssembly: number;
  onSelect: (assemblyId: number) => void;
}

export function AssemblySelector({ selectedAssembly, onSelect }: AssemblySelectorProps) {
  // Group by district
  const districts = Array.from(new Set(ASSEMBLIES.map(a => a.district)));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Select Assembly</h2>
      
      <div className="space-y-4">
        {districts.map((district) => {
          const assemblyList = ASSEMBLIES.filter(a => a.district === district);
          return (
            <div key={district}>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
                {district}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {assemblyList.map((assembly) => (
                  <button
                    key={assembly.id}
                    onClick={() => onSelect(assembly.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      selectedAssembly === assembly.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {assembly.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
