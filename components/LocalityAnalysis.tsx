'use client';

import { PollingStation } from '@/types/data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LocalityAnalysisProps {
  pollingStations: PollingStation[];
}

export function LocalityAnalysis({ pollingStations }: LocalityAnalysisProps) {
  // Group by locality
  const localityData = pollingStations.reduce(
    (acc: Record<string, any>, station) => {
      if (!acc[station.locality]) {
        acc[station.locality] = {
          locality: station.locality,
          stations: 0,
          ainrc: 0,
          inc: 0,
          vigeswaran: 0,
          totalVotes: 0,
        };
      }
      acc[station.locality].stations += 1;
      if (station.election2021) {
        acc[station.locality].ainrc += station.election2021.candidates.AINRC || 0;
        acc[station.locality].inc += station.election2021.candidates.INC || 0;
        acc[station.locality].vigeswaran += station.election2021.candidates.VIGESWARAN || 0;
        acc[station.locality].totalVotes += 1;
      }
      return acc;
    },
    {}
  );

  // Calculate averages
  const chartData = Object.values(localityData)
    .map((item: any) => ({
      name: item.locality,
      'AINRC %': (item.ainrc / item.totalVotes).toFixed(2),
      'INC %': (item.inc / item.totalVotes).toFixed(2),
      'VIGESWARAN %': (item.vigeswaran / item.totalVotes).toFixed(2),
      stations: item.stations,
    }))
    .sort((a: any, b: any) => b.stations - a.stations);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Locality-wise Analysis</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="AINRC %" fill="#3b82f6" name="AINRC %" />
            <Bar dataKey="INC %" fill="#ef4444" name="INC %" />
            <Bar dataKey="VIGESWARAN %" fill="#10b981" name="VIGESWARAN %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Locality Details Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Locality Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Locality</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Polling Stations</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Avg AINRC %</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Avg INC %</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Avg VIGESWARAN %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.values(localityData)
                .sort((a: any, b: any) => b.stations - a.stations)
                .map((item: any) => (
                  <tr key={item.locality} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.locality}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{item.stations}</td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600">
                      {(item.ainrc / item.totalVotes).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-red-600">
                      {(item.inc / item.totalVotes).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-green-600">
                      {(item.vigeswaran / item.totalVotes).toFixed(2)}%
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
