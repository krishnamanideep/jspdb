'use client';

import { SurveyData } from '@/types/data';
import {
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

interface SurveyReportProps {
  surveyData: SurveyData;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

export function SurveyReport({ surveyData }: SurveyReportProps) {
  const generalSurveyData = [
    { name: 'High Impact', value: surveyData.general_survey.high_impact },
    { name: 'Low Impact', value: surveyData.general_survey.low_impact },
    { name: 'No Opinion', value: surveyData.general_survey.no_opinion },
  ];

  const yesNoData = [
    { name: 'Yes', value: surveyData.yesno_survey.yes },
    { name: 'No', value: surveyData.yesno_survey.no },
  ];

  const genderData = surveyData.gender_response.map(item => ({
    gender: item.gender === 'F' ? 'Female' : item.gender === 'M' ? 'Male' : 'Transgender',
    'High Impact': item.high_impact,
    'Low Impact': item.low_impact,
    'No Opinion': item.no_opinion,
  }));

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold">Survey Report</h1>
        <p className="text-green-100 mt-2">Comprehensive survey analysis across demographics</p>
      </div>

      {/* General Survey Report */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">General Survey Report</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={generalSurveyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {generalSurveyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => typeof value === 'number' ? `${value.toFixed(2)}%` : String(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            {generalSurveyData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-4">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: COLORS[idx] }}
                ></div>
                <span className="font-semibold text-gray-700">{item.name}</span>
                <span className="text-lg font-bold text-gray-900">{item.value.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yes/No Survey */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Yes/No Survey Report</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={yesNoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {yesNoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => typeof value === 'number' ? `${value.toFixed(2)}%` : String(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            {yesNoData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-4">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: idx === 0 ? '#10b981' : '#ef4444' }}
                ></div>
                <span className="font-semibold text-gray-700">{item.name}</span>
                <span className="text-lg font-bold text-gray-900">{item.value.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gender Samples */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gender Samples</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Female</p>
            <p className="text-3xl font-bold text-blue-600">{surveyData.gender_samples.F.toFixed(1)}%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Male</p>
            <p className="text-3xl font-bold text-purple-600">{surveyData.gender_samples.M.toFixed(1)}%</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Transgender</p>
            <p className="text-3xl font-bold text-pink-600">{surveyData.gender_samples.T.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Gender Response Survey */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gender/Response Survey Report</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={genderData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="gender" />
            <YAxis />
            <Tooltip formatter={(value: unknown) => typeof value === 'number' ? `${value.toFixed(2)}%` : String(value)} />
            <Legend />
            <Bar dataKey="High Impact" fill="#ef4444" />
            <Bar dataKey="Low Impact" fill="#f59e0b" />
            <Bar dataKey="No Opinion" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Caste Age Survey */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Agewise Survey Report</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Category</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Yes/High Impact %</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Yes/Low Impact %</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">No Opinion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {surveyData.caste_age_survey.map((item) => (
                <tr key={item.caste_age} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{item.caste_age}</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">{item.high_impact.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-center text-orange-600 font-semibold">{item.low_impact.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-center text-blue-600 font-semibold">{item.no_opinion.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandaram Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mandaram Overview Survey Report</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Mandaram</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Yes/High Impact %</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Yes/Low Impact %</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">No Opinion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {surveyData.mandaram_overview.map((item) => (
                <tr key={item.mandaram} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{item.mandaram}</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">{item.high_impact.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-center text-orange-600 font-semibold">{item.low_impact.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-center text-blue-600 font-semibold">{item.no_opinion.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
