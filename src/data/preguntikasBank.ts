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
  }
];
