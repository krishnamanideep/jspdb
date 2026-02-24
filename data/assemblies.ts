
export const ASSEMBLIES = [
    { id: '1', name: 'Mannadipet' },
    { id: '2', name: 'Thirubhuvanai (SC)' },
    { id: '3', name: 'Ossudu (SC)' },
    { id: '4', name: 'Mangalam' },
    { id: '5', name: 'Villianur' },
    { id: '6', name: 'Ozhukarai' },
    { id: '7', name: 'Kadirkamam' },
    { id: '8', name: 'Indira Nagar' },
    { id: '9', name: 'Thattanchavady' },
    { id: '10', name: 'Kamaraj Nagar' },
    { id: '11', name: 'Lawspet' },
    { id: '12', name: 'Kalapet' },
    { id: '13', name: 'Muthialpet' },
    { id: '14', name: 'Raj Bhavan' },
    { id: '15', name: 'Oupalam' },
    { id: '16', name: 'Orleampeth' },
    { id: '17', name: 'Nellithope' },
    { id: '18', name: 'Mudaliarpet' },
    { id: '19', name: 'Ariankuppam' },
    { id: '20', name: 'Manavely' },
    { id: '21', name: 'Embalam (SC)' },
    { id: '22', name: 'Nettapakkam (SC)' },
    { id: '23', name: 'Bahour' },
    { id: '24', name: 'Nedungadu (SC)' },
    { id: '25', name: 'Thirunallar' },
    { id: '26', name: 'Karaikal North' },
    { id: '27', name: 'Karaikal South' },
    { id: '28', name: 'Neravy T R Pattinam' },
    { id: '29', name: 'Mahe' },
    { id: '30', name: 'Yanam' }
];

export const getAssemblyName = (id: string) => {
    return ASSEMBLIES.find(a => a.id === id)?.name || `Assembly ${id}`;
};
