'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { PollingStation } from '@/types/data';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { processLocalPollingData } from '@/utils/dataProcessing';
import { TrendingUp, AlertTriangle, Info, Lightbulb, Star, Zap, Award, FileText, Trophy } from 'lucide-react';

interface Insight {
  id?: string;
  title: string;
  content: string;
  type: 'highlight' | 'trend' | 'warning' | 'info';
  order: number;
}

interface CustomCard {
  id?: string;
  title: string;
  content: string;
  icon: string;
  color: string;
  order: number;
}

interface PreviewData {
  historyNarrative?: string;
  showElectoralTrends?: boolean;
  showVoteSwing?: boolean;
  showInsights?: boolean;
  showCustomCards?: boolean;
  insights?: Insight[];
  customCards?: CustomCard[];
}

export default function PoliticalHistory({ selectedAssembly, previewData }: { selectedAssembly: string, previewData?: PreviewData }) {
  const [data, setData] = useState<PollingStation[]>([]);
  const [config, setConfig] = useState<PreviewData>({
    showElectoralTrends: true,
    showVoteSwing: true,
    showInsights: true,
    showCustomCards: true,
    insights: [],
    customCards: []
  });
  const [trends, setTrends] = useState<{
    trendData: { year: string;[party: string]: string }[];
    swingData: { party: string; swing: string }[];
    narrative?: string;
  } | null>(null);
  const [mlas, setMlas] = useState<{
    '2021': any[];
    '2016': any[];
    '2011': any[];
  }>({ '2021': [], '2016': [], '2011': [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyzeTrends = (booths: PollingStation[], narrative?: string) => {
    const years = ['2011', '2016', '2021'] as const;
    const parties = ['NRC', 'DMK', 'AIADMK', 'BJP', 'PMK', 'IND', 'OTHERS'];

    const trendData = years.map((year) => {
      const yearData: { year: string;[party: string]: any } = { year };

      const electionKey = `election${year}` as keyof PollingStation;
      const totalVotesInAssembly = booths.reduce((sum, b) => {
        const election = b[electionKey] as any;
        return sum + (election?.total_votes || 0);
      }, 0);

      parties.forEach((party) => {
        let totalPartyVotes = 0;
        booths.forEach((b) => {
          const election = b[electionKey] as any;
          if (election?.candidates && election.total_votes) {
            const share = election.candidates[party] || 0;
            totalPartyVotes += election.total_votes * share;
          }
        });

        const percentage = totalVotesInAssembly > 0
          ? ((totalPartyVotes / totalVotesInAssembly) * 100).toFixed(2)
          : '0.00';

        yearData[party] = percentage;
        yearData[`${party}_avg_votes`] = booths.length > 0
          ? (totalPartyVotes / booths.length).toFixed(0)
          : '0';
      });

      return yearData;
    });

    const calculateSwingForYearRange = (y1: '2011' | '2016' | '2021', y2: '2011' | '2016' | '2021') => {
      const d1 = trendData.find(d => d.year === y1);
      const d2 = trendData.find(d => d.year === y2);

      return parties.slice(0, 5).map(party => {
        const p1 = parseFloat(d1?.[party] || '0');
        const p2 = parseFloat(d2?.[party] || '0');
        return { party, swing: (p2 - p1).toFixed(2) };
      }).filter(p => p.swing !== '0.00');
    };

    const swingData = [
      ...calculateSwingForYearRange('2011', '2016'),
      ...calculateSwingForYearRange('2016', '2021')
    ];

    setTrends({
      trendData,
      swingData,
      narrative,
    });
  };

  useEffect(() => {
    setLoading(true);
    if (previewData) {
      setConfig(previewData);
    }

    const fetchData = async () => {
      try {
        setError(null);

        // 1. Load Polling Data (Local)
        const assemblyData = processLocalPollingData(selectedAssembly);
        setData(assemblyData);

        // 2. Load MLAs (Firestore)
        // Note: Assuming 'mlas' collection exists. If fetching by query fails, we handle gracefully.
        let fetchedMlas: any[] = [];
        try {
          const q = query(collection(db, 'mlas'), where('assemblyId', '==', selectedAssembly));
          const querySnapshot = await getDocs(q);
          fetchedMlas = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn('Error fetching MLAs:', e);
        }

        // Group MLAs by year
        const mlasByYear: any = { '2021': [], '2016': [], '2011': [] };
        fetchedMlas.forEach((m: any) => {
          if (mlasByYear[m.year]) mlasByYear[m.year].push(m);
        });

        // Sort each year
        ['2021', '2016', '2011'].forEach(year => {
          mlasByYear[year].sort((a: any, b: any) => (b.voteShare || 0) - (a.voteShare || 0));
        });
        setMlas(mlasByYear);


        if (!previewData) {
          // 3. Load Meta & Config (Firestore)
          const metaRef = doc(db, 'assemblyMeta', selectedAssembly);
          const configRef = doc(db, 'pageConfig', `politicalHistoryConfig_${selectedAssembly}`);

          const [metaSnap, configSnap] = await Promise.all([
            getDoc(metaRef),
            getDoc(configRef)
          ]);

          const meta = metaSnap.exists() ? metaSnap.data() : {};
          const pageConfig = configSnap.exists() ? configSnap.data() : {};

          setConfig({
            historyNarrative: meta?.historyNarrative,
            showElectoralTrends: pageConfig?.showElectoralTrends ?? true,
            showVoteSwing: pageConfig?.showVoteSwing ?? true,
            showInsights: pageConfig?.showInsights ?? true,
            showCustomCards: pageConfig?.showCustomCards ?? true,
            insights: pageConfig?.insights || [],
            customCards: pageConfig?.customCards || []
          });
          analyzeTrends(assemblyData, meta?.historyNarrative);
        } else {
          analyzeTrends(assemblyData, previewData.historyNarrative);
        }
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedAssembly, previewData]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'highlight': return <Lightbulb size={16} className="text-yellow-600" />;
      case 'trend': return <TrendingUp size={16} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-red-600" />;
      default: return <Info size={16} className="text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'highlight': return 'bg-yellow-50 border-yellow-200';
      case 'trend': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getCardIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <Star size={20} />;
      case 'zap': return <Zap size={20} />;
      case 'award': return <Award size={20} />;
      case 'info': return <Info size={20} />;
      case 'trend': return <TrendingUp size={20} />;
      case 'file': return <FileText size={20} />;
      default: return <Star size={20} />;
    }
  };

  const getCardColorClass = (colorName: string) => {
    switch (colorName) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      case 'indigo': return 'bg-indigo-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading political history...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error loading data: {error}</div>;
  }

  if (!data.length || !trends) {
    return <div className="p-8 text-center">No data available for Assembly {selectedAssembly}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Assembly {selectedAssembly} - Political History &amp; Dynamics</h2>

      {/* Past Election Results Table - Enhanced UI */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl overflow-hidden border border-blue-100">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h3 className="text-2xl font-extrabold text-white text-center tracking-tight flex items-center justify-center gap-3">
            <Trophy className="text-yellow-300" size={28} />
            Past Election Results
          </h3>
          <p className="text-blue-100 text-center text-sm mt-1">Top 3 Candidates by Vote Share</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-blue-200">
                <th className="px-8 py-5 text-left font-bold text-gray-800 text-base">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-blue-600" />
                    Election Year
                  </div>
                </th>
                <th className="px-8 py-5 text-left font-bold text-gray-800 text-base">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                    Winner
                  </div>
                </th>
                <th className="px-8 py-5 text-left font-bold text-gray-800 text-base">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-bold">2</div>
                    Runner-up
                  </div>
                </th>
                <th className="px-8 py-5 text-left font-bold text-gray-800 text-base">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">3</div>
                    Third Place
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {['2021', '2016', '2011'].map((year, idx) => {
                const yearMlas = mlas[year as '2021' | '2016' | '2011'];
                const first = yearMlas[0];
                const second = yearMlas[1];
                const third = yearMlas[2];

                const getPartyBadgeColor = (party: string) => {
                  switch (party) {
                    case 'BJP': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
                    case 'DMK': return 'bg-gradient-to-r from-red-600 to-red-700 text-white';
                    case 'AIADMK': return 'bg-gradient-to-r from-green-600 to-green-700 text-white';
                    case 'INC': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
                    case 'NR Congress': case 'NRC': return 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white';
                    case 'PMK': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
                    case 'IND': return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
                    default: return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
                  }
                };

                return (
                  <tr
                    key={year}
                    className={`border-b border-blue-100 hover:bg-blue-50/50 transition-all duration-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-lg">{year.slice(2)}</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{year}</div>
                          <div className="text-xs text-gray-500">Assembly Election</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {first ? (
                        <div className="flex items-start gap-3">
                          <Trophy size={20} className="text-yellow-500 mt-1 flex-shrink-0" />
                          <div>
                            <div className="font-bold text-gray-900 text-base leading-tight mb-1">{first.name}</div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getPartyBadgeColor(first.party)}`}>
                                {first.party}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-1 rounded inline-block">
                              {first.voteShare?.toFixed(2) || '0.00'}% votes
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">No data available</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {second ? (
                        <div className="flex items-start gap-3">
                          <Award size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-gray-800 text-base leading-tight mb-1">{second.name}</div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getPartyBadgeColor(second.party)}`}>
                                {second.party}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                              {second.voteShare?.toFixed(2) || '0.00'}% votes
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">No data available</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {third ? (
                        <div className="flex items-start gap-3">
                          <Star size={18} className="text-orange-400 mt-1 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-700 text-base leading-tight mb-1">{third.name}</div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getPartyBadgeColor(third.party)}`}>
                                {third.party}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                              {third.voteShare?.toFixed(2) || '0.00'}% votes
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">No data available</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-4 border-t border-blue-200">
          <p className="text-xs text-blue-700 text-center">
            <Info size={14} className="inline mr-1" />
            Data sourced from official election records. Vote percentages represent the candidate's share of total votes polled.
          </p>
        </div>
      </div>

      {/* Electoral Trends */}
      {config.showElectoralTrends !== false && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Electoral Trends (2011-2021)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trends.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis label={{ value: 'Vote Share %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="BJP" stroke="#FF6B35" strokeWidth={2} />
              <Line type="monotone" dataKey="DMK" stroke="#E63946" strokeWidth={2} />
              <Line type="monotone" dataKey="AIADMK" stroke="#06A77D" strokeWidth={2} />
              <Line type="monotone" dataKey="NRC" stroke="#0077B6" strokeWidth={2} />
              <Line type="monotone" dataKey="PMK" stroke="#FFC300" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Swing Analysis */}
      {config.showVoteSwing !== false && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Vote Swing (2011 → 2016)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.swingData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="party" />
                <YAxis label={{ value: 'Swing %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="swing" fill="#8884d8">
                  {trends.swingData.slice(0, 5).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.swing > 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Vote Swing (2016 → 2021)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.swingData.slice(5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="party" />
                <YAxis label={{ value: 'Swing %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="swing" fill="#8884d8">
                  {trends.swingData.slice(5).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.swing > 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Party Performance Table */}
      <div className="bg-white p-6 rounded-lg shadow overflow-hidden">
        <h3 className="text-xl font-semibold mb-4">Historical Party Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold text-gray-700">Party</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center" colSpan={2}>2021 Election</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center" colSpan={2}>2016 Election</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center" colSpan={2}>2011 Election</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="px-4 py-2"></th>
                <th className="px-2 py-2 text-right border-l">Vote %</th>
                <th className="px-2 py-2 text-right">Avg Votes</th>
                <th className="px-2 py-2 text-right border-l">Vote %</th>
                <th className="px-2 py-2 text-right">Avg Votes</th>
                <th className="px-2 py-2 text-right border-l">Vote %</th>
                <th className="px-2 py-2 text-right">Avg Votes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {['NRC', 'DMK', 'AIADMK', 'BJP', 'PMK', 'IND', 'OTHERS'].map((party) => {
                const getYearData = (year: string) => trends.trendData.find(d => d.year === year);
                const d2021 = getYearData('2021');
                const d2016 = getYearData('2016');
                const d2011 = getYearData('2011');

                // Helper to get average votes per booth for that party
                const getAvgVotes = (year: string) => {
                  const yearData = getYearData(year);
                  return yearData?.[`${party}_avg_votes`] || '0';
                };

                return (
                  <tr key={party} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${party === 'BJP' ? 'bg-[#FF6B35]' :
                          party === 'DMK' ? 'bg-[#E63946]' :
                            party === 'AIADMK' ? 'bg-[#06A77D]' :
                              party === 'NRC' ? 'bg-[#0077B6]' :
                                party === 'PMK' ? 'bg-[#FFC300]' : 'bg-gray-400'
                          }`} />
                        <span className="font-medium text-gray-900">{party}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right text-gray-900 font-medium border-l border-gray-50">{d2021?.[party] || '0.00'}%</td>
                    <td className="px-2 py-3 text-right text-sm text-gray-500">{getAvgVotes('2021')}</td>
                    <td className="px-2 py-3 text-right text-gray-900 font-medium border-l border-gray-50">{d2016?.[party] || '0.00'}%</td>
                    <td className="px-2 py-3 text-right text-sm text-gray-500">{getAvgVotes('2016')}</td>
                    <td className="px-2 py-3 text-right text-gray-900 font-medium border-l border-gray-50">{d2011?.[party] || '0.00'}%</td>
                    <td className="px-2 py-3 text-right text-sm text-gray-500">{getAvgVotes('2011')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Dynamics & Insights */}
      {config.showInsights !== false && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Key Dynamics &amp; Insights</h3>
          <div className="prose max-w-none">
            {config.historyNarrative ? (
              <div dangerouslySetInnerHTML={{ __html: config.historyNarrative }} />
            ) : config.insights && config.insights.length > 0 ? (
              <div className="space-y-3 not-prose">
                {config.insights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                      <div>
                        {insight.title && <div className="font-semibold text-gray-800">{insight.title}</div>}
                        <div className="text-gray-700">{insight.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>
                    <strong>2011-2016:</strong> Major shifts in party preferences with{' '}
                    {trends.swingData.slice(0, 5).find((s: any) => s.swing > 0)?.party || 'multiple parties'} gaining ground.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>
                    <strong>Historical Pattern:</strong> The constituency shows fluid voter behavior with no single party dominance across all three elections.
                  </span>
                </li>
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Custom Cards */}
      {config.showCustomCards !== false && config.customCards && config.customCards.length > 0 && (
        <div className="space-y-6">
          {config.customCards.map((card, index) => (
            <div
              key={index}
              className={`p-8 rounded-2xl border-2 transition-all hover:shadow-lg bg-white border-gray-100 shadow-gray-100/30`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 rounded-xl text-white ${getCardColorClass(card.color)}`}>
                  {(() => {
                    const iconName = card.icon;
                    switch (iconName) {
                      case 'star': return <Star size={28} strokeWidth={2.5} />;
                      case 'zap': return <Zap size={28} strokeWidth={2.5} />;
                      case 'award': return <Award size={28} strokeWidth={2.5} />;
                      case 'info': return <Info size={28} strokeWidth={2.5} />;
                      case 'trend': return <TrendingUp size={28} strokeWidth={2.5} />;
                      case 'file': return <FileText size={28} strokeWidth={2.5} />;
                      default: return <Star size={28} strokeWidth={2.5} />;
                    }
                  })()}
                </div>
                <h4 className="font-extrabold text-gray-900 text-2xl tracking-tight leading-tight">{card.title}</h4>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap break-words pl-1" dangerouslySetInnerHTML={{ __html: card.content }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
