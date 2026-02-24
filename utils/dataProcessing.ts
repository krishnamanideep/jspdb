import { PollingStation } from '@/types/data';
import rawPollingData from '@/data/Form20_Localities_Pct.json';

// Keys that should NOT be treated as candidate parties
const NON_CANDIDATE_KEYS = ['VOTERS', 'NOTA', 'PS_NO', 'POLLED'];

/** Safely parse a value to a number, returning 0 for non-numeric values like "NEW_BOOTH" */
const parseNumeric = (value: unknown): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

/** Check if a key represents a real candidate (not VOTERS, NOTA, PS_NO, POLLED) */
const isCandidateKey = (key: string): boolean => {
    return !NON_CANDIDATE_KEYS.some(nonCandidate => key.startsWith(nonCandidate));
};

export const processLocalPollingData = (targetAssemblyId: string | null): PollingStation[] => {
    let allStations: PollingStation[] = [];
    const jsonData = rawPollingData as Record<string, unknown[]>;

    Object.keys(jsonData).forEach(key => {
        if (key.startsWith('AC_') && key.endsWith('_FINAL')) {
            const acId = key.replace('AC_', '').replace('_FINAL', '');

            // Skip if specific assembly requested and doesn't match
            if (targetAssemblyId && acId !== targetAssemblyId) return;

            const entries = jsonData[key] as Record<string, unknown>[];
            const stations = entries.map((station, index) => {
                const candidates2021: Record<string, number> = {};
                const candidates2016: Record<string, number> = {};
                const candidates2011: Record<string, number> = {};

                Object.keys(station).forEach(k => {
                    if (k.endsWith('_2021_pct')) {
                        const candidateKey = k.replace('_2021_pct', '');
                        if (isCandidateKey(candidateKey)) {
                            candidates2021[candidateKey] = parseNumeric(station[k]);
                        }
                    } else if (k.endsWith('_2016_pct')) {
                        const candidateKey = k.replace('_2016_pct', '');
                        if (isCandidateKey(candidateKey)) {
                            candidates2016[candidateKey] = parseNumeric(station[k]);
                        }
                    } else if (k.endsWith('_2011_pct')) {
                        const candidateKey = k.replace('_2011_pct', '');
                        if (isCandidateKey(candidateKey)) {
                            candidates2011[candidateKey] = parseNumeric(station[k]);
                        }
                    }
                });

                return {
                    id: `${acId}_${station.PS_NO_2021 || index}`,
                    ac_id: acId,
                    ac_name: String(station.LOCALITY_EXTRACTED ?? `AC ${acId}`),
                    ps_no: String(station.PS_NO_2021 ?? index),
                    ps_name: String(station.PS_NO_2021 ?? index),
                    locality: String(station.LOCALITY_EXTRACTED ?? ''),
                    latitude: parseNumeric(station.Latitude),
                    longitude: parseNumeric(station.Longitude),
                    category: String(station.TOP_SCORE_CATEGORY ?? ''),
                    strongestParty: String(station.TOP_SCORE_PARTY ?? ''),
                    election2021: { year: 2021, total_votes: parseNumeric(station.POLLED_2021), candidates: candidates2021 },
                    election2016: { year: 2016, total_votes: parseNumeric(station.POLLED_2016), candidates: candidates2016 },
                    election2011: { year: 2011, total_votes: parseNumeric(station.POLLED_2011), candidates: candidates2011 }
                };
            });
            allStations = [...allStations, ...stations];
        }
    });
    return allStations;
};
