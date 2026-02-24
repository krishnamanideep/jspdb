'use client';

import { GIData } from '@/types/data';

interface GIDashboardProps {
  giData: GIData;
}

export function GIDashboard({ giData }: GIDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Constituency Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-2">{giData.constituency} Assembly Constituency</h1>
        <p className="text-blue-100">Assembly Code: {giData.assembly_code}</p>
      </div>

      {/* Type of Seat */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Type of Seat</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-lg font-semibold text-gray-800">{giData.type_of_seat}</p>
        </div>
      </div>

      {/* Geography */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Geography</h2>
        <p className="text-gray-700 leading-relaxed">{giData.geography}</p>
      </div>

      {/* Economy */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Economy</h2>
        <p className="text-gray-700 leading-relaxed">{giData.economy}</p>
      </div>

      {/* General Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">General Information</h2>
        <p className="text-gray-700 leading-relaxed">{giData.general_info}</p>
      </div>

      {/* Assembly History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Election Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Year</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">1st (Vote%)</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">2nd (Vote%)</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">3rd (Vote%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {giData.history.map((entry) => (
                <tr key={entry.year} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{entry.year}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{entry.candidate_1st}</p>
                      <p className="text-sm text-green-600 font-bold">({entry.votes_1st.toFixed(2)}%)</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-700">{entry.candidate_2nd}</p>
                      <p className="text-sm text-blue-600">({entry.votes_2nd.toFixed(2)}%)</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-700">{entry.candidate_3rd}</p>
                      <p className="text-sm text-gray-600">({entry.votes_3rd.toFixed(2)}%)</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
