import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Target, Users, Zap, BarChart3, Flag, MessageCircle } from 'lucide-react';
import { getAssemblyName } from '@/data/assemblies';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

const ICON_MAP: any = {
  users: <Users className="w-8 h-8" />,
  alert: <AlertCircle className="w-8 h-8" />,
  target: <Target className="w-8 h-8" />,
  trending: <TrendingUp className="w-8 h-8" />,
  zap: <Zap className="w-8 h-8" />,
  bar: <BarChart3 className="w-8 h-8" />,
  flag: <Flag className="w-8 h-8" />,
  message: <MessageCircle className="w-8 h-8" />
};

// Static color maps — dynamic Tailwind class names get purged at build time
const BORDER_COLOR_MAP: Record<string, string> = {
  blue: '#2563eb', red: '#dc2626', green: '#16a34a',
  orange: '#ea580c', purple: '#9333ea', gray: '#4b5563', yellow: '#ca8a04'
};
const ICON_BG_CLASS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600',
  green: 'bg-green-50 text-green-600', orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600', gray: 'bg-gray-50 text-gray-600',
  yellow: 'bg-yellow-50 text-yellow-600'
};
const STATUS_CLASS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800', red: 'bg-red-100 text-red-800',
  green: 'bg-green-100 text-green-800', orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800', gray: 'bg-gray-100 text-gray-800',
  yellow: 'bg-yellow-100 text-yellow-800'
};
const BAR_COLOR_CLASS: Record<string, string> = {
  orange: 'bg-orange-500', red: 'bg-red-500', green: 'bg-green-500',
  blue: 'bg-blue-500', gray: 'bg-gray-500', purple: 'bg-purple-500'
};

export default function CurrentScenario({ selectedAssembly, previewData }: { selectedAssembly: string, previewData?: any }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (previewData) {
      setData(previewData);
      return;
    }

    const fetchData = async () => {
      try {
        const docRef = doc(db, 'assemblyMeta', selectedAssembly);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching scenario data:', error);
      }
    };

    fetchData();
  }, [selectedAssembly, previewData]);

  const scenarios = data?.scenarios || [
    { title: 'Coalition Dynamics', icon: 'users', content: 'BJP-led NDA alliance...', status: 'Active', color: 'blue' },
    { title: 'Key Issues', icon: 'alert', content: 'Unemployment...', status: 'Critical', color: 'red' },
    { title: 'Vote Bank Analysis', icon: 'target', content: 'Urban-rural divide...', status: 'Evolving', color: 'green' },
    { title: 'Campaign Momentum', icon: 'trending', content: 'BJP gaining ground...', status: 'Shifting', color: 'orange' }
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">{getAssemblyName(selectedAssembly)} - {data?.headers?.pageTitle || 'Current Political Scenario'}</h2>

      {/* Scenario Cards */}
      <h3 className="text-xl font-semibold mb-2 text-gray-700 hidden">{data?.headers?.scenariosTitle || 'Current Scenarios'}</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {scenarios.map((scenario: any, idx: number) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-lg border-l-4 flex flex-col overflow-hidden"
            style={{ borderColor: BORDER_COLOR_MAP[scenario.color] || '#3b82f6' }}
          >
            {/* Card header */}
            <div className="p-6 flex items-start gap-4 flex-shrink-0">
              <div className={`p-3 rounded-lg flex-shrink-0 ${ICON_BG_CLASS[scenario.color] || 'bg-blue-50 text-blue-600'}`}>
                {ICON_MAP[scenario.icon] || <Users className="w-8 h-8" />}
              </div>
              <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                <h3 className="text-lg font-semibold text-gray-800 break-words min-w-0">{scenario.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_CLASS[scenario.color] || 'bg-blue-100 text-blue-800'}`}>
                  {scenario.status}
                </span>
              </div>
            </div>
            {/* Card content — separate scrollable zone, capped at 300px */}
            <div className="px-6 pb-6 overflow-y-auto max-h-[300px]">
              <p
                className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-x-hidden"
                dangerouslySetInnerHTML={{ __html: scenario.content }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Ground Reports */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">{data?.headers?.reportsTitle || 'Recent Ground Reports'}</h3>
        <div className="space-y-4">
          {data?.groundReports?.map((report: any, idx: number) => (
            <div key={idx} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r">
              <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800 break-words">{report.locality}</div>
                  <div className="text-xs text-gray-500">{report.date}</div>
                </div>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm flex-shrink-0">
                  {report.sentiment}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed break-words overflow-x-hidden" dangerouslySetInnerHTML={{ __html: report.observation }} />
            </div>
          ))}
        </div>
      </div>

      {/* Predictions & Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">{data?.headers?.factorsTitle || 'Key Deciding Factors'}</h3>
          <ul className="space-y-3">
            {(data?.decidingFactors || [
              { title: 'Caste Equations', description: 'Traditional caste alliances showing signs of realignment' },
              { title: 'Development vs Welfare', description: 'Voters weighing infrastructure against social schemes' },
              { title: 'Youth Vote', description: 'First-time voters (18-25) could swing 15-20% of result' },
              { title: 'Anti-Incumbency', description: 'Localized anti-incumbency in certain pockets' }
            ]).map((factor: any, idx: number) => (
              <li key={idx} className="flex items-start gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-800 break-words">{factor.title}</div>
                  <div className="text-sm text-gray-600 break-words">{factor.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">{data?.headers?.outlookTitle || 'Electoral Outlook'}</h3>
          <div className="space-y-4">
            {(data?.electoralOutlook || [
              { party: 'BJP', range: '35-40%', value: 38, color: 'orange' },
              { party: 'DMK', range: '30-35%', value: 33, color: 'red' },
              { party: 'AIADMK', range: '15-20%', value: 18, color: 'green' },
              { party: 'Others', range: '10-15%', value: 12, color: 'gray' }
            ]).map((outlook: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{outlook.party}</span>
                  <span className="text-sm text-gray-600">{outlook.range}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${BAR_COLOR_CLASS[outlook.color] || 'bg-blue-500'}`}
                    style={{ width: `${outlook.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Projections based on current trends. Final outcome subject to campaign effectiveness and voter turnout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
