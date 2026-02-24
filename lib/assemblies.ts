// Assembly data for Puducherry - 30 Assemblies
export const ASSEMBLIES = [
  // Karaikal District (6)
  { id: 1, name: 'KARAIKAL', district: 'Karaikal' },
  { id: 2, name: 'TIRUNALLAR', district: 'Karaikal' },
  { id: 3, name: 'NANNILAM', district: 'Karaikal' },
  { id: 4, name: 'NEDUNGADU', district: 'Karaikal' },
  { id: 5, name: 'VILLUPURAM', district: 'Karaikal' },
  { id: 6, name: 'RANIPET', district: 'Karaikal' },

  // Puducherry District (12)
  { id: 7, name: 'PONDICHERRY SOUTH', district: 'Puducherry' },
  { id: 8, name: 'PONDICHERRY NORTH', district: 'Puducherry' },
  { id: 9, name: 'VILLIANUR', district: 'Puducherry' },
  { id: 10, name: 'BAHOUR', district: 'Puducherry' },
  { id: 11, name: 'AUROVILLE', district: 'Puducherry' },
  { id: 12, name: 'OULGARET', district: 'Puducherry' },
  { id: 13, name: 'KALAPET', district: 'Puducherry' },
  { id: 14, name: 'SEDARAPET', district: 'Puducherry' },
  { id: 15, name: 'NETTAPAKKAM', district: 'Puducherry' },
  { id: 16, name: 'ARIANKUPPAM', district: 'Puducherry' },
  { id: 17, name: 'EVUR', district: 'Puducherry' },
  { id: 18, name: 'THATTANCHAVADI', district: 'Puducherry' },

  // Yanam District (3)
  { id: 19, name: 'YANAM', district: 'Yanam' },
  { id: 20, name: 'PADIBIDRI', district: 'Yanam' },
  { id: 21, name: 'MARUTERU', district: 'Yanam' },

  // Mahe District (6)
  { id: 22, name: 'MAHE', district: 'Mahe' },
  { id: 23, name: 'CHENKALARI', district: 'Mahe' },
  { id: 24, name: 'KANNUR', district: 'Mahe' },
  { id: 25, name: 'KOZHIKODE', district: 'Mahe' },
  { id: 26, name: 'KODUNGALLOOR', district: 'Mahe' },
  { id: 27, name: 'PERAVOOR', district: 'Mahe' },

  // Union Territory Region (3)
  { id: 28, name: 'KURUMBAPETTAI', district: 'Puducherry UT' },
  { id: 29, name: 'TIRUVALLORE', district: 'Puducherry UT' },
  { id: 30, name: 'CHENGALPATTU', district: 'Puducherry UT' },
];

export const getAssemblyById = (id: number) => {
  return ASSEMBLIES.find(a => a.id === id);
};

export const getAssembliesByDistrict = (district: string) => {
  return ASSEMBLIES.filter(a => a.district === district);
};
