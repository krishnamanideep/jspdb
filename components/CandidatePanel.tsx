'use client';

import { Users, TrendingUp, MapPin, Award, Shield, Target, AlertTriangle, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Candidate } from '@/types/data';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ASSEMBLIES } from '@/data/assemblies';

export default function CandidatePanel({ selectedAssembly, previewData }: { selectedAssembly: string, previewData?: Candidate[] }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null);

  const getAssemblyName = (id: string) => {
    return ASSEMBLIES.find(a => a.id === id)?.name || `Assembly ${id}`;
  };

  useEffect(() => {
    if (previewData) {
      setCandidates(previewData);
      setLoading(false);
      return;
    }
    setLoading(true);

    const fetchCandidates = async () => {
      try {
        const q = query(collection(db, 'candidates'), where('assemblyId', '==', selectedAssembly));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
        setCandidates(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching candidates from Firestore:", err);
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [selectedAssembly, previewData]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading candidates...</div>;
  if (!candidates.length) return <div className="p-8 text-center text-gray-500">No candidate profile data available for this assembly.</div>;

  const getPartyColor = (party: string) => {
    switch (party) {
      case 'BJP': return 'bg-orange-500';
      case 'DMK': return 'bg-red-500';
      case 'AIADMK': return 'bg-green-600';
      case 'INC': return 'bg-blue-600';
      case 'AINRC': case 'NRC': return 'bg-teal-600';
      case 'PMK': return 'bg-amber-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">{getAssemblyName(selectedAssembly)} - Candidate Panel</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {candidates.map((candidate, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer" onClick={() => setExpandedCandidateId(candidate.id || idx.toString())}>
            {/* Header — colored band with centered photo */}
            <div className={`relative ${getPartyColor(candidate.party)} pt-8 pb-14 flex flex-col items-center text-white`}>
              {/* Party badge */}
              <span className="absolute top-3 right-3 bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                {candidate.party}
              </span>

              {/* Photo — clickable for lightbox */}
              <div
                className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/50 shadow-lg cursor-zoom-in"
                onClick={(e) => { e.stopPropagation(); if (candidate.image) setPhotoLightbox(candidate.image); }}
              >
                {candidate.image ? (
                  <img src={candidate.image} alt={candidate.name} className="w-full h-full object-cover" />
                ) : (
                  <Users size={44} />
                )}
              </div>

              {/* Name */}
              <h3 className="mt-3 text-xl font-bold text-center px-4 leading-tight break-words w-full">{candidate.name}</h3>
            </div>

            {/* Info cards — overlap the header slightly */}
            <div className="px-5 -mt-8 relative z-10">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 grid grid-cols-3 divide-x divide-gray-100 text-center">
                <div className="px-2">
                  <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Age</div>
                  <div className="font-bold text-gray-800 text-base truncate">{candidate.age || '—'}</div>
                </div>
                <div className="px-2">
                  <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Caste</div>
                  <div className="font-bold text-gray-800 text-base truncate">{candidate.caste || '—'}</div>
                </div>
                <div className="px-2">
                  <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Role</div>
                  <div className="font-bold text-gray-800 text-base truncate">{candidate.designation || '—'}</div>
                </div>
              </div>
            </div>

            {/* Constituency */}
            <div className="px-5 pt-3 pb-1 flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={14} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">{candidate.constituency?.startsWith('Assembly') ? getAssemblyName(candidate.assemblyId || selectedAssembly) : (candidate.constituency || getAssemblyName(candidate.assemblyId || selectedAssembly))}</span>
            </div>

            {/* Action button */}
            <div className="px-5 py-4 mt-auto">
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedCandidateId(candidate.id || idx.toString()); }}
                className={`w-full py-2.5 px-4 ${getPartyColor(candidate.party)} text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-sm`}
              >
                View Full Profile →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Details Modal */}
      {expandedCandidateId && (() => {
        const candidate = candidates.find((c, i) => c.id === expandedCandidateId || i.toString() === expandedCandidateId);
        if (!candidate) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">

              {/* Modal Header */}
              <div className={`p-6 ${getPartyColor(candidate.party)} text-white flex justify-between items-start gap-4`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30 flex-shrink-0 cursor-zoom-in"
                    onClick={(e) => { e.stopPropagation(); if (candidate.image) setPhotoLightbox(candidate.image); }}
                  >
                    {candidate.image ? (
                      <img src={candidate.image} alt={candidate.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={44} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold break-words leading-tight">{candidate.name}</h3>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 opacity-90 mt-1">
                      <span className="text-base font-semibold">{candidate.party}</span>
                      <span className="opacity-60">•</span>
                      <span className="text-sm break-words">{candidate.constituency || getAssemblyName(candidate.assemblyId || selectedAssembly)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedCandidateId(null)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors text-white flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Caste</div>
                    <div className="font-bold text-gray-900 text-xl">{candidate.caste || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Designation</div>
                    <div className="font-bold text-gray-900 text-xl">{candidate.designation || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Age</div>
                    <div className="font-bold text-gray-900 text-xl">{candidate.age || 'N/A'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Strengths */}
                    {candidate.strengths?.length > 0 && (
                      <div className="bg-green-50/50 p-5 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <TrendingUp size={20} />
                          </div>
                          <h4 className="font-bold text-lg" style={{ color: candidate.headers?.strengthsColor || '#14532d' }}>{candidate.headers?.strengths || 'Strengths'}</h4>
                        </div>
                        <ul className="space-y-3">
                          {candidate.strengths.map((strength, i) => (
                            <li key={i} className="text-green-800 flex items-start gap-3 min-w-0">
                              <span className="text-green-600 font-bold mt-1 flex-shrink-0">✓</span>
                              <span dangerouslySetInnerHTML={{ __html: strength }} className="leading-relaxed break-words overflow-hidden min-w-0" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Opportunities */}
                    {candidate.opportunities?.length > 0 && (
                      <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Target size={20} />
                          </div>
                          <h4 className="font-bold text-lg" style={{ color: candidate.headers?.opportunitiesColor || '#581c87' }}>{candidate.headers?.opportunities || 'Opportunities'}</h4>
                        </div>
                        <ul className="space-y-3">
                          {candidate.opportunities.map((opportunity, i) => (
                            <li key={i} className="text-purple-800 flex items-start gap-3 min-w-0">
                              <span className="text-purple-600 font-bold mt-1 flex-shrink-0">→</span>
                              <span dangerouslySetInnerHTML={{ __html: opportunity }} className="leading-relaxed break-words overflow-hidden min-w-0" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Challenges/Weaknesses */}
                    {candidate.weaknesses?.length > 0 && (
                      <div className="bg-red-50/50 p-5 rounded-xl border border-red-100">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Award size={20} />
                          </div>
                          <h4 className="font-bold text-lg" style={{ color: candidate.headers?.weaknessesColor || '#7f1d1d' }}>{candidate.headers?.weaknesses || 'Challenges'}</h4>
                        </div>
                        <ul className="space-y-3">
                          {candidate.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-red-800 flex items-start gap-3 min-w-0">
                              <span className="text-red-600 font-bold mt-1 flex-shrink-0">!</span>
                              <span dangerouslySetInnerHTML={{ __html: weakness }} className="leading-relaxed break-words overflow-hidden min-w-0" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Threats */}
                    {candidate.threats?.length > 0 && (
                      <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <AlertTriangle size={20} />
                          </div>
                          <h4 className="font-bold text-lg" style={{ color: candidate.headers?.threatsColor || '#7c2d12' }}>{candidate.headers?.threats || 'Threats'}</h4>
                        </div>
                        <ul className="space-y-3">
                          {candidate.threats.map((threat, i) => (
                            <li key={i} className="text-orange-800 flex items-start gap-3 min-w-0">
                              <span className="text-orange-600 font-bold mt-1 flex-shrink-0">⚠</span>
                              <span dangerouslySetInnerHTML={{ __html: threat }} className="leading-relaxed break-words overflow-hidden min-w-0" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Advantages - Full Width */}
                {candidate.advantages?.length > 0 && (
                  <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Shield size={20} />
                      </div>
                      <h4 className="font-bold text-lg" style={{ color: candidate.headers?.advantagesColor || '#1e3a8a' }}>{candidate.headers?.advantages || 'Key Advantages'}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {candidate.advantages.map((advantage, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/60 p-3 rounded-lg border border-blue-100/50 min-w-0">
                          <span className="text-blue-600 font-bold mt-1 flex-shrink-0">★</span>
                          <span dangerouslySetInnerHTML={{ __html: advantage }} className="text-blue-800 leading-relaxed break-words overflow-hidden min-w-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Cards */}
                {candidate.customCards?.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard size={20} className="text-indigo-600" />
                      <h4 className="font-bold text-indigo-900 text-lg">Additional Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {candidate.customCards.map((card, i) => (
                        <div key={i} className={`p-5 rounded-xl border ${card.type === 'highlight' ? 'bg-emerald-50 border-emerald-200' :
                          card.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                            'bg-indigo-50 border-indigo-200'
                          }`}>
                          <div className={`font-bold text-lg mb-2 break-words ${card.type === 'highlight' ? 'text-emerald-900' :
                            card.type === 'warning' ? 'text-amber-900' :
                              'text-indigo-900'
                            }`}>{card.title}</div>
                          <div className={`leading-relaxed break-words overflow-x-hidden ${card.type === 'highlight' ? 'text-emerald-800' :
                            card.type === 'warning' ? 'text-amber-800' :
                              'text-indigo-800'
                            }`} dangerouslySetInnerHTML={{ __html: card.content }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setExpandedCandidateId(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Comparative Analysis */}
      {
        candidates.length > 1 && (
          <div className="bg-white p-6 rounded-xl shadow-lg mt-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Comparative Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
                    {candidates.map((c, idx) => (
                      <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Party</td>
                    {candidates.map((c, idx) => (
                      <td key={idx} className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-white text-xs ${getPartyColor(c.party)}`}>{c.party}</span>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Caste</td>
                    {candidates.map((c, idx) => (
                      <td key={idx} className="px-6 py-4">{c.caste || 'N/A'}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Designation</td>
                    {candidates.map((c, idx) => (
                      <td key={idx} className="px-6 py-4">{c.designation || 'N/A'}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Key Strength</td>
                    {candidates.map((c, idx) => (
                      <td key={idx} className="px-6 py-4 text-green-600">
                        {c.strengths?.[0] ? (
                          <span dangerouslySetInnerHTML={{ __html: c.strengths[0] }} className="break-words" />
                        ) : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">Key Advantage</td>
                    {candidates.map((c, idx) => (
                      <td key={idx} className="px-6 py-4 text-blue-600">
                        {c.advantages?.[0] ? (
                          <span dangerouslySetInnerHTML={{ __html: c.advantages[0] }} className="break-words" />
                        ) : '-'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      }
      {/* Photo Lightbox */}
      {photoLightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md"
          onClick={() => setPhotoLightbox(null)}
        >
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPhotoLightbox(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-3xl font-light leading-none"
              aria-label="Close"
            >
              ✕
            </button>
            <img
              src={photoLightbox}
              alt="Candidate"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              style={{ animation: 'scale-in 0.18s ease-out' }}
            />
          </div>
          <style>{`@keyframes scale-in { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </div >
  );
}
