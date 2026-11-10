export interface MarineConservationTip {
  id: string;
  title: string;
  titleEn: string;
  tip: string;
  tipEn: string;
  location: string;
  locationEn: string;
  badge: string;
}

export const MARINE_TIPS: MarineConservationTip[] = [
  {
    id: "tortuguero",
    title: "Tortuguero: Capital de la Tortuga Verde",
    titleEn: "Tortuguero: Green Turtle Capital",
    tip: "El Parque Nacional Tortuguero es el sitio de anidación de tortuga verde (Chelonia mydas) más importante del hemisferio occidental. Cada año llegan miles a desovar en sus playas.",
    tipEn: "Tortuguero National Park is the most important nesting site for the green turtle in the Western Hemisphere.",
    location: "Tortuguero, Limón",
    locationEn: "Tortuguero, Limon",
    badge: "🐢 Tortuga Verde"
  },
  {
    id: "ostional",
    title: "Ostional y las Célebres 'Arribadas'",
    titleEn: "Ostional and the Famous 'Arribadas'",
    tip: "En el Refugio de Vida Silvestre Ostional ocurre uno de los fenómenos más impresionantes del planeta: decenas de miles de tortugas lora (Lepidochelys olivacea) anidan simultáneamente.",
    tipEn: "At Ostional Wildlife Refuge, one of Earth's greatest natural spectacles happens: tens of thousands of olive ridley turtles arrive simultaneously to nest.",
    location: "Ostional, Guanacaste",
    locationEn: "Ostional, Guanacaste",
    badge: "🌊 Arribada Única"
  },
  {
    id: "las_baulas",
    title: "Las Baulas: Gigantes del Océano",
    titleEn: "Las Baulas: Ocean Giants",
    tip: "La tortuga baula (Dermochelys coriacea) es la tortuga marina más grande del mundo, pudiendo pesar más de 500 kg. En Playa Grande se protegen sus nidos contra la luz artificial y el plástico.",
    tipEn: "The leatherback turtle is the largest sea turtle on Earth, weighing up to 500 kg. Playa Grande protects its critical nesting habitats.",
    location: "Playa Grande, Guanacaste",
    locationEn: "Playa Grande, Guanacaste",
    badge: "🛡️ Tortuga Baula"
  },
  {
    id: "plastic_impact",
    title: "Peligro Silencioso: Plásticos y Redes",
    titleEn: "Silent Hazard: Plastics & Ghost Nets",
    tip: "Las tortugas marinas a menudo confunden las bolsas de plástico flotantes con medusas (su alimento favorito). Recoger una sola bolsa en la playa salva vidas marinas.",
    tipEn: "Sea turtles often mistake floating plastic bags for jellyfish, their favorite meal. Slicing waste out of beaches directly saves marine life.",
    location: "Costas de Costa Rica",
    locationEn: "Costa Rican Coastlines",
    badge: "♻️ Cero Plástico"
  },
  {
    id: "gandoca",
    title: "Gandoca-Manzanillo: Refugio del Caribe Sur",
    titleEn: "Gandoca-Manzanillo: South Caribbean Haven",
    tip: "Las playas vírgenes del Caribe Sur albergan sitios de anidación de tortuga carey (Eretmochelys imbricata), especie en peligro crítico de extinción.",
    tipEn: "Pristine beaches of the South Caribbean host vital nesting grounds for the critically endangered hawksbill sea turtle.",
    location: "Gandoca, Talamanca",
    locationEn: "Gandoca, Talamanca",
    badge: "🪸 Tortuga Carey"
  }
];
