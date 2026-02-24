'use client';

import { TrendingUp, MapPin, DollarSign, Users } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  suffix?: string;
  color?: string;
}

export function StatCard({ title, value, change, icon, suffix, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-500',
    green: 'bg-green-50 text-green-500',
    red: 'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {value}
            {suffix && <span className="text-lg text-gray-600 ml-1">{suffix}</span>}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-2 flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
          )}
        </div>
        <div className={`${colorClasses[color as keyof typeof colorClasses]} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}

interface ElectionSummaryStatsProps {
  summary: {
    totalStations: number;
    constituency: string;
    totalVotes2021: number;
    avgTurnout2021: number;
    winner2021: string;
  };
}

export function ElectionSummaryStats({ summary }: ElectionSummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Total Polling Stations"
        value={summary.totalStations}
        icon={<MapPin className="w-6 h-6" />}
        color="blue"
      />
      <StatCard
        title="Constituency"
        value={summary.constituency}
        icon={<Users className="w-6 h-6" />}
        color="purple"
      />
      <StatCard
        title="Average Turnout 2021"
        value={summary.avgTurnout2021}
        suffix="%"
        icon={<TrendingUp className="w-6 h-6" />}
        color="green"
      />
      <StatCard
        title="Winner 2021"
        value={summary.winner2021}
        icon={<DollarSign className="w-6 h-6" />}
        color="red"
      />
    </div>
  );
}
