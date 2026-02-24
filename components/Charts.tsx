'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CandidatePerformance, RegionalStats } from '@/types/data';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

interface CandidateComparisonChartProps {
  data: CandidatePerformance[];
}

export function CandidateComparisonChart({ data }: CandidateComparisonChartProps) {
  const chartData = data.map(item => ({
    name: item.name,
    '2011': item.votes_2011,
    '2016': item.votes_2016,
    '2021': item.votes_2021,
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Candidate Performance Across Elections</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: unknown) => typeof value === 'number' ? `${value.toFixed(2)}%` : String(value)} />
          <Legend />
          <Bar dataKey="2011" fill="#3b82f6" name="2011" radius={[8, 8, 0, 0]} />
          <Bar dataKey="2016" fill="#f59e0b" name="2016" radius={[8, 8, 0, 0]} />
          <Bar dataKey="2021" fill="#10b981" name="2021" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ElectionTrendChartProps {
  data: RegionalStats[];
}

export function ElectionTrendChart({ data }: ElectionTrendChartProps) {
  const chartData = data.map(item => ({
    year: item.year,
    winner_votes: item.winnerVotes,
    turnout: item.avgTurnout,
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Winner&apos;s Vote Share Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip formatter={(value: unknown) => typeof value === 'number' ? `${value.toFixed(2)}%` : String(value)} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="winner_votes"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 5 }}
            name="Winner's Vote %"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="turnout"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 5 }}
            name="Avg Turnout %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CandidateVotePieChartProps {
  data: CandidatePerformance[];
  year: 2011 | 2016 | 2021;
}

export function CandidateVotePieChart({ data, year }: CandidateVotePieChartProps) {
  const voteKey = year === 2011 ? 'votes_2011' : year === 2016 ? 'votes_2016' : 'votes_2021';
  const pieData = data.map(item => ({
    name: item.name,
    value: parseFloat(item[voteKey as keyof CandidatePerformance].toString()),
  })).filter(d => d.value > 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Vote Share - {year}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: unknown) => typeof value === 'number' ? `${value.toFixed(2)}%` : String(value)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
