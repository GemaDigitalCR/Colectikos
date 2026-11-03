export interface TriviaQuestion {
  id: string;
  category: "GEOGRAFIA" | "FAUNA_FLORA" | "PARQUES" | "HISTORIA_CULTURA";
  categoryLabel: { es: string; en: string };
  question: { es: string; en: string };
  options: { es: string[]; en: string[] };
  correctIndex: number;
  explanation: { es: string; en: string };
  source: string;
}

export const PREGUNTIKAS_BANK: TriviaQuestion[] = [
  // --- GEOGRAFÍA ---
  {
    id: "geo-1",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuál es el punto de mayor altitud sobre el nivel del mar en Costa Rica?",
      en: "What is the highest point above sea level in Costa Rica?"
    },
    options: {
      es: ["Volcán Irazú", "Cerro Chirripó (3.820 m)", "Cerro de la Muerte", "Volcán Barva"],
      en: ["Irazú Volcano", "Mount Chirripó (3,820 m)", "Cerro de la Muerte", "Barva Volcano"]
    },
    correctIndex: 1,
    explanation: {
      es: "El Cerro Chirripó se eleva a 3.820 metros sobre el nivel del mar. En días despejados, desde su cumbre se pueden observar tanto el Océano Pacífico como el Mar Caribe.",
      en: "Mount Chirripó stands at 3,820 meters above sea level. On clear days, both the Pacific Ocean and Caribbean Sea can be seen from its summit."
    },
    source: "Instituto Geográfico Nacional (IGN)"
  },
  {
    id: "geo-2",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuántas provincias conforman la República de Costa Rica?",
      en: "How many provinces make up the Republic of Costa Rica?"
    },
    options: {
      es: ["5 provincias", "6 provincias", "7 provincias", "8 provincias"],
      en: ["5 provinces", "6 provinces", "7 provinces", "8 provinces"]
    },
    correctIndex: 2,
    explanation: {
      es: "Costa Rica está dividida territorialmente en 7 provincias: San José, Alajuela, Cartago, Heredia, Guanacaste, Puntarenas y Limón.",
      en: "Costa Rica is territorially divided into 7 provinces: San José, Alajuela, Cartago, Heredia, Guanacaste, Puntarenas, and Limón."
    },
    source: "División Territorial Administrativa de Costa Rica"
  },
  {
    id: "geo-3",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuál es la provincia más extensa en superficie territorial de Costa Rica?",
      en: "Which is the largest province by land area in Costa Rica?"
    },
    options: {
      es: ["Guanacaste", "Puntarenas", "Limón", "San José"],
      en: ["Guanacaste", "Puntarenas", "Limón", "San José"]
    },
    correctIndex: 1,
    explanation: {
      es: "Puntarenas es la provincia más grande del país con aproximadamente 11.266 km², abarcando gran parte del litoral pacífico y la Península de Osa.",
      en: "Puntarenas is the largest province in the country covering approximately 11,266 km², spanning most of the Pacific coastline and the Osa Peninsula."
    },
    source: "Instituto Geográfico Nacional (IGN)"
  },
  {
    id: "geo-4",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Qué volcán costarricense posee el cráter activo tipo 'lago ácido' más alto del país?",
      en: "Which Costa Rican volcano features the highest active acidic crater lake in the country?"
    },
    options: {
      es: ["Volcán Poás", "Volcán Irazú (3.432 m)", "Volcán Arenal", "Volcán Turrialba"],
      en: ["Poás Volcano", "Irazú Volcano (3,432 m)", "Arenal Volcano", "Turrialba Volcano"]
    },
    correctIndex: 1,
    explanation: {
      es: "El Volcán Irazú es el volcán más alto de Costa Rica con 3.432 metros sobre el nivel del mar y alberga una famosa laguna de cráter con tonalidades turquesa o verde esmeralda.",
      en: "Irazú Volcano is the highest volcano in Costa Rica at 3,432 meters above sea level and houses a famous crater lagoon with vibrant turquoise hues."
    },
    source: "OVSICORI-UNA"
  },
  {
    id: "geo-5",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuál es el lago o embalse artificial más grande de Costa Rica, fundamental para energía hidroeléctrica?",
      en: "What is the largest artificial lake or reservoir in Costa Rica, vital for hydroelectric power?"
    },
    options: {
      es: ["Laguna de Fraijanes", "Laguna de Cachí", "Lago Arenal", "Laguna de Hule"],
      en: ["Fraijanes Lagoon", "Cachí Reservoir", "Lake Arenal", "Hule Lagoon"]
    },
    correctIndex: 2,
    explanation: {
      es: "El Lago Arenal tiene una superficie de aproximadamente 85 km² y genera una porción sustancial de la energía hidroeléctrica limpia de Costa Rica.",
      en: "Lake Arenal spans approximately 85 km² and generates a substantial portion of Costa Rica's clean hydroelectric power."
    },
    source: "Instituto Costarricense de Electricidad (ICE)"
  },
  {
    id: "geo-6",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿En qué provincia se ubica la famosa Península de Nicoya compartida territorialmente?",
      en: "Which two provinces share the territory of the famous Nicoya Peninsula?"
    },
    options: {
      es: ["Guanacaste y Puntarenas", "Guanacaste y Alajuela", "Puntarenas y San José", "Limón y Cartago"],
      en: ["Guanacaste and Puntarenas", "Guanacaste and Alajuela", "Puntarenas and San José", "Limón and Cartago"]
    },
    correctIndex: 0,
    explanation: {
      es: "La parte norte de la Península de Nicoya pertenece a Guanacaste, mientras que el extremo sur (Cóbano, Montezuma, Malpaís) forma parte de la provincia de Puntarenas.",
      en: "The northern part of the Nicoya Peninsula belongs to Guanacaste, while the southern tip (Cóbano, Montezuma, Malpaís) is part of Puntarenas province."
    },
    source: "Instituto Geográfico Nacional (IGN)"
  },
  {
    id: "geo-7",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuál cuerpo de agua en el Pacífico Sur costarricense es considerado uno de los únicos cuatro fiordos tropicales del mundo?",
      en: "Which body of water in Costa Rica's South Pacific is considered one of only four tropical fjords in the world?"
    },
    options: {
      es: ["Golfo de Papagayo", "Golfo de Nicoya", "Golfo Dulce", "Bahía Drake"],
      en: ["Gulf of Papagayo", "Gulf of Nicoya", "Golfo Dulce", "Drake Bay"]
    },
    correctIndex: 2,
    explanation: {
      es: "El Golfo Dulce es una ensenada profunda y protegida de gran valor ecológico, clasificada como 'fiordo tropical' por su singular batimetría y calma hídrica.",
      en: "Golfo Dulce is a sheltered deep marine inlet classified as a 'tropical fjord' due to its rare bathymetric depth, acting as a crucial sanctuary for marine life."
    },
    source: "CIMAR - Universidad de Costa Rica (UCR)"
  },
  {
    id: "geo-8",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuál es el río más caudaloso y con la cuenca hidrográfica más extensa de Costa Rica?",
      en: "Which is the most voluminous river with the largest drainage basin in Costa Rica?"
    },
    options: {
      es: ["Río San Juan", "Río Grande de Térraba (Diquís)", "Río Reventazón", "Río Tempisque"],
      en: ["San Juan River", "Grande de Térraba River (Diquís)", "Reventazón River", "Tempisque River"]
    },
    correctIndex: 1,
    explanation: {
      es: "Con una longitud de 160 km y una cuenca de más de 5.000 km², el Río Grande de Térraba (o Diquís) es la principal arteria fluvial del sur costarricense.",
      en: "Stretching 160 km with a watershed exceeding 5,000 km², the Grande de Térraba (Diquís) River is Costa Rica's largest and most voluminous river."
    },
    source: "Instituto Costarricense de Electricidad (ICE) / IGN"
  },
  {
    id: "geo-9",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuántas cordilleras principales conforman el eje montañoso central de Costa Rica?",
      en: "How many major mountain ranges make up the central spine of Costa Rica?"
    },
    options: {
      es: ["2 cordilleras", "3 cordilleras", "4 cordilleras", "6 cordilleras"],
      en: ["2 ranges", "3 ranges", "4 ranges", "6 ranges"]
    },
    correctIndex: 2,
    explanation: {
      es: "El territorio nacional está atravesado por cuatro cordilleras: Guanacaste, Tilarán, Volcánica Central y Talamanca.",
      en: "Costa Rica is traversed by four primary cordilleras: Guanacaste, Tilarán, Central Volcanic, and Talamanca."
    },
    source: "Instituto Geográfico Nacional (IGN)"
  },
  {
    id: "geo-10",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuál es la isla fluvial y continental más extensa de Costa Rica, situada en la provincia de Limón?",
      en: "Which is Costa Rica's largest inland and river island, located in the Limón province?"
    },
    options: {
      es: ["Isla del Caño", "Isla Chira", "Isla Calero", "Isla San Lucas"],
      en: ["Caño Island", "Chira Island", "Calero Island", "San Lucas Island"]
    },
    correctIndex: 2,
    explanation: {
      es: "Isla Calero tiene una superficie de más de 150 km² en el delta del río San Juan y el mar Caribe, constituyendo la isla más grande del país.",
      en: "Calero Island spans over 150 km² in the San Juan River delta along the Caribbean Sea, making it Costa Rica's largest island."
    },
    source: "Instituto Geográfico Nacional (IGN)"
  },
  {
    id: "geo-11",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿En las faldas de cuál volcán nacen las aguas de la majestuosa Catarata La Fortuna de 70 metros de caída?",
      en: "On the slopes of which volcano do the waters of the 70-meter La Fortuna Waterfall originate?"
    },
    options: {
      es: ["Volcán Arenal", "Volcán Poás", "Volcán Cerro Chato", "Volcán Barva"],
      en: ["Arenal Volcano", "Poás Volcano", "Cerro Chato Volcano", "Barva Volcano"]
    },
    correctIndex: 2,
    explanation: {
      es: "Las aguas de la Catarata La Fortuna se originan en los bosques nubosos del extinto Cerro Chato antes de precipitarse por un impresionante acantilado rocoso.",
      en: "The river and 70-meter drop of La Fortuna Waterfall originate in the lush rainforest slopes of the extinct Cerro Chato volcano."
    },
    source: "ADIFORT / IGN"
  },
  {
    id: "geo-12",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Cuál es el paso vial de mayor altitud sobre la Carretera Interamericana Sur en Costa Rica, superando los 3.300 msnm?",
      en: "What is the highest mountain roadway pass on the Pan-American Highway in Costa Rica, exceeding 3,300 meters?"
    },
    options: {
      es: ["Paso de la Palma", "Cerro de la Muerte (Macizo de la Muerte)", "Alto de Ochomogo", "Paso Real"],
      en: ["La Palma Pass", "Cerro de la Muerte", "Ochomogo Pass", "Paso Real"]
    },
    correctIndex: 1,
    explanation: {
      es: "El Cerro de la Muerte alcanza los 3.345 msnm en la Ruta 2; fue bautizado así por los antiguos caminantes que sucumbían a la hipotermia al cruzar la cordillera a pie.",
      en: "Cerro de la Muerte reaches 3,345 meters along Route 2; it was historically named by travelers who succumbed to extreme cold while crossing the mountain range on foot."
    },
    source: "MOPT / Instituto Geográfico Nacional (IGN)"
  },
  {
    id: "geo-13",
    category: "GEOGRAFIA",
    categoryLabel: { es: "Geografía", en: "Geography" },
    question: {
      es: "¿Qué golfo separa la Península de Nicoya del territorio continental de Costa Rica?",
      en: "Which gulf separates the Nicoya Peninsula from mainland Costa Rica?"
    },
    options: {
      es: ["Golfo Dulce", "Golfo de Papagayo", "Golfo de Nicoya", "Golfo de Santa Elena"],
      en: ["Golfo Dulce", "Gulf of Papagayo", "Gulf of Nicoya", "Gulf of Santa Elena"]
    },
    correctIndex: 2,
    explanation: {
      es: "El Golfo de Nicoya es una rica ensenada estuarina del Pacífico que alberga importantes islas como Chira, Venado, Caballo y la histórica Isla San Lucas.",
      en: "The Gulf of Nicoya is a biodiverse Pacific marine inlet home to prominent islands such as Chira, Venado, Caballo, and historic San Lucas Island."
    },
    source: "Instituto Geográfico Nacional (IGN)"
  },

  // --- FAUNA Y FLORA AUTÓCTONA ---
  {
    id: "fauna-1",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Cuál es el Ave Nacional de Costa Rica declarada por Ley en 1977?",
      en: "What is the National Bird of Costa Rica declared by law in 1977?"
    },
    options: {
      es: ["El Quetzal", "La Lapa Roja", "El Yigüirro (Turdus grayi)", "El Tucán Pico Iris"],
      en: ["The Resplendent Quetzal", "The Scarlet Macaw", "The Clay-colored Thrush (Yigüirro)", "The Keel-billed Toucan"]
    },
    correctIndex: 2,
    explanation: {
      es: "El Yigüirro fue declarado Ave Nacional por su melodioso y persistente canto al iniciar la época lluviosa, ligado a las labores agrícolas tradicionales de nuestros campesinos.",
      en: "The Clay-colored Thrush (Yigüirro) was declared National Bird for its melodious singing at the onset of rainy season, historically signaling planting time for Costa Rican farmers."
    },
    source: "Ley N° 6031 de la República de Costa Rica"
  },
  {
    id: "fauna-2",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Cuál de estos mamíferos terrestres es el más grande autóctono de los bosques de Costa Rica?",
      en: "Which of these terrestrial mammals is the largest native to the forests of Costa Rica?"
    },
    options: {
      es: ["El Jaguar", "La Danta o Tapir (Tapirus bairdii)", "El Manigordo", "El Saíno"],
      en: ["The Jaguar", "Baird's Tapir (Danta)", "The Ocelot", "The Collared Peccary"]
    },
    correctIndex: 1,
    explanation: {
      es: "La Danta o Tapir de Baird es el mamífero terrestre más grande del Neotrópico, pudiendo alcanzar hasta 300 kg. Cumple un rol ecológico vital como 'arquitecto y sembrador del bosque'.",
      en: "Baird's Tapir is the largest native terrestrial mammal in Central America, weighing up to 300 kg and acting as a vital seed disperser for tropical rainforests."
    },
    source: "SINAC / UICN"
  },
  {
    id: "fauna-3",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Cuál es la Flor Nacional de Costa Rica desde 1939?",
      en: "What is the National Flower of Costa Rica since 1939?"
    },
    options: {
      es: ["La Flor de Loto", "La Guaria Morada (Guarianthe skinneri)", "La Heliconia", "La Orquídea Vainilla"],
      en: ["The Lotus Flower", "The Guaria Morada Orchid", "The Heliconia", "The Vanilla Orchid"]
    },
    correctIndex: 1,
    explanation: {
      es: "La Guaria Morada es una hermosa orquídea epífita tradicionalmente asociada con la belleza de los hogares costarricenses y la época de Cuaresma.",
      en: "The Guaria Morada is a stunning purple epiphyte orchid traditionally cultivated in Costa Rican homes, blooming prominently between January and March."
    },
    source: "Decreto Ejecutivo N° 24 de 1939"
  },
  {
    id: "fauna-4",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Cuál árbol fue declarado Árbol Nacional de Costa Rica en 1959 como homenaje al pueblo de una provincia?",
      en: "Which tree was declared National Tree of Costa Rica in 1959 honoring a province's annexation?"
    },
    options: {
      es: ["El Árbol de Guanacaste (Enterolobium cyclocarpum)", "El Cortez Amarillo", "El Roble Sabana", "El Cedro Amargo"],
      en: ["The Guanacaste Tree", "The Golden Trumpet Tree", "The Pink Poui (Roble Sabana)", "The Spanish Cedar"]
    },
    correctIndex: 0,
    explanation: {
      es: "El Árbol de Guanacaste fue declarado Árbol Nacional como homenaje al gesto patrio de los habitantes del Partido de Nicoya al anexarse a Costa Rica en 1824.",
      en: "The Guanacaste Tree was declared National Tree honoring the annexation of the Nicoya territory to Costa Rica in 1824 and its immense shade sheltering cattle."
    },
    source: "Decreto Ejecutivo N° 7 de 1959"
  },
  {
    id: "fauna-5",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Qué mamífero marino fue declarado Símbolo Nacional de la Fauna Marina de Costa Rica en 2014?",
      en: "Which marine mammal was declared National Symbol of Marine Fauna in Costa Rica in 2014?"
    },
    options: {
      es: ["La Ballena Jorobada", "El Delfín Nariz de Botella", "El Manatí del Caribe (Trichechus manatus)", "La Mantarraya Gigante"],
      en: ["The Humpback Whale", "The Bottlenose Dolphin", "The West Indian Manatee", "The Giant Manta Ray"]
    },
    correctIndex: 2,
    explanation: {
      es: "El Manatí fue propuesto como símbolo patrio por iniciativa de estudiantes de la Escuela Barrio Limoncito en Limón para concientizar sobre su protección en los canales del Caribe.",
      en: "The Manatee was officially declared a National Symbol following a legislative initiative championed by elementary school children in Limón to protect the species."
    },
    source: "Ley N° 9260 de la República de Costa Rica"
  },
  {
    id: "fauna-6",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Cuál es el perezoso autóctono más común en Costa Rica que tiene dos garras en sus patas delanteras?",
      en: "Which native Costa Rican sloth features two digits on its front limbs?"
    },
    options: {
      es: ["Perezoso de tres dedos", "Perezoso de dos dedos (Choloepus hoffmanni)", "Oso Hormiguero", "Tamandúa"],
      en: ["Three-toed Sloth", "Hoffmann's Two-toed Sloth", "Giant Anteater", "Tamandua"]
    },
    correctIndex: 1,
    explanation: {
      es: "En Costa Rica habitan dos especies: el perezoso de tres dedos (Bradypus variegatus) y el de dos dedos (Choloepus hoffmanni). Ambos fueron declarados Símbolo Nacional en 2021.",
      en: "Costa Rica is home to two sloth species: the three-toed and Hoffmann's two-toed sloth. Both were declared National Symbols of Costa Rica in 2021."
    },
    source: "Ley N° 10007 de 2021"
  },
  {
    id: "fauna-7",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Qué mamífero fue declarado Símbolo Nacional de la Fauna Silvestre de Costa Rica en 1995?",
      en: "Which mammal was declared National Symbol of Wildlife in Costa Rica in 1995?"
    },
    options: {
      es: ["El Jaguar", "El Venado Cola Blanca (Odocoileus virginianus)", "El Manigordo", "El Saíno"],
      en: ["The Jaguar", "The White-tailed Deer", "The Ocelot", "The Collared Peccary"]
    },
    correctIndex: 1,
    explanation: {
      es: "El Venado Cola Blanca fue declarado símbolo patrio mediante la Ley N° 7497 en 1995 como emblema para la conservación de la fauna en los bosques costarricenses.",
      en: "The White-tailed Deer was designated as a National Symbol in 1995 under Law 7497 to promote wildlife conservation across Costa Rican ecosystems."
    },
    source: "Ley N° 7497 de 1995"
  },
  {
    id: "fauna-8",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Cuál es la rana arbórea de colores vivos que se ha convertido en el ícono mundial de la biodiversidad de Costa Rica?",
      en: "Which vibrantly colored tree frog has become the global icon of Costa Rica's biodiversity?"
    },
    options: {
      es: ["Rana de Ojos Rojos (Agalychnis callidryas)", "Rana Dardo Roja", "Rana de Cristal", "Rana Toro"],
      en: ["Red-eyed Tree Frog (Agalychnis callidryas)", "Strawberry Poison Dart Frog", "Glass Frog", "Bullfrog"]
    },
    correctIndex: 0,
    explanation: {
      es: "La Rana de Ojos Rojos es nocturna y utiliza sus brillantes ojos carmesí y costados azulados y amarillos para desconcertar visualmente a sus depredadores cuando despierta.",
      en: "The Red-eyed Tree Frog is a nocturnal arboreal amphibian that uses startle coloration—its vibrant red eyes and blue-and-yellow flanks—to disorient predators."
    },
    source: "UCR - Museo de Zoología"
  },
  {
    id: "fauna-9",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Cuál es la tortuga marina más grande del mundo que anida en las costas de Guanacaste y el Caribe costarricense?",
      en: "What is the world's largest sea turtle species that nests on the Pacific and Caribbean shores of Costa Rica?"
    },
    options: {
      es: ["Tortuga Lora", "Tortuga Verde", "Tortuga Baula (Dermochelys coriacea)", "Tortuga Carey"],
      en: ["Olive Ridley Turtle", "Green Sea Turtle", "Leatherback Sea Turtle (Baula)", "Hawksbill Turtle"]
    },
    correctIndex: 2,
    explanation: {
      es: "La tortuga Baula puede medir más de 2 metros y superar los 600 kg. En vez de caparazón rígido de placas óseas, posee una piel coriácea y gruesa.",
      en: "The Leatherback Sea Turtle can exceed 2 meters in length and 600 kg in weight. Unlike other sea turtles, it lacks a rigid bony shell, featuring thick leathery skin instead."
    },
    source: "SINAC / The Leatherback Trust"
  },
  {
    id: "fauna-10",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Por qué las alas de la Mariposa Morpho Azul reflejan un tono azul metálico tan intenso?",
      en: "Why do the wings of the Blue Morpho butterfly reflect such an intense metallic blue color?"
    },
    options: {
      es: ["Por un pigmento azul extraído de las flores", "Por microestructuras que difractan la luz en sus escamas", "Por bioluminiscencia química", "Por la acumulación de néctar"],
      en: ["Due to a blue plant pigment", "Due to microscopic structural scales that diffract light", "Due to chemical bioluminescence", "Due to concentrated nectar"]
    },
    correctIndex: 1,
    explanation: {
      es: "La coloración de la Mariposa Morpho no es química sino física (coloración estructural): miles de escamas microscópicas reflejan únicamente la longitud de onda de la luz azul.",
      en: "The Blue Morpho's coloration is optical rather than pigment-based: microscopic tree-like nanostructures on its wing scales reflect only blue wavelengths of light."
    },
    source: "INBio / Universidad de Costa Rica"
  },
  {
    id: "fauna-11",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿En qué tipo de hábitat boscoso de altura vive el majestuoso Quetzal Resplandeciente en Costa Rica?",
      en: "In which high-elevation forest habitat does the Resplendent Quetzal reside in Costa Rica?"
    },
    options: {
      es: ["Bosque Tropical Seco", "Bosque Nuboso de montaña", "Manglar costero", "Bosque Húmedo de bajura"],
      en: ["Tropical Dry Forest", "Mountain Cloud Forest", "Coastal Mangrove", "Lowland Wet Rainforest"]
    },
    correctIndex: 1,
    explanation: {
      es: "El Quetzal habita en bosques nubosos entre 1.500 y 3.000 msnm (como Monteverde y Los Santos), donde anida en árboles huecos y se alimenta del fruto del aguacatillo silvestre.",
      en: "The Resplendent Quetzal inhabits cloud forests between 1,500 and 3,000 meters (such as Monteverde and Los Santos), nesting in hollow snags and eating wild avocados."
    },
    source: "SINAC / Asociación Ornitológica de Costa Rica"
  },
  {
    id: "fauna-12",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Cuál es el felino más grande que habita en los bosques tropicales de Costa Rica?",
      en: "What is the largest cat species inhabiting the tropical rainforests of Costa Rica?"
    },
    options: {
      es: ["Puma", "Ocelote o Manigordo", "Jaguar (Panthera onca)", "Yaguarundí"],
      en: ["Puma", "Ocelot (Manigordo)", "Jaguar (Panthera onca)", "Jaguarundi"]
    },
    correctIndex: 2,
    explanation: {
      es: "El Jaguar es el superdepredador terrestre más grande de América. En Costa Rica sus poblaciones más vitales se concentran en Corcovado, Tortuguero y la Cordillera de Talamanca.",
      en: "The Jaguar is the largest feline in the Americas. In Costa Rica, key breeding populations thrive in protected wilderness areas like Corcovado, Tortuguero, and Talamanca."
    },
    source: "Panthera Costa Rica / SINAC"
  },
  {
    id: "fauna-13",
    category: "FAUNA_FLORA",
    categoryLabel: { es: "Fauna y Flora", en: "Fauna & Flora" },
    question: {
      es: "¿Qué particularidad oceánica hace a las costas pacíficas de Costa Rica únicas para el avistamiento de Ballenas Jorobadas?",
      en: "What unique oceanic migration feature makes Costa Rica's Pacific coast world-renowned for Humpback Whale watching?"
    },
    options: {
      es: ["No migran y viven todo el año en el país", "Reciben dos temporadas de migración al año (del norte y del sur)", "Son las únicas ballenas que nadan en agua dulce", "Vienen solo a alimentarse de fitoplancton"],
      en: ["They are non-migratory residents", "They receive two distinct migration seasons per year (from north and south)", "They are the only whales swimming in freshwater", "They come only to graze phytoplankton"]
    },
    correctIndex: 1,
    explanation: {
      es: "Costa Rica recibe ballenas jorobadas de dos hemisferios distintos: de California y Alaska (diciembre a marzo) y de la Antártida y Chile (julio a octubre) para dar a luz y criar a sus ballenatos.",
      en: "Costa Rica hosts humpback whales from two hemispheres: Northern hemisphere whales (December–March) and Antarctic Southern hemisphere whales (July–October) come to calve and nurse."
    },
    source: "CIMAR - Universidad de Costa Rica / SINAC"
  },

  // --- PARQUES NACIONALES ---
  {
    id: "parq-1",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Qué Parque Nacional fue calificado por National Geographic como 'el lugar biológicamente más intenso del planeta'?",
      en: "Which National Park was described by National Geographic as 'the most biologically intense place on Earth'?"
    },
    options: {
      es: ["Manuel Antonio", "Parque Nacional Corcovado", "Tortuguero", "Rincón de la Vieja"],
      en: ["Manuel Antonio", "Corcovado National Park", "Tortuguero", "Rincón de la Vieja"]
    },
    correctIndex: 1,
    explanation: {
      es: "Corcovado protege más de 40.000 hectáreas de selva tropical primaria en la Península de Osa y alberga aproximadamente el 2.5% de la biodiversidad de todo el planeta.",
      en: "Corcovado protects over 40,000 hectares of primary rainforest on the Osa Peninsula, harboring around 2.5% of the planet's entire biodiversity."
    },
    source: "SINAC / National Geographic"
  },
  {
    id: "parq-2",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Cuál parque nacional caribeño es el sitio de anidación más importante del hemisferio occidental para la tortuga verde?",
      en: "Which Caribbean national park is the most important nesting site in the Western Hemisphere for green sea turtles?"
    },
    options: {
      es: ["Parque Nacional Cahuita", "Parque Nacional Tortuguero", "Gandoca-Manzanillo", "Barra del Colorado"],
      en: ["Cahuita National Park", "Tortuguero National Park", "Gandoca-Manzanillo", "Barra del Colorado"]
    },
    correctIndex: 1,
    explanation: {
      es: "Tortuguero es famoso mundialmente por sus canales navegables y por ser la principal playa de desove de la tortuga verde (Chelonia mydas) en el Caribe occidental.",
      en: "Tortuguero is internationally renowned for its rainforest navigable canals and for being the premier Western Caribbean nesting beach for green sea turtles."
    },
    source: "Sea Turtle Conservancy / SINAC"
  },
  {
    id: "parq-3",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Qué parque nacional insular oceánico de Costa Rica fue declarado Patrimonio Natural de la Humanidad por la UNESCO?",
      en: "Which oceanic island national park in Costa Rica was declared a UNESCO World Heritage Site?"
    },
    options: {
      es: ["Isla del Caño", "Isla Chira", "Parque Nacional Isla del Coco", "Isla San Lucas"],
      en: ["Caño Island", "Chira Island", "Cocos Island National Park", "San Lucas Island"]
    },
    correctIndex: 2,
    explanation: {
      es: "La Isla del Coco se encuentra a unos 550 km al suroeste de la costa pacífica y es un laboratorio natural extraordinario con gran abundancia de tiburones martillo y especies endémicas.",
      en: "Cocos Island is located about 550 km off the Pacific mainland and is an extraordinary natural laboratory famous for massive hammerhead shark aggregations."
    },
    source: "UNESCO World Heritage Centre / SINAC"
  },
  {
    id: "parq-4",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿En qué parque nacional se encuentra la famosa formación de 'Río Celeste' con su particular coloración turquesa?",
      en: "In which national park is the famous 'Río Celeste' with its distinctive turquoise blue waters located?"
    },
    options: {
      es: ["Parque Nacional Volcán Tenorio", "Parque Nacional Volcán Miravalles", "Parque Nacional Braulio Carrillo", "Parque Nacional Tapantí"],
      en: ["Tenorio Volcano National Park", "Miravalles Volcano National Park", "Braulio Carrillo National Park", "Tapantí National Park"]
    },
    correctIndex: 0,
    explanation: {
      es: "El color celeste se produce en el punto llamado 'Los Teñideros', donde dos ríos transparentes se mezclan y provocan una ilusión óptica debida a partículas microscópicas de aluminosilicatos.",
      en: "The turquoise color occurs at 'Los Teñideros', where two clear streams converge and mineral nanoparticles of aluminosilicate scatter sunlight through Mie scattering."
    },
    source: "UCR / SINAC"
  },
  {
    id: "parq-5",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Cuál parque nacional protege el bosque tropical seco más importante y restaurado de Mesoamérica?",
      en: "Which national park protects the most vital restored tropical dry forest in Mesoamerica?"
    },
    options: {
      es: ["Parque Nacional Santa Rosa", "Parque Nacional Barra Honda", "Parque Nacional Carara", "Parque Nacional Manuel Antonio"],
      en: ["Santa Rosa National Park", "Barra Honda National Park", "Carara National Park", "Manuel Antonio National Park"]
    },
    correctIndex: 0,
    explanation: {
      es: "Santa Rosa fue el primer parque nacional de Costa Rica (1971) y protege tanto la Casona histórica como el ecosistema de bosque seco tropical en Guanacaste.",
      en: "Santa Rosa was Costa Rica's first national park (1971), preserving both the historic battle Casona and the largest continuous tropical dry forest in Mesoamerica."
    },
    source: "Área de Conservación Guanacaste (ACG) / SINAC"
  },
  {
    id: "parq-6",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Qué parque nacional del Caribe Sur protege el arrecife coralino más extenso y desarrollado de Costa Rica?",
      en: "Which Caribbean national park protects the most extensive coral reef system in Costa Rica?"
    },
    options: {
      es: ["Parque Nacional Cahuita", "Parque Nacional Manuel Antonio", "Parque Nacional Marino Ballena", "Parque Nacional Palo Verde"],
      en: ["Cahuita National Park", "Manuel Antonio National Park", "Marino Ballena National Park", "Palo Verde National Park"]
    },
    correctIndex: 0,
    explanation: {
      es: "Cahuita protege un arrecife de coral con más de 35 especies de corales y 120 especies de peces marinos, administrado conjuntamente con la comunidad local.",
      en: "Cahuita preserves a vibrant coral reef boasting over 35 coral species and 120 fish species, co-managed through an exemplary alliance with the local community."
    },
    source: "SINAC"
  },
  {
    id: "parq-7",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Qué famosa formación costera natural se revela en marea baja en el Parque Nacional Marino Ballena en Uvita?",
      en: "What famous natural coastal sand formation is revealed during low tide at Marino Ballena National Park in Uvita?"
    },
    options: {
      es: ["Un arco de piedra volcánica", "Un tómbolo de arena con forma de cola de ballena", "Una caverna submarina con bufadero", "Un banco de coral fosilizado"],
      en: ["A volcanic rock arch", "A natural sand tombolo shaped like a whale's tail", "A submarine blowhole cave", "A fossilized coral bank"]
    },
    correctIndex: 1,
    explanation: {
      es: "El tómbolo de Punta Uvita es una formación geológica sedimentaria que, asombrosamente, dibuja la silueta perfecta de una cola de ballena, coincidiendo con la zona de paso de estos cetáceos.",
      en: "Punta Uvita's tombolo is a sandbar spit that naturally mimics the shape of a whale's fluke tail, located precisely where humpback whales migrate."
    },
    source: "SINAC - Área de Conservación Osa (ACOSA)"
  },
  {
    id: "parq-8",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Por qué es reconocido a nivel mundial el Parque Nacional Palo Verde en la cuenca baja del Río Tempisque?",
      en: "Why is Palo Verde National Park in the lower Tempisque River basin recognized worldwide?"
    },
    options: {
      es: ["Por sus aguas termales sulfurosas", "Por ser un humedal santuario de aves acuáticas y migratorias", "Por sus arrecifes de coral virgen", "Por sus bosques nubosos de robles centenarios"],
      en: ["For its volcanic sulfur hot springs", "For being a vital wetland sanctuary for aquatic and migratory birds", "For its virgin coral reef systems", "For its ancient mountain oak forests"]
    },
    correctIndex: 1,
    explanation: {
      es: "Palo Verde es un sitio Ramsar de importancia internacional donde hasta 250.000 aves acuáticas (garzas, cigüeñas, patos aguja) se congregan durante la época seca en sus lagunas y pastizales inundados.",
      en: "Palo Verde is a Ramsar wetland of international importance where up to 250,000 aquatic and migratory birds congregate each dry season in its lagoons and floodplains."
    },
    source: "Convención Ramsar / SINAC"
  },
  {
    id: "parq-9",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Qué maravilla geológica subterránea única en Costa Rica protege el Parque Nacional Barra Honda en Nicoya?",
      en: "What unique underground geological wonder in Costa Rica does Barra Honda National Park in Nicoya protect?"
    },
    options: {
      es: ["Un lago de lava perpetuo", "Un complejo de cavernas kársticas con estalagmitas y estalactitas", "Una duna de arena fósil móvil", "Un géiser de vapor geotérmico"],
      en: ["A perpetual lava lake", "A karst cavern network with stalactites and stalagmites", "A mobile fossilized sand dune", "A geothermal steam geyser"]
    },
    correctIndex: 1,
    explanation: {
      es: "Barra Honda es el único parque nacional en Costa Rica que resguarda un complejo sistema de cavernas de roca caliza originadas en antiguos arrecifes de coral emergidos hace más de 60 millones de años.",
      en: "Barra Honda is the only national park in Costa Rica preserving a vast karst limestone cave network formed from fossilized coral reefs elevated 60 million years ago."
    },
    source: "SINAC - Área de Conservación Tempisque (ACT)"
  },
  {
    id: "parq-10",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Qué parque nacional de densa selva lluviosa es atravesado por la Ruta 32 y el icónico Túnel Zurquí?",
      en: "Which dense rainforest national park is crossed by Route 32 and the iconic Zurquí Tunnel?"
    },
    options: {
      es: ["Parque Nacional Tapantí", "Parque Nacional Braulio Carrillo", "Parque Nacional Los Quetzales", "Parque Nacional Barbilla"],
      en: ["Tapantí National Park", "Braulio Carrillo National Park", "Los Quetzales National Park", "Barbilla National Park"]
    },
    correctIndex: 1,
    explanation: {
      es: "El Parque Nacional Braulio Carrillo abarca casi 50.000 hectáreas de selva tropical virgen y es vital para la recarga acuífera del Valle Central y la conexión vial con el Caribe.",
      en: "Braulio Carrillo National Park covers almost 50,000 hectares of pristine mountain rainforest, safeguarding the Central Valley's water tables and housing Route 32's Zurquí Tunnel."
    },
    source: "SINAC - Área de Conservación Central (ACC)"
  },
  {
    id: "parq-11",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Qué manifestación de vulcanismo secundario es famosa en el sector Las Pailas del Parque Nacional Rincón de la Vieja?",
      en: "What manifestation of secondary geothermal activity is famous in the Las Pailas sector of Rincón de la Vieja National Park?"
    },
    options: {
      es: ["Cascadas de hielo alpino", "Pailas de barro hirviente, fumarolas y fuentes termales", "Ríos de lava fluida constante", "Erupciones de basalto líquido"],
      en: ["Alpine ice waterfalls", "Boiling mud pots, steam vents, and geothermal hot springs", "Continuous flowing lava streams", "Liquid basalt eruptions"]
    },
    correctIndex: 1,
    explanation: {
      es: "En Las Pailas, el vapor volcánico y los gases azufrados calientan el agua subterránea y los minerales arcillosos, creando calderos naturales de barro hirviente a altas temperaturas.",
      en: "At Las Pailas, volcanic steam and sulfurous gases bubble through underground water and clay minerals, creating natural bubbling mud pots and fumaroles."
    },
    source: "OVSICORI-UNA / SINAC"
  },
  {
    id: "parq-12",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Con qué nación vecina comparte Costa Rica el Parque Internacional La Amistad (PILA), Patrimonio Mundial de la UNESCO?",
      en: "With which neighboring nation does Costa Rica share La Amistad International Park (PILA), a UNESCO World Heritage site?"
    },
    options: {
      es: ["Nicaragua", "Panamá", "Colombia", "Honduras"],
      en: ["Nicaragua", "Panama", "Colombia", "Honduras"]
    },
    correctIndex: 1,
    explanation: {
      es: "El Parque Internacional La Amistad es la mayor reserva de bosque virgen de Centroamérica y se extiende por la Cordillera de Talamanca entre los territorios de Costa Rica y Panamá.",
      en: "La Amistad International Park is Central America's largest virgin rainforest reserve, bridging the rugged Talamanca mountain range across Costa Rica and Panama."
    },
    source: "UNESCO World Heritage Centre / SINAC"
  },
  {
    id: "parq-13",
    category: "PARQUES",
    categoryLabel: { es: "Parques Nacionales", en: "National Parks" },
    question: {
      es: "¿Qué récord geológico ostenta el cráter activo principal del Volcán Poás en Alajuela?",
      en: "What geological record does the active main crater of Poás Volcano in Alajuela hold?"
    },
    options: {
      es: ["Es el cráter más profundo del mundo", "Es uno de los cráteres abiertos más anchos del mundo (cerca de 1.3 km de diámetro)", "Es el cráter más frío del planeta", "Es el cráter más joven de Centroamérica"],
      en: ["It is the world's deepest crater", "It is one of the widest active open craters in the world (~1.3 km in diameter)", "It is the coldest crater on Earth", "It is the youngest crater in Central America"]
    },
    correctIndex: 1,
    explanation: {
      es: "El cráter principal del Poás tiene unos 1.3 km de diámetro y 300 metros de profundidad, conteniendo una laguna hiperácida rica en minerales y emisiones fumarólicas.",
      en: "Poás Volcano's main crater spans approximately 1.3 km across and 300 meters deep, containing a hyper-acidic mineral lake with frequent phreatic degassing."
    },
    source: "OVSICORI-UNA / SINAC"
  },

  // --- HISTORIA Y CULTURA TERRITORIAL ---
  {
    id: "hist-1",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿En qué año y fecha abolió Costa Rica su ejército constitucionalmente?",
      en: "In what year did Costa Rica constitutionally abolish its army?"
    },
    options: {
      es: ["1 de diciembre de 1948", "15 de setiembre de 1821", "11 de abril de 1856", "25 de julio de 1824"],
      en: ["December 1, 1948", "September 15, 1821", "April 11, 1856", "July 25, 1824"]
    },
    correctIndex: 0,
    explanation: {
      es: "El 1 de diciembre de 1948, don José Figueres Ferrer dio el mazazo simbólico al cuartel Bellavista (hoy Museo Nacional), aboliendo el ejército para destinar recursos a educación y salud.",
      en: "On December 1, 1948, José Figueres Ferrer smashed the Bellavista military barracks wall (now the National Museum), permanently abolishing the military in favor of education and healthcare."
    },
    source: "Constitución Política de Costa Rica de 1949 / Museo Nacional"
  },
  {
    id: "hist-2",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿En qué región de Costa Rica se crearon las misteriosas esferas precolombinas de piedra Patrimonio Mundial de la UNESCO?",
      en: "In which region of Costa Rica were the mysterious pre-Columbian stone spheres, a UNESCO World Heritage site, created?"
    },
    options: {
      es: ["Valle Central", "Delta del Diquís (Osa, Puntarenas)", "Valle de El General", "Llanuras de San Carlos"],
      en: ["Central Valley", "Diquís Delta (Osa, Puntarenas)", "El General Valley", "San Carlos Plains"]
    },
    correctIndex: 1,
    explanation: {
      es: "Las esferas de piedra fueron esculpidas por sociedades indígenas precolombinas en el Delta del Diquís entre el 300 d.C. y el 1500 d.C., y fueron declaradas Patrimonio Mundial en 2014.",
      en: "The pre-Columbian stone spheres were crafted by indigenous societies in the Diquís Delta between 300 CE and 1500 CE, recognized as World Heritage by UNESCO in 2014."
    },
    source: "Museo Nacional de Costa Rica / UNESCO"
  },
  {
    id: "hist-3",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Cuál fue la primera capital oficial de Costa Rica desde la época colonial hasta 1823?",
      en: "Which city served as Costa Rica's first official capital from colonial times until 1823?"
    },
    options: {
      es: ["San José", "Heredia", "Cartago", "Alajuela"],
      en: ["San José", "Heredia", "Cartago", "Alajuela"]
    },
    correctIndex: 2,
    explanation: {
      es: "Cartago fue fundada en 1563 por Juan Vázquez de Coronado y fue la capital colonial hasta la Batalla de Ochomogo en 1823, cuando el poder se trasladó a San José.",
      en: "Cartago was founded in 1563 by Juan Vázquez de Coronado and served as capital until the Battle of Ochomogo in 1823, when governance shifted to San José."
    },
    source: "Academia de Geografía e Historia de Costa Rica"
  },
  {
    id: "hist-4",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Qué se conmemora en Costa Rica cada 25 de julio?",
      en: "What historic event is celebrated in Costa Rica every July 25th?"
    },
    options: {
      es: ["La Independencia de España", "La Anexión del Partido de Nicoya (1824)", "La Batalla de Rivas", "El Día del Trabajador"],
      en: ["Independence from Spain", "The Annexation of the Nicoya Party (1824)", "The Battle of Rivas", "Labor Day"]
    },
    correctIndex: 1,
    explanation: {
      es: "El 25 de julio de 1824 los habitantes del Partido de Nicoya decidieron unirse por propia voluntad a Costa Rica bajo el lema: 'De la patria por nuestra voluntad'.",
      en: "On July 25, 1824, the residents of the Nicoya territory freely voted to annex themselves to Costa Rica under the historic motto: 'Of the homeland by our own will'."
    },
    source: "Archivo Nacional de Costa Rica"
  },
  {
    id: "hist-5",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Qué símbolo nacional de Costa Rica fue declarado Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO en 2005?",
      en: "Which Costa Rican national symbol was inscribed on UNESCO's Representative List of Intangible Cultural Heritage in 2005?"
    },
    options: {
      es: ["La Marimba", "La Carreta Típica pintada", "La Antorcha de la Independencia", "El Traje Típico"],
      en: ["The Marimba", "The Decorated Ox-Cart (Carreta Típica)", "The Torch of Independence", "The Traditional Costume"]
    },
    correctIndex: 1,
    explanation: {
      es: "La tradición del boyeo y la carreta típica costarricense fue distinguida por la UNESCO por su singular valor artístico, policromía y su rol histórico en el transporte del grano de oro (café).",
      en: "The tradition of oxherding and colorful painted oxcarts was recognized by UNESCO for its unique artistic geometric motifs and role in transporting coffee beans."
    },
    source: "UNESCO Intangible Cultural Heritage"
  },
  {
    id: "hist-6",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Quién es el Héroe Nacional de Costa Rica que quemó el Mesón de Guerra en la Batalla de Rivas en 1856?",
      en: "Who is Costa Rica's National Hero who volunteered to burn the Mesón de Guerra at the Battle of Rivas in 1856?"
    },
    options: {
      es: ["Juanito Mora", "Juan Santamaría", "Nicolás Aguilar Murillo", "Pancha Carrasco"],
      en: ["Juanito Mora", "Juan Santamaría", "Nicolás Aguilar Murillo", "Pancha Carrasco"]
    },
    correctIndex: 1,
    explanation: {
      es: "El soldado alajuelense Juan Santamaría ofrendó su vida el 11 de abril de 1856 al prender fuego al cuartel de los filibusteros de William Walker en Rivas, Nicaragua.",
      en: "Alajuela soldier Juan Santamaría sacrificed his life on April 11, 1856, burning down the hostel stronghold of William Walker's filibuster army in Rivas, Nicaragua."
    },
    source: "Museo Histórico Cultural Juan Santamaría"
  },
  {
    id: "hist-7",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Qué representa el Monumento Nacional Guayabo, ubicado en las laderas del Volcán Turrialba en Cartago?",
      en: "What does Guayabo National Monument, situated on the slopes of Turrialba Volcano in Cartago, represent?"
    },
    options: {
      es: ["La primera catedral colonial de Costa Rica", "El sitio arqueológico prehispánico más importante y complejo del país", "Un cuartel militar de la época de la independencia", "El primer ingenio azucarero del país"],
      en: ["Costa Rica's first colonial cathedral", "The most important and architecturally complex pre-Columbian archaeological site in the country", "An independence-era military fort", "The nation's first sugar mill"]
    },
    correctIndex: 1,
    explanation: {
      es: "Guayabo floreció entre el 1000 a.C. y el 1400 d.C.; conserva calzadas empedradas, basamentos de chozas, tumbas y un acueducto precolombino de piedra que aún funciona a la perfección.",
      en: "Guayabo was inhabited between 1000 BCE and 1400 CE, featuring stone-paved walkways, house mounds, petroglyphs, and a pre-Columbian stone aqueduct that still functions today."
    },
    source: "Museo Nacional de Costa Rica / SINAC"
  },
  {
    id: "hist-8",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Cómo se financió la construcción de la joya arquitectónica del Teatro Nacional de Costa Rica a finales del siglo XIX?",
      en: "How was the construction of the National Theatre of Costa Rica funded in the late 19th century?"
    },
    options: {
      es: ["Con un préstamo internacional británico", "Mediante un impuesto especial voluntario a la exportación del café", "Con donaciones directas de la corona española", "A través de una lotería estatal"],
      en: ["Via a British sovereign loan", "Through a self-imposed export tax on coffee proposed by local growers", "With royal Spanish grants", "Through a state lottery"]
    },
    correctIndex: 1,
    explanation: {
      es: "Inaugurado en 1897, el Teatro Nacional se construyó gracias al tributo sobre cada saco de café exportado que los propios productores y comerciantes solicitaron aplicar al gobierno.",
      en: "Inaugurated in 1897, the National Theatre was financed through a special export duty on coffee sacks, championed by visionary Costa Rican coffee farmers to build a world-class arts venue."
    },
    source: "Teatro Nacional de Costa Rica / MCJ"
  },
  {
    id: "hist-9",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Qué simboliza la tradicional 'Fiesta de los Diablitos' celebrada anualmente en las comunidades indígenas Boruca y Rey Curré?",
      en: "What does the traditional 'Fiesta de los Diablitos' celebrated annually in the indigenous communities of Boruca and Rey Curré symbolize?"
    },
    options: {
      es: ["El inicio de la cosecha de maíz", "La resistencia y victoria espiritual del pueblo indígena contra el conquistador español", "La despedida de los difuntos", "Un pacto de paz entre clanes guerreros"],
      en: ["The start of the corn harvest", "The indigenous people's resistance and spiritual triumph against the Spanish conquistador", "A farewell honoring ancestors", "A peace treaty between warrior clans"]
    },
    correctIndex: 1,
    explanation: {
      es: "En esta ancestral festividad con máscaras de madera de balsa talladas y pintadas a mano, los 'diablitos' (el pueblo indígena) combaten y finalmente derrotan al toro (símbolo del invasor español).",
      en: "In this ancestral ceremony featuring hand-carved balsa wood masks, the 'diablitos' (indigenous warriors) engage in a dramatic ritual dance battle and ultimately overcome the bull (representing Spanish invaders)."
    },
    source: "Museo Nacional de Costa Rica / Ministerio de Cultura y Juventud"
  },
  {
    id: "hist-10",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Qué fecha se conmemora en Costa Rica el 'Día de la Mascarada Tradicional Costarricense'?",
      en: "On what date is the 'Day of Costa Rican Traditional Masquerade' celebrated nationwide?"
    },
    options: {
      es: ["15 de setiembre", "31 de octubre", "25 de diciembre", "11 de abril"],
      en: ["September 15", "October 31", "December 25", "April 11"]
    },
    correctIndex: 1,
    explanation: {
      es: "Establecido por Decreto Ejecutivo en 1996, cada 31 de octubre se festeja la mascarada criolla (el Diablo, la Giganta, el Policía y la Muerte) al compás alegre de las cimarronas de pueblo.",
      en: "Established by Executive Decree in 1996, October 31 celebrates traditional giant folk masks (the Devil, the Giantess, the Cadejos) accompanied by lively brass cimarrona street bands."
    },
    source: "Decreto Ejecutivo N° 25724-C de 1996"
  },
  {
    id: "hist-11",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Quién compuso la música original del Himno Nacional de Costa Rica en 1852?",
      en: "Who composed the original music of the National Anthem of Costa Rica in 1852?"
    },
    options: {
      es: ["José María Zeledón Brenes", "Manuel María Gutiérrez Flores", "Jesús Bonilla Chavarría", "Carmen Lyra"],
      en: ["José María Zeledón Brenes", "Manuel María Gutiérrez Flores", "Jesús Bonilla Chavarría", "Carmen Lyra"]
    },
    correctIndex: 1,
    explanation: {
      es: "El maestro Manuel María Gutiérrez compuso la música en 1852 bajo el mandato de Juan Rafael Mora Porras para recibir diplomáticos de EE.UU. y Reino Unido. La letra actual la escribió José María Zeledón en 1903.",
      en: "Maestro Manuel María Gutiérrez composed the martial score in 1852 under President Juan Rafael Mora Porras to welcome US and British diplomats. The current lyrics were penned in 1903 by José María Zeledón."
    },
    source: "Archivo Nacional de Costa Rica / Ley N° 551"
  },
  {
    id: "hist-12",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿En qué año se consagró por primera vez en la Constitución Política el derecho al voto femenino en Costa Rica?",
      en: "In what year was women's right to vote constitutionally enshrined in Costa Rica?"
    },
    options: {
      es: ["1821", "1913", "1949", "1975"],
      en: ["1821", "1913", "1949", "1975"]
    },
    correctIndex: 2,
    explanation: {
      es: "La Constitución Política de 1949 otorgó la ciudadanía plena y el voto universal a las mujeres costarricenses, siendo Bernarda Vásquez Méndez la primera mujer en votar en el plebiscito de 1950.",
      en: "The 1949 Political Constitution granted full citizenship and universal suffrage to Costa Rican women, with Bernarda Vásquez Méndez casting the historic first female ballot in a 1950 plebiscite."
    },
    source: "Tribunal Supremo de Elecciones (TSE)"
  },
  {
    id: "hist-13",
    category: "HISTORIA_CULTURA",
    categoryLabel: { es: "Historia y Cultura", en: "History & Culture" },
    question: {
      es: "¿Por qué el cultivo del café fue bautizado popularmente como 'El Grano de Oro' en la historia costarricense?",
      en: "Why was coffee cultivation historically nicknamed 'The Golden Grain' (El Grano de Oro) in Costa Rican history?"
    },
    options: {
      es: ["Porque el grano seco tiene un color dorado brillante", "Porque fue el motor económico y de exportación que financió el desarrollo institucional del país", "Porque se descubrió en minas de oro en los cerros de Guanacaste", "Porque era una bebida reservada exclusivamente a las clases adineradas"],
      en: ["Because dried beans turn shimmering gold", "Because it served as the economic and export engine that financed the nation's early institutional development", "Because it was discovered in gold mines in Guanacaste", "Because it was reserved exclusively for the wealthy elite"]
    },
    correctIndex: 1,
    explanation: {
      es: "Hacia 1832 el café se convirtió en el primer producto de exportación costarricense a Europa, transformando la economía, solventando la construcción de escuelas, hospitales, caminos y el Teatro Nacional.",
      en: "By 1832 coffee became Costa Rica's first major global export, generating the public revenues that built early schools, hospitals, roads, ports, and the National Theatre."
    },
    source: "Instituto del Café de Costa Rica (ICAFE)"
  }
];
