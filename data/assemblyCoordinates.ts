// Geographic coordinates for all 30 assembly constituencies in Puducherry
// Coordinates are approximate center points of each constituency

export const ASSEMBLY_COORDINATES: Record<string, { lat: number; lng: number; region: string }> = {
    // Puducherry Region (Assemblies 1-23)
    '1': { lat: 11.9416, lng: 79.8083, region: 'Puducherry' }, // Mannadipet
    '2': { lat: 11.9139, lng: 79.7800, region: 'Puducherry' }, // Thirubhuvanai (SC)
    '3': { lat: 11.9850, lng: 79.7550, region: 'Puducherry' }, // Ossudu (SC)
    '4': { lat: 11.9950, lng: 79.7850, region: 'Puducherry' }, // Mangalam
    '5': { lat: 11.9450, lng: 79.7950, region: 'Puducherry' }, // Villianur
    '6': { lat: 11.9550, lng: 79.8150, region: 'Puducherry' }, // Ozhukarai
    '7': { lat: 11.9350, lng: 79.8250, region: 'Puducherry' }, // Kadirkamam
    '8': { lat: 11.9250, lng: 79.8350, region: 'Puducherry' }, // Indira Nagar
    '9': { lat: 11.9450, lng: 79.8450, region: 'Puducherry' }, // Thattanchavady
    '10': { lat: 11.9350, lng: 79.8550, region: 'Puducherry' }, // Kamaraj Nagar
    '11': { lat: 11.9250, lng: 79.8450, region: 'Puducherry' }, // Lawspet
    '12': { lat: 11.9150, lng: 79.8350, region: 'Puducherry' }, // Kalapet
    '13': { lat: 11.9350, lng: 79.8250, region: 'Puducherry' }, // Muthialpet
    '14': { lat: 11.9250, lng: 79.8150, region: 'Puducherry' }, // Raj Bhavan
    '15': { lat: 11.9150, lng: 79.8250, region: 'Puducherry' }, // Oupalam
    '16': { lat: 11.9050, lng: 79.8150, region: 'Puducherry' }, // Orleampeth
    '17': { lat: 11.9150, lng: 79.8050, region: 'Puducherry' }, // Nellithope
    '18': { lat: 11.9250, lng: 79.7950, region: 'Puducherry' }, // Mudaliarpet
    '19': { lat: 11.9750, lng: 79.7750, region: 'Puducherry' }, // Ariankuppam
    '20': { lat: 11.9650, lng: 79.7650, region: 'Puducherry' }, // Manavely
    '21': { lat: 11.9550, lng: 79.7550, region: 'Puducherry' }, // Embalam (SC)
    '22': { lat: 11.9450, lng: 79.7450, region: 'Puducherry' }, // Nettapakkam (SC)
    '23': { lat: 11.9350, lng: 79.7350, region: 'Puducherry' }, // Bahour

    // Karaikal Region (Assemblies 24-28)
    '24': { lat: 10.9250, lng: 79.8350, region: 'Karaikal' }, // Nedungadu (SC)
    '25': { lat: 10.9150, lng: 79.8450, region: 'Karaikal' }, // Thirunallar
    '26': { lat: 10.9050, lng: 79.8350, region: 'Karaikal' }, // Karaikal North
    '27': { lat: 10.8950, lng: 79.8250, region: 'Karaikal' }, // Karaikal South
    '28': { lat: 10.8850, lng: 79.8150, region: 'Karaikal' }, // Neravy T R Pattinam

    // Mahe Region (Assembly 29)
    '29': { lat: 11.7015, lng: 75.5365, region: 'Mahe' }, // Mahe

    // Yanam Region (Assembly 30)
    '30': { lat: 16.7333, lng: 82.2167, region: 'Yanam' }, // Yanam
};

// Get center coordinates for each region
export const REGION_CENTERS = {
    Puducherry: { lat: 11.9345, lng: 79.8145, zoom: 12 },
    Karaikal: { lat: 10.9050, lng: 79.8350, zoom: 13 },
    Mahe: { lat: 11.7015, lng: 75.5365, zoom: 14 },
    Yanam: { lat: 16.7333, lng: 82.2167, zoom: 14 },
    All: { lat: 11.9345, lng: 79.8145, zoom: 10 }, // Default view showing Puducherry
};

export const getAssemblyCoordinates = (assemblyId: string) => {
    return ASSEMBLY_COORDINATES[assemblyId] || REGION_CENTERS.Puducherry;
};

export const getRegionCenter = (region: string) => {
    return REGION_CENTERS[region as keyof typeof REGION_CENTERS] || REGION_CENTERS.All;
};
