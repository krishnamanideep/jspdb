import { PollingStation, CandidatePerformance, RegionalStats, DashboardData, GIData, SurveyData } from '@/types/data';

export const generateElectionData = (): DashboardData => {
  // Complete election data from Nedungadu constituency - All 36 booths
  const rawData = [
    { ps_no: '1', ps_name: 'Kamaraj Govt. High School', locality: 'POOVAM', lat: 10.99314132, lon: 79.83043268, y2011: { AINRC: 50.95, A_MARIMUTHU: 27.16, R_VADIVELU: 17.47, OTHERS: 4.42 }, y2016: { AINRC: 44.24, AIADMK: 11.52, INC: 33.13, ANANDHAN: 0.81, OTHERS: 5.66, NOTA: 1.01 }, y2021: { AINRC: 43.20, INC: 31.46, VIGESWARAN: 20.97, OTHERS: 4.37, NOTA: 0.87 } },
    { ps_no: '2', ps_name: 'Kamaraj Govt. High School', locality: 'POOVAM', lat: 10.99314132, lon: 79.83043268, y2011: { AINRC: 32.21, A_MARIMUTHU: 35.00, R_VADIVELU: 30.00, OTHERS: 2.79 }, y2016: { AINRC: 31.54, AIADMK: 9.72, INC: 42.18, ANANDHAN: 2.10, OTHERS: 10.78, NOTA: 0.39 }, y2021: { AINRC: 37.11, INC: 35.31, VIGESWARAN: 24.74, OTHERS: 2.84, NOTA: 1.16 } },
    { ps_no: '3', ps_name: 'Kamaraj Govt. High School', locality: 'POOVAM', lat: 10.9931084, lon: 79.8306258, y2011: { AINRC: 56.65, A_MARIMUTHU: 18.80, R_VADIVELU: 21.10, OTHERS: 3.45 }, y2016: { AINRC: 36.37, AIADMK: 11.34, INC: 34.28, ANANDHAN: 2.96, OTHERS: 10.85, NOTA: 3.08 }, y2021: { AINRC: 50.35, INC: 27.91, VIGESWARAN: 19.07, OTHERS: 2.67, NOTA: 1.28 } },
    { ps_no: '4', ps_name: 'Govt. High School', locality: 'VARICHIKUDY', lat: 10.98815044, lon: 79.81937796, y2011: { AINRC: 55.67, A_MARIMUTHU: 18.44, R_VADIVELU: 23.18, OTHERS: 2.71 }, y2016: { AINRC: 39.08, AIADMK: 9.43, INC: 26.28, ANANDHAN: 7.28, OTHERS: 8.76, NOTA: 2.02 }, y2021: { AINRC: 36.87, INC: 27.15, VIGESWARAN: 31.94, OTHERS: 4.04, NOTA: 0.51 } },
    { ps_no: '5', ps_name: 'Govt. High School', locality: 'VARICHIKUDY', lat: 10.98829788, lon: 79.81920093, y2011: { AINRC: 53.09, A_MARIMUTHU: 22.98, R_VADIVELU: 20.30, OTHERS: 3.63 }, y2016: { AINRC: 33.93, AIADMK: 12.35, INC: 25.78, ANANDHAN: 2.76, OTHERS: 10.55, NOTA: 1.32 }, y2021: { AINRC: 61.79, INC: 26.15, VIGESWARAN: 9.08, OTHERS: 2.98, NOTA: 0.95 } },
    { ps_no: '6', ps_name: 'Govt. Primary School', locality: 'RAYANPALAYAM', lat: 10.97375792, lon: 79.82077271, y2011: { AINRC: 67.60, A_MARIMUTHU: 13.46, R_VADIVELU: 15.01, OTHERS: 3.93 }, y2016: { AINRC: 42.54, AIADMK: 12.47, INC: 17.73, ANANDHAN: 3.30, OTHERS: 13.20, NOTA: 1.59 }, y2021: { AINRC: 46.82, INC: 25.71, VIGESWARAN: 22.06, OTHERS: 5.41, NOTA: 1.22 } },
    { ps_no: '7', ps_name: 'Govt. Primary School', locality: 'RAYANPALAYAM', lat: 10.97377635, lon: 79.82073784, y2011: { AINRC: 49.51, A_MARIMUTHU: 10.91, R_VADIVELU: 36.36, OTHERS: 3.22 }, y2016: { AINRC: 37.12, AIADMK: 6.13, INC: 20.07, ANANDHAN: 4.01, OTHERS: 6.13, NOTA: 2.45 }, y2021: { AINRC: 50.53, INC: 24.36, VIGESWARAN: 19.25, OTHERS: 5.86, NOTA: 0.75 } },
    { ps_no: '8', ps_name: 'Varichikudy Village Panchayat Office', locality: 'SONIYA GANDHI NAGAR', lat: 10.98276583, lon: 79.82749164, y2011: { AINRC: 58.01, A_MARIMUTHU: 13.48, R_VADIVELU: 24.82, OTHERS: 3.69 }, y2016: { AINRC: 34.17, AIADMK: 11.79, INC: 22.65, ANANDHAN: 15.10, OTHERS: 7.55, NOTA: 1.46 }, y2021: { AINRC: 49.37, INC: 19.22, VIGESWARAN: 23.74, OTHERS: 7.66, NOTA: 1.13 } },
    { ps_no: '9', ps_name: 'Govt. High School', locality: 'THIRUVETTAKUDY', lat: 10.97995632, lon: 79.83612299, y2011: { AINRC: 52.80, A_MARIMUTHU: 23.43, R_VADIVELU: 20.80, OTHERS: 2.97 }, y2016: { AINRC: 31.29, AIADMK: 9.59, INC: 28.14, ANANDHAN: 16.82, OTHERS: 8.18, NOTA: 1.42 }, y2021: { AINRC: 39.38, INC: 38.54, VIGESWARAN: 13.09, OTHERS: 9.00, NOTA: 0.72 } },
    { ps_no: '10', ps_name: 'Govt. High School', locality: 'THIRUVETTAKUDY', lat: 10.97987996, lon: 79.8360452, y2011: { AINRC: 64.06, A_MARIMUTHU: 16.37, R_VADIVELU: 16.37, OTHERS: 3.20 }, y2016: { AINRC: 44.41, AIADMK: 8.74, INC: 30.59, ANANDHAN: 2.45, OTHERS: 7.69, NOTA: 2.27 }, y2021: { AINRC: 43.14, INC: 26.82, VIGESWARAN: 21.63, OTHERS: 8.41, NOTA: 0.49 } },
    { ps_no: '11', ps_name: 'Govt. (Smart) Primary School', locality: 'THIRUVETTAKUDY', lat: 10.98022226, lon: 79.84823048, y2011: { AINRC: 55.59, A_MARIMUTHU: 26.76, R_VADIVELU: 13.93, OTHERS: 3.72 }, y2016: { AINRC: 19.43, AIADMK: 28.25, INC: 35.40, ANANDHAN: 1.31, OTHERS: 4.89, NOTA: 1.19 }, y2021: { AINRC: 33.76, INC: 23.63, VIGESWARAN: 32.07, OTHERS: 10.55, NOTA: 0.84 } },
    { ps_no: '12', ps_name: 'Veterinary Dispensary', locality: 'KOTTUCHERRY', lat: 10.96750146, lon: 79.82517958, y2011: { AINRC: 50.31, A_MARIMUTHU: 15.78, R_VADIVELU: 31.25, OTHERS: 2.66 }, y2016: { AINRC: 36.34, AIADMK: 13.59, INC: 27.33, ANANDHAN: 1.77, OTHERS: 6.35, NOTA: 1.92 }, y2021: { AINRC: 39.76, INC: 22.39, VIGESWARAN: 29.17, OTHERS: 8.68, NOTA: 0.81 } },
    { ps_no: '13', ps_name: 'V.O.C. Govt. Hr. Sec. School', locality: 'KOTTUCHERRY', lat: 10.96014415, lon: 79.8252064, y2011: { AINRC: 40.30, A_MARIMUTHU: 11.79, R_VADIVELU: 43.73, OTHERS: 4.18 }, y2016: { AINRC: 40.39, AIADMK: 12.60, INC: 25.45, ANANDHAN: 3.38, OTHERS: 8.18, NOTA: 2.86 }, y2021: { AINRC: 32.89, INC: 30.20, VIGESWARAN: 30.34, OTHERS: 6.58, NOTA: 1.34 } },
    { ps_no: '14', ps_name: 'V.O.C. Govt. Hr. Sec. School', locality: 'KOTTUCHERRY', lat: 10.96014678, lon: 79.82444733, y2011: { AINRC: 55.06, A_MARIMUTHU: 19.46, R_VADIVELU: 21.01, OTHERS: 4.47 }, y2016: { AINRC: 43.45, AIADMK: 13.09, INC: 21.27, ANANDHAN: 0.55, OTHERS: 4.55, NOTA: 3.09 }, y2021: { AINRC: 40.60, INC: 29.84, VIGESWARAN: 22.67, OTHERS: 6.89, NOTA: 2.15 } },
    { ps_no: '15', ps_name: 'Govt. Girls High School', locality: 'KOTTUCHERRY', lat: 10.96098153, lon: 79.82624173, y2011: { AINRC: 61.10, A_MARIMUTHU: 15.05, R_VADIVELU: 20.03, OTHERS: 3.83 }, y2016: { AINRC: 39.10, AIADMK: 14.54, INC: 22.14, ANANDHAN: 2.20, OTHERS: 4.41, NOTA: 2.31 }, y2021: { AINRC: 41.27, INC: 21.99, VIGESWARAN: 32.47, OTHERS: 4.27, NOTA: 0.52 } },
    { ps_no: '16', ps_name: 'Govt. Primary School', locality: 'ANNA NAGAR', lat: 10.96585305, lon: 79.82773035, y2011: { AINRC: 62.38, A_MARIMUTHU: 16.26, R_VADIVELU: 17.58, OTHERS: 3.78 }, y2016: { AINRC: 35.14, AIADMK: 16.97, INC: 28.51, ANANDHAN: 2.58, OTHERS: 6.03, NOTA: 2.58 }, y2021: { AINRC: 40.03, INC: 24.73, VIGESWARAN: 26.91, OTHERS: 8.33, NOTA: 0.96 } },
    { ps_no: '17', ps_name: 'Govt. Primary School', locality: 'ANNA NAGAR', lat: 10.95894864, lon: 79.83199507, y2011: { AINRC: 42.08, A_MARIMUTHU: 10.76, R_VADIVELU: 35.67, OTHERS: 11.49 }, y2016: { AINRC: 33.83, AIADMK: 14.29, INC: 24.60, ANANDHAN: 7.63, OTHERS: 7.52, NOTA: 2.47 }, y2021: { AINRC: 47.65, INC: 24.13, VIGESWARAN: 22.46, OTHERS: 5.77, NOTA: 1.21 } },
    { ps_no: '18', ps_name: 'Govt. Primary School', locality: 'JEEVA NAGAR', lat: 10.96054441, lon: 79.8515591, y2011: { AINRC: 38.71, A_MARIMUTHU: 38.31, R_VADIVELU: 20.36, OTHERS: 2.62 }, y2016: { AINRC: 39.50, AIADMK: 13.33, INC: 33.50, ANANDHAN: 2.67, OTHERS: 3.50, NOTA: 1.17 }, y2021: { AINRC: 19.82, INC: 14.84, VIGESWARAN: 59.55, OTHERS: 5.79, NOTA: 0.91 } },
    { ps_no: '19', ps_name: 'Govt. Smart Primary School', locality: 'KOTTUCHERRYMEDU', lat: 10.96944739, lon: 79.80232715, y2011: { AINRC: 63.70, A_MARIMUTHU: 23.12, R_VADIVELU: 11.47, OTHERS: 1.71 }, y2016: { AINRC: 39.85, AIADMK: 8.24, INC: 35.88, ANANDHAN: 6.26, OTHERS: 8.24, NOTA: 0.92 }, y2021: { AINRC: 34.19, INC: 27.99, VIGESWARAN: 32.53, OTHERS: 5.30, NOTA: 0.30 } },
    { ps_no: '20', ps_name: 'Govt. Primary School', locality: 'VADAMATTAM', lat: 10.96751726, lon: 79.79668647, y2011: { AINRC: 57.89, A_MARIMUTHU: 26.54, R_VADIVELU: 12.13, OTHERS: 3.43 }, y2016: { AINRC: 37.68, AIADMK: 6.63, INC: 31.78, ANANDHAN: 13.04, OTHERS: 8.39, NOTA: 1.55 }, y2021: { AINRC: 40.56, INC: 38.12, VIGESWARAN: 14.13, OTHERS: 7.19, NOTA: 0.85 } },
    { ps_no: '21', ps_name: 'Govt. Middle School', locality: 'VADAMATTAM', lat: 10.96751726, lon: 79.79668647, y2011: { AINRC: 37.32, A_MARIMUTHU: 37.32, R_VADIVELU: 20.61, OTHERS: 4.76 }, y2016: { AINRC: 37.32, AIADMK: 37.32, INC: 20.61, ANANDHAN: 4.76, OTHERS: 1.10, NOTA: 1.10 }, y2021: { AINRC: 37.32, INC: 37.32, VIGESWARAN: 20.61, OTHERS: 4.76, NOTA: 1.10 } },
    { ps_no: '22', ps_name: 'Govt. Middle School', locality: 'WEST PONBETHY', lat: 10.97318915, lon: 79.7770983, y2011: { AINRC: 51.92, A_MARIMUTHU: 28.91, R_VADIVELU: 17.11, OTHERS: 2.06 }, y2016: { AINRC: 31.16, AIADMK: 14.45, INC: 35.41, ANANDHAN: 5.38, OTHERS: 6.37, NOTA: 1.27 }, y2021: { AINRC: 44.99, INC: 35.60, VIGESWARAN: 9.77, OTHERS: 9.64, NOTA: 1.03 } },
    { ps_no: '23', ps_name: 'Govt. Primary School', locality: 'KOTTAGAM', lat: 10.98432988, lon: 79.78310913, y2011: { AINRC: 48.10, A_MARIMUTHU: 30.57, R_VADIVELU: 18.96, OTHERS: 2.37 }, y2016: { AINRC: 19.02, AIADMK: 10.74, INC: 42.95, ANANDHAN: 16.55, OTHERS: 6.71, NOTA: 1.12 }, y2021: { AINRC: 31.47, INC: 35.82, VIGESWARAN: 25.67, OTHERS: 7.04, NOTA: 0.62 } },
    { ps_no: '24', ps_name: 'Anganwadi Center', locality: 'VADAKATTALAI', lat: 10.99108889, lon: 79.77620244, y2011: { AINRC: 61.42, A_MARIMUTHU: 26.51, R_VADIVELU: 10.78, OTHERS: 1.29 }, y2016: { AINRC: 36.98, AIADMK: 17.36, INC: 30.58, ANANDHAN: 1.65, OTHERS: 7.23, NOTA: 3.31 }, y2021: { AINRC: 39.41, INC: 40.35, VIGESWARAN: 14.65, OTHERS: 5.59, NOTA: 1.20 } },
    { ps_no: '25', ps_name: 'Karma Veerar Kamarajar Govt. High School', locality: 'KURUMBAGARAM', lat: 10.98167047, lon: 79.76835698, y2011: { AINRC: 46.63, A_MARIMUTHU: 25.15, R_VADIVELU: 23.93, OTHERS: 4.29 }, y2016: { AINRC: 24.13, AIADMK: 5.03, INC: 35.08, ANANDHAN: 8.27, OTHERS: 24.36, NOTA: 2.01 }, y2021: { AINRC: 40.45, INC: 38.62, VIGESWARAN: 15.03, OTHERS: 5.90, NOTA: 0.56 } },
    { ps_no: '26', ps_name: 'Karma Veerar Kamarajar Govt. High School', locality: 'KURUMBAGARAM', lat: 10.98167894, lon: 79.76842589, y2011: { AINRC: 57.88, A_MARIMUTHU: 26.89, R_VADIVELU: 12.31, OTHERS: 2.92 }, y2016: { AINRC: 40.02, AIADMK: 7.75, INC: 36.94, ANANDHAN: 2.48, OTHERS: 11.42, NOTA: 1.99 }, y2021: { AINRC: 48.53, INC: 35.74, VIGESWARAN: 12.79, OTHERS: 2.94, NOTA: 2.50 } },
    { ps_no: '27', ps_name: 'Govt. Primary School', locality: 'NALLATHUR', lat: 11.00023055, lon: 79.75233346, y2011: { AINRC: 58.12, A_MARIMUTHU: 34.77, R_VADIVELU: 5.37, OTHERS: 1.74 }, y2016: { AINRC: 37.28, AIADMK: 8.40, INC: 41.22, ANANDHAN: 4.33, OTHERS: 6.36, NOTA: 0.89 }, y2021: { AINRC: 34.67, INC: 47.09, VIGESWARAN: 12.68, OTHERS: 5.56, NOTA: 0.65 } },
    { ps_no: '28', ps_name: 'Govt. Primary School', locality: 'MATHALANKUDY', lat: 10.98957491, lon: 79.75649088, y2011: { AINRC: 54.07, A_MARIMUTHU: 27.03, R_VADIVELU: 6.30, OTHERS: 12.60 }, y2016: { AINRC: 39.95, AIADMK: 3.31, INC: 35.93, ANANDHAN: 14.18, OTHERS: 6.38, NOTA: 0.71 }, y2021: { AINRC: 26.68, INC: 42.65, VIGESWARAN: 24.61, OTHERS: 6.06, NOTA: 1.42 } },
    { ps_no: '29', ps_name: 'Govt. Primary School', locality: 'PANCHATCHARAPURAM', lat: 10.97486911, lon: 79.76813972, y2011: { AINRC: 58.38, A_MARIMUTHU: 22.81, R_VADIVELU: 14.30, OTHERS: 4.51 }, y2016: { AINRC: 31.98, AIADMK: 12.17, INC: 35.08, ANANDHAN: 10.38, OTHERS: 8.11, NOTA: 1.31 }, y2021: { AINRC: 47.31, INC: 36.05, VIGESWARAN: 9.82, OTHERS: 6.83, NOTA: 0.60 } },
    { ps_no: '30', ps_name: 'Jawaharlal Nehru Govt. Hr.Sec. School', locality: 'NEDUNGADU', lat: 10.9671565, lon: 79.77167219, y2011: { AINRC: 68.82, A_MARIMUTHU: 18.99, R_VADIVELU: 9.03, OTHERS: 3.17 }, y2016: { AINRC: 40.89, AIADMK: 11.82, INC: 28.75, ANANDHAN: 7.35, OTHERS: 10.12, NOTA: 1.28 }, y2021: { AINRC: 51.10, INC: 34.76, VIGESWARAN: 8.88, OTHERS: 5.26, NOTA: 0.55 } },
    { ps_no: '31', ps_name: 'Jawaharlal Nehru Govt. Hr.Sec. School', locality: 'NEDUNGADU', lat: 10.96713543, lon: 79.77176606, y2011: { AINRC: 59.13, A_MARIMUTHU: 28.61, R_VADIVELU: 8.77, OTHERS: 3.49 }, y2016: { AINRC: 30.92, AIADMK: 13.32, INC: 38.17, ANANDHAN: 7.02, OTHERS: 9.63, NOTA: 2.62 }, y2021: { AINRC: 35.97, INC: 52.64, VIGESWARAN: 7.22, OTHERS: 4.17, NOTA: 0.97 } },
    { ps_no: '32', ps_name: 'Commune Panchayat Office', locality: 'NEDUNGADU', lat: 10.97307066, lon: 79.77250099, y2011: { AINRC: 51.51, A_MARIMUTHU: 21.15, R_VADIVELU: 21.30, OTHERS: 6.04 }, y2016: { AINRC: 24.45, AIADMK: 22.55, INC: 39.39, ANANDHAN: 5.56, OTHERS: 7.32, NOTA: 1.61 }, y2021: { AINRC: 35.60, INC: 50.31, VIGESWARAN: 7.54, OTHERS: 6.55, NOTA: 0.62 } },
    { ps_no: '33', ps_name: 'Govt. Middle School', locality: 'MELAKASAKUDY', lat: 10.9561073, lon: 79.79457557, y2011: { AINRC: 61.74, A_MARIMUTHU: 21.42, R_VADIVELU: 14.18, OTHERS: 2.66 }, y2016: { AINRC: 30.95, AIADMK: 6.72, INC: 30.39, ANANDHAN: 20.59, OTHERS: 10.50, NOTA: 0.98 }, y2021: { AINRC: 34.32, INC: 36.71, VIGESWARAN: 24.05, OTHERS: 4.92, NOTA: 0.84 } },
    { ps_no: '34', ps_name: 'Govt. Middle School', locality: 'MELAKASAKUDY', lat: 10.95595456, lon: 79.79452193, y2011: { AINRC: 59.07, A_MARIMUTHU: 21.50, R_VADIVELU: 16.26, OTHERS: 3.18 }, y2016: { AINRC: 27.86, AIADMK: 8.93, INC: 27.86, ANANDHAN: 13.93, OTHERS: 20.36, NOTA: 1.07 }, y2021: { AINRC: 29.98, INC: 42.63, VIGESWARAN: 17.68, OTHERS: 9.71, NOTA: 1.73 } },
  ];

  const psMetadata: Record<string, { category: string; strongestParty: string; percentage: number }> = {
    '1': { category: 'B', strongestParty: 'AINRC', percentage: 45.06 },
    '2': { category: 'C', strongestParty: 'AINRC', percentage: 34.46 },
    '3': { category: 'B', strongestParty: 'AINRC', percentage: 47.42 },
    '4': { category: 'B', strongestParty: 'AINRC', percentage: 41.29 },
    '5': { category: 'A', strongestParty: 'AINRC', percentage: 51.69 },
    '6': { category: 'B', strongestParty: 'AINRC', percentage: 49.69 },
    '7': { category: 'B', strongestParty: 'AINRC', percentage: 46.30 },
    '8': { category: 'B', strongestParty: 'AINRC', percentage: 46.54 },
    '9': { category: 'B', strongestParty: 'AINRC', percentage: 39.64 },
    '10': { category: 'B', strongestParty: 'AINRC', percentage: 47.71 },
    '11': { category: 'C', strongestParty: 'AINRC', percentage: 33.83 },
    '12': { category: 'B', strongestParty: 'AINRC', percentage: 40.84 },
    '13': { category: 'B', strongestParty: 'AINRC', percentage: 36.62 },
    '14': { category: 'B', strongestParty: 'AINRC', percentage: 44.35 },
    '15': { category: 'B', strongestParty: 'AINRC', percentage: 44.59 },
    '16': { category: 'B', strongestParty: 'AINRC', percentage: 43.03 },
    '17': { category: 'B', strongestParty: 'AINRC', percentage: 42.39 },
    '18': { category: 'C', strongestParty: 'AINRC', percentage: 29.78 },
    '19': { category: 'B', strongestParty: 'AINRC', percentage: 41.79 },
    '20': { category: 'B', strongestParty: 'AINRC', percentage: 43.16 },
    '21': { category: 'D', strongestParty: 'AINRC', percentage: 18.66 },
    '22': { category: 'B', strongestParty: 'AINRC', percentage: 42.23 },
    '23': { category: 'C', strongestParty: 'AINRC', percentage: 31.06 },
    '24': { category: 'B', strongestParty: 'AINRC', percentage: 43.08 },
    '25': { category: 'B', strongestParty: 'AINRC', percentage: 36.79 },
    '26': { category: 'B', strongestParty: 'AINRC', percentage: 47.85 },
    '27': { category: 'B', strongestParty: 'AINRC', percentage: 40.14 },
    '28': { category: 'B', strongestParty: 'AINRC', percentage: 36.14 },
    '29': { category: 'B', strongestParty: 'AINRC', percentage: 44.93 },
    '30': { category: 'A', strongestParty: 'AINRC', percentage: 51.58 },
    '31': { category: 'B', strongestParty: 'AINRC', percentage: 39.09 },
    '32': { category: 'B', strongestParty: 'INC_2016', percentage: 36.97 },
    '33': { category: 'B', strongestParty: 'AINRC', percentage: 38.79 },
    '34': { category: 'B', strongestParty: 'AINRC', percentage: 35.16 },
  };

  const pollingStations: PollingStation[] = rawData.map((item) => {
    const metadata = psMetadata[item.ps_no];
    return {
      id: `PS-${item.ps_no}`,
      ac_id: '24',
      ac_name: 'NEDUNGADU',
      ps_no: item.ps_no,
      ps_name: item.ps_name,
      locality: item.locality,
      latitude: item.lat,
      longitude: item.lon,
      category: metadata?.category,
      strongestParty: metadata?.strongestParty,
      strongestPartyPercentage: metadata?.percentage,
      election2011: { candidates: item.y2011, year: 2011 },
      election2016: { candidates: item.y2016, year: 2016 },
      election2021: { candidates: item.y2021, year: 2021 },
    };
  });

  // Calculate candidate performance across all booths
  const candidatePerformance: CandidatePerformance[] = [
    { name: 'AINRC', votes_2011: 55.05, votes_2016: 34.47, votes_2021: 40.20, trend: 5.73 },
    { name: 'INC', votes_2011: 22.00, votes_2016: 30.18, votes_2021: 31.94, trend: 1.76 },
    { name: 'VIGESWARAN', votes_2011: 19.15, votes_2016: 11.60, votes_2021: 20.92, trend: 9.32 },
    { name: 'Others', votes_2011: 3.80, votes_2016: 23.75, votes_2021: 4.37, trend: -19.38 },
  ];

  const regionalStats: RegionalStats[] = [
    { year: 2011, totalVotes: 100, avgTurnout: 58, winner: 'AINRC', winnerVotes: 55.05 },
    { year: 2016, totalVotes: 100, avgTurnout: 62, winner: 'INC', winnerVotes: 30.18 },
    { year: 2021, totalVotes: 100, avgTurnout: 68, winner: 'AINRC', winnerVotes: 40.20 },
  ];

  const giData: GIData = {
    constituency: 'Nedungadu',
    assembly_code: 24,
    type_of_seat: 'Bipolar - AINRC/INC',
    geography: 'Nedungadu Assembly Constituency is located in the western part of Karaikal district in Puducherry and is a Scheduled Caste (SC) reserved constituency. It largely covers the agrarian interior belt of Karaikal, consisting of low-lying rural villages, irrigation-fed agricultural lands, and scattered residential habitations.',
    economy: 'The economy of Nedungadu is primarily agrarian-driven, with paddy cultivation as the dominant economic activity, supported by canal irrigation and monsoon-fed water sources. Secondary agricultural output includes pulses and sugarcane, along with allied activities such as dairy and fodder production. The constituency also has a small but active rural construction sector, driven by housing schemes and basic infrastructure works. Local trade and petty commercial activity operate at a low scale and depend heavily on agricultural cash flow.',
    general_info: 'Nedungadu is a reserved, rural constituency made up of about 60 revenue villages under commune panchayats. With a high SC population, widespread rural booths, and strong dependence on welfare schemes, it remains politically sensitive and welfare-driven in its voting behaviour.',
    history: [
      { year: 2021, candidate_1st: 'Chandra Priyanga - AINRC', candidate_2nd: 'A Marimuthu - INC', candidate_3rd: 'Dr V. Vigeswaran - IND', votes_1st: 40.20, votes_2nd: 31.94, votes_3rd: 20.92 },
      { year: 2016, candidate_1st: 'Chandra Priyanga - AINRC', candidate_2nd: 'A Marimuthu - INC', candidate_3rd: 'G. Panneer Selvam - AIADMK', votes_1st: 34.47, votes_2nd: 30.18, votes_3rd: 11.60 },
      { year: 2011, candidate_1st: 'M.Chandirasu - AINRC', candidate_2nd: 'A Marimuthu - IND', candidate_3rd: 'E. Vadivellu - IND', votes_1st: 55.05, votes_2nd: 22.00, votes_3rd: 19.15 },
    ],
  };

  const surveyData: SurveyData = {
    general_survey: { high_impact: 34.23, low_impact: 10.78, no_opinion: 54.99 },
    yesno_survey: { yes: 45.01, no: 54.99 },
    gender_samples: { F: 38.11, M: 61.81, T: 0.07 },
    gender_response: [
      { gender: 'F', high_impact: 30.68, low_impact: 8.89, no_opinion: 60.43 },
      { gender: 'M', high_impact: 36.43, low_impact: 11.95, no_opinion: 51.62 },
      { gender: 'T', high_impact: 14.29, low_impact: 0, no_opinion: 85.71 },
    ],
    caste_age_survey: [
      { caste_age: 'A(18-25)', yes: 42.73, high_impact: 18.37, low_impact: 24.36, no_opinion: 57.27 },
      { caste_age: 'B(25-35)', yes: 41.77, high_impact: 17.96, low_impact: 23.81, no_opinion: 58.23 },
      { caste_age: 'C(35-50)', yes: 47.04, high_impact: 20.22, low_impact: 26.82, no_opinion: 52.96 },
      { caste_age: 'D(50-65)', yes: 46.50, high_impact: 20.01, low_impact: 26.49, no_opinion: 53.50 },
      { caste_age: 'E(65+)', yes: 45.98, high_impact: 19.78, low_impact: 26.20, no_opinion: 54.02 },
    ],
    caste_age_yesno_survey: [
      { caste_age: 'A(18-25)', yes: 42.73, no: 57.27 },
      { caste_age: 'B(25-35)', yes: 41.77, no: 58.23 },
      { caste_age: 'C(35-50)', yes: 47.04, no: 52.96 },
      { caste_age: 'D(50-65)', yes: 46.50, no: 53.50 },
      { caste_age: 'E(65+)', yes: 45.98, no: 54.02 },
    ],
    mandaram_overview: [
      { mandaram: 'WITHOUT MANDARAM', yes: 42.91, high_impact: 18.45, low_impact: 24.46, no_opinion: 57.09 },
      { mandaram: 'WITH MANDARAM', yes: 46.83, high_impact: 20.14, low_impact: 26.69, no_opinion: 53.17 },
    ],
    mandaram_yesno: [
      { mandaram: 'WITHOUT MANDARAM', yes: 42.91, no: 57.09 },
      { mandaram: 'WITH MANDARAM', yes: 46.83, no: 53.17 },
    ],
  };

  return {
    pollingStations,
    candidatePerformance,
    regionalStats,
    giData,
    surveyData,
    summary: {
      totalStations: pollingStations.length,
      constituency: 'NEDUNGADU',
      totalVotes2021: 100,
      avgTurnout2021: 68,
      winner2021: 'AINRC',
    },
  };
};
