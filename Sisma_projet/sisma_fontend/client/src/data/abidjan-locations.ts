// Communes et quartiers d'Abidjan
export const abidjanLocations = {
    Abobo: [
      "Abobo Baoulé",
      "Abobo Gare",
      "Anonkoua-Kouté",
      "Cité Anador",
      "Cité Port",
      "N'Dotré",
      "Sagbé",
      "Téhé",
      "Zone 1",
      "Zone 2",
      "Zone 3",
      "Zone 4"
    ],
  
    Adjamé: [
      "Adjamé Gare",
      "Bracodi",
      "Cité Anador",
      "Liberté",
      "Macaci",
      "Siporex"
    ],
  
    Attécoubé: [
      "Attécoubé Centre",
      "Banco",
      "Blokosso",
      "Locodjro",
      "Santé"
    ],
  
    Cocody: [
      "2 Plateaux",
      "Angré",
      "Angré 7ème Tranche",
      "M'Badon",
      "Riviera 1",
      "Riviera 2",
      "Riviera 3",
      "Riviera 4",
      "Riviera Palmeraie"
    ],
  
    Koumassi: [
      "Koumassi Centre",
      "Koumassi Remblais",
      "Koumassi Sicogi",
      "Campement"
    ],
  
    Marcory: [
      "Marcory Centre",
      "Anoumabo",
      "Biétry",
      "Résidentiel",
      "Zone 4"
    ],
  
    Plateau: [
      "Plateau Centre",
      "Plateau Gare",
      "Cité Administrative"
    ],
  
    "Port-Bouët": [
      "Port-Bouët Centre",
      "Aéroport",
      "Vridi",
      "Gonzagueville"
    ],
  
    Treichville: [
      "Treichville Centre",
      "Arras",
      "Belleville",
      "Biafra",
      "Zone 3"
    ],
  
    Yopougon: [
      "Yopougon Centre",
      "Andokoi",
      "Ananeraie",
      "Attié",
      "Gesco",
      "Niangon",
      "Sicogi",
      "Siporex",
      "Zone Industrielle",
      "Zone 1",
      "Zone 2",
      "Zone 3",
      "Zone 4"
    ]
  } as const;

export const communes = Object.keys(abidjanLocations);

export function getQuartiers(commune: string): string[] {
  return Array.isArray(abidjanLocations[commune as keyof typeof abidjanLocations]) 
    ? (abidjanLocations[commune as keyof typeof abidjanLocations] as any)
    : [];
}

