'use client';

import { PollingStation } from '@/types/data';

interface LocationTableProps {
  pollingStations: PollingStation[];
}

export function LocationTable({ pollingStations }: LocationTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Polling Stations</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">PS No</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Polling Station</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Locality</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Strongest Party</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">2021 Winner</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Winner %</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Coordinates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pollingStations.map((station) => {
              const results2021 = station.election2021?.candidates || {};
              const winner = Object.entries(results2021).reduce((a, b) =>
                (b[1] as number) > (a[1] as number) ? b : a
              );

              return (
                <tr key={station.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{station.ps_no}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{station.ps_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{station.locality}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-purple-600 bg-purple-50">{station.category || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600 bg-green-50">{station.strongestParty || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">{winner?.[0] || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {winner ? `${(winner[1] as number).toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
