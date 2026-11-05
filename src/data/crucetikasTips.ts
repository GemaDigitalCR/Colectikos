export interface ConservationTip {
  id: string;
  location: string;
  es: string;
  en: string;
  icon: string;
}

export const CONSERVATION_TIPS: ConservationTip[] = [
  {
    id: "tip-1",
    location: "Manuel Antonio, Puntarenas",
    icon: "🦥",
    es: "¿Sabías que en Costa Rica se han instalado más de 300 puentes aéreos de fauna para evitar que perezosos y monos mueran en carreteras o por electrocución?",
    en: "Did you know that over 300 wildlife canopy bridges have been installed in Costa Rica to keep sloths and monkeys safe from traffic and power lines?"
  },
  {
    id: "tip-2",
    location: "Ruta 34 / Costanera Sur",
    icon: "🚗",
    es: "Respetar el límite de 40 km/h en zonas boscosas da tiempo a los conductores de frenar cuando un animal cruza la calle.",
    en: "Keeping speed below 40 km/h (25 mph) in forested areas gives drivers enough time to stop when wildlife crosses the road."
  },
  {
    id: "tip-3",
    location: "Puerto Viejo, Limón",
    icon: "🌿",
    es: "Las hojas de Guarumo son el alimento favorito de los perezosos de tres dedos. Ayudan a su digestión lenta que dura hasta un mes.",
    en: "Cecropia (Guarumo) leaves are the favorite food of three-toed sloths, supporting their slow digestion that takes up to a month."
  },
  {
    id: "tip-4",
    location: "Río Tárcoles, Garabito",
    icon: "🐊",
    es: "El Río Tárcoles alberga una de las poblaciones de cocodrilo americano más densas de Centroamérica. ¡Cruzar por los puentes seguros es esencial!",
    en: "The Tárcoles River hosts one of the densest American crocodile populations in Central America. Crossing via safe bridges is vital!"
  },
  {
    id: "tip-5",
    location: "Caribe Sur / Cahuita",
    icon: "⚡",
    es: "Grupos comunitarios y el ICE trabajan continuamente en aislar cables eléctricos para que los perezosos no sufran accidentes al trepar.",
    en: "Community organizations and Costa Rica's electric company work continuously to insulate power lines so sloths can safely climb."
  },
  {
    id: "tip-6",
    location: "Parque Nacional Corcovado",
    icon: "🐆",
    es: "Los corredores biológicos conectan áreas protegidas para que dantas, perezosos y jaguares puedan reproducirse y encontrar alimento sin fronteras.",
    en: "Biological corridors connect protected areas so tapirs, sloths, and jaguars can reproduce and find food across safe territories."
  },
  {
    id: "tip-7",
    location: "Sarapiquí, Heredia",
    icon: "💚",
    es: "Si encuentras un perezoso cruzando la calle, nunca lo levantes bruscamente: avisa a guardaparques del MINAE o detén el tráfico con precaución.",
    en: "If you spot a sloth crossing the road, never pick it up abruptly: alert MINAE park rangers or safely slow down traffic."
  }
];

