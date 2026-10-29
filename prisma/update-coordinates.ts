import 'dotenv/config';
import prisma from '../src/lib/prisma';

const coordenadas = [
  {"nombre": "Volcán Orosí", "latitude": 10.979101614917953, "longitude": -85.47290947020088},
  {"nombre": "Volcán Rincón de la Vieja", "latitude": 10.830582098485292, "longitude": -85.32420310237974},
  {"nombre": "Volcán Miravalles", "latitude": 10.747976865241692, "longitude": -85.15340632314981},
  {"nombre": "Volcán Tenorio", "latitude": 10.672958284562475, "longitude": -85.01467472061989},
  {"nombre": "Volcán Arenal", "latitude": 10.463283257912423, "longitude": -84.70321319080765},
  {"nombre": "Volcán Poás", "latitude": 10.198305892543997, "longitude": -84.23078864812851},
  {"nombre": "Volcán Barva", "latitude": 10.134591243167192, "longitude": -84.10103607177734},
  {"nombre": "Volcán Irazú", "latitude": 9.979313670986756, "longitude": -83.85291242599487},
  {"nombre": "Volcán Turrialba", "latitude": 10.024921319207869, "longitude": -83.76813292503357},
  {"nombre": "Parque Nacional Barbilla", "latitude": 9.971520119853315, "longitude": -83.45421290397644},
  {"nombre": "Parque Nacional Barra Honda", "latitude": 10.17412030006764, "longitude": -85.35242512822151},
  {"nombre": "Parque Nacional Braulio Carrillo", "latitude": 10.16012351290124, "longitude": -83.97412801504159},
  {"nombre": "Parque Nacional Cahuita", "latitude": 9.736932481023184, "longitude": -82.84231904149055},
  {"nombre": "Parque Nacional Carara", "latitude": 9.778120491823901, "longitude": -84.60621941092014},
  {"nombre": "Parque Nacional Chirripó", "latitude": 9.483981290184392, "longitude": -83.48831092147827},
  {"nombre": "Parque Nacional Corcovado", "latitude": 8.537912098234123, "longitude": -83.56412809134102},
  {"nombre": "Parque Nacional Isla San Lucas", "latitude": 9.937210948210492, "longitude": -84.90182901429812},
  {"nombre": "Parque Nacional La Cangreja", "latitude": 9.682109481204912, "longitude": -84.38210928109481},
  {"nombre": "Parque Nacional Los Quetzales", "latitude": 9.558312094812049, "longitude": -83.84210948102941},
  {"nombre": "Parque Nacional Manuel Antonio", "latitude": 9.389210948102941, "longitude": -84.14120948102941},
  {"nombre": "Parque Nacional Marino Ballena", "latitude": 9.152109481029412, "longitude": -83.74210948102941},
  {"nombre": "Parque Nacional Marino Las Baulas", "latitude": 10.332109481029412, "longitude": -85.84210948102941},
  {"nombre": "Parque Nacional Palo Verde", "latitude": 10.352109481029412, "longitude": -85.35210948102941},
  {"nombre": "Parque Nacional Piedras Blancas", "latitude": 8.702109481029412, "longitude": -83.25210948102941},
  {"nombre": "Parque Nacional Rincón de la Vieja", "latitude": 10.782109481029412, "longitude": -85.33210948102941},
  {"nombre": "Parque Nacional Santa Rosa", "latitude": 10.832109481029412, "longitude": -85.61210948102941},
  {"nombre": "Parque Nacional Tapantí Macizo de la Muerte", "latitude": 9.752109481029412, "longitude": -83.78210948102941},
  {"nombre": "Parque Nacional Tortuguero", "latitude": 10.542109481029412, "longitude": -83.50210948102941},
  {"nombre": "Playa Manuel Antonio", "latitude": 9.388210948102941, "longitude": -84.148210948102941},
  {"nombre": "Playa Tamarindo", "latitude": 10.299210948102941, "longitude": -85.841210948102941},
  {"nombre": "Playa Conchal", "latitude": 10.395210948102941, "longitude": -85.812210948102941},
  {"nombre": "Playa Santa Teresa", "latitude": 9.642210948102941, "longitude": -85.168210948102941},
  {"nombre": "Playa Nosara", "latitude": 9.981210948102941, "longitude": -85.672210948102941},
  {"nombre": "Playa Hermosa (Guanacaste)", "latitude": 10.578210948102941, "longitude": -85.678210948102941},
  {"nombre": "Playa Sámara", "latitude": 9.882210948102941, "longitude": -85.528210948102941},
  {"nombre": "Playa Jacó", "latitude": 9.615210948102941, "longitude": -84.628210948102941},
  {"nombre": "Playa Montezuma", "latitude": 9.652210948102941, "longitude": -85.068210948102941},
  {"nombre": "Playa Puerto Viejo", "latitude": 9.658210948102941, "longitude": -82.752210948102941},
  {"nombre": "Playa Manzanillo", "latitude": 9.632210948102941, "longitude": -82.658210948102941},
  {"nombre": "Playa Tortuguero", "latitude": 10.548210948102941, "longitude": -83.502210948102941},
  {"nombre": "Playa Dominical", "latitude": 9.252210948102941, "longitude": -83.862210948102941},
  {"nombre": "Playa Uvita", "latitude": 9.168210948102941, "longitude": -83.748210948102941},
  {"nombre": "Playa Grande", "latitude": 10.328210948102941, "longitude": -85.848210948102941},
  {"nombre": "Playa Flamingo", "latitude": 10.438210948102941, "longitude": -85.788210948102941},
  {"nombre": "Playa Avellanas", "latitude": 10.228210948102941, "longitude": -85.838210948102941},
  {"nombre": "Playa Coyote", "latitude": 9.768210948102941, "longitude": -85.278210948102941},
  {"nombre": "Playa Blanca (Punta Leona)", "latitude": 9.722210948102941, "longitude": -84.658210948102941},
  {"nombre": "Playas del Coco", "latitude": 10.552210948102941, "longitude": -85.698210948102941},
  {"nombre": "Catarata La Fortuna", "latitude": 10.442210948102941, "longitude": -84.668210948102941},
  {"nombre": "Catarata del Toro", "latitude": 10.258210948102941, "longitude": -84.298210948102941},
  {"nombre": "Río Celeste (Tenorio)", "latitude": 10.702210948102941, "longitude": -85.018210948102941},
  {"nombre": "Catarata Nauyaca", "latitude": 9.278210948102941, "longitude": -83.828210948102941},
  {"nombre": "Río Pacuare", "latitude": 9.982210948102941, "longitude": -83.558210948102941},
  {"nombre": "Catarata La Paz", "latitude": 10.208210948102941, "longitude": -84.162210948102941},
  {"nombre": "Río Savegre", "latitude": 9.502210948102941, "longitude": -83.962210948102941},
  {"nombre": "Catarata Llanos de Cortés", "latitude": 10.528210948102941, "longitude": -85.298210948102941},
  {"nombre": "Río Tárcoles", "latitude": 9.802210948102941, "longitude": -84.612210948102941},
  {"nombre": "Río Reventazón", "latitude": 10.128210948102941, "longitude": -83.568210948102941},
  {"nombre": "Catarata Tesoro Escondido", "latitude": 10.188210948102941, "longitude": -84.328210948102941},
  {"nombre": "Catarata El Congo", "latitude": 10.238210948102941, "longitude": -84.228210948102941},
  {"nombre": "Río Corobicí", "latitude": 10.458210948102941, "longitude": -85.128210948102941},
  {"nombre": "Catarata Bijagual", "latitude": 9.748210948102941, "longitude": -84.568210948102941},
  {"nombre": "Río Frío", "latitude": 10.718210948102941, "longitude": -84.748210948102941},
  {"nombre": "Catarata Viento Fresco", "latitude": 10.408210948102941, "longitude": -84.828210948102941},
  {"nombre": "Río Sarapiquí", "latitude": 10.458210948102941, "longitude": -84.018210948102941},
  {"nombre": "Catarata Vuelta del Cañón", "latitude": 10.278210948102941, "longitude": -84.258210948102941},
  {"nombre": "Río Naranjo", "latitude": 9.428210948102941, "longitude": -84.078210948102941},
  {"nombre": "Laguna Hule", "latitude": 10.294210948102941, "longitude": -84.208210948102941},
  {"nombre": "Laguna Botos (Volcán Poás)", "latitude": 10.202210948102941, "longitude": -84.232210948102941},
  {"nombre": "Laguna Sierpe", "latitude": 8.818210948102941, "longitude": -83.478210948102941},
  {"nombre": "Laguna Bonilla", "latitude": 10.028210948102941, "longitude": -83.618210948102941},
  {"nombre": "Laguna de Fraijanes", "latitude": 10.142210948102941, "longitude": -84.188210948102941},
  {"nombre": "Laguna Cote", "latitude": 10.578210948102941, "longitude": -84.918210948102941},
  {"nombre": "Laguna Don Manuel", "latitude": 9.6893762419811, "longitude": -83.97785501828163},
  {"nombre": "Laguna Gandoca", "latitude": 9.598210948102941, "longitude": -82.608210948102941},
  {"nombre": "Parque Metropolitano La Sabana", "latitude": 9.935945016505986, "longitude": -84.10418079048696},
  {"nombre": "Monumento Nacional Guayabo", "latitude": 9.972210948102941, "longitude": -83.692210948102941},
  {"nombre": "Teatro Nacional de Costa Rica", "latitude": 9.933120948102941, "longitude": -84.076810948102941},
  {"nombre": "Museo de los Niños", "latitude": 9.941210948102941, "longitude": -84.080210948102941},
  {"nombre": "Ruinas de Ujarrás", "latitude": 9.825210948102941, "longitude": -83.828210948102941},
  {"nombre": "Basílica de Nuestra Señora de los Ángeles", "latitude": 9.863810948102941, "longitude": -83.912810948102941},
  {"nombre": "Museo del Oro Precolombino", "latitude": 9.933510948102941, "longitude": -84.076210948102941},
  {"nombre": "El Fortín de Heredia", "latitude": 9.998210948102941, "longitude": -84.118210948102941},
  {"nombre": "Parroquia de Grecia", "latitude": 10.073210948102941, "longitude": -84.312210948102941},
  {"nombre": "Parque de Zarcero", "latitude": 10.188210948102941, "longitude": -84.392210948102941},
  {"nombre": "Museo Nacional de Costa Rica", "latitude": 9.932610948102941, "longitude": -84.071210948102941},
  {"nombre": "Catedral Metropolitana", "latitude": 9.932210948102941, "longitude": -84.078810948102941},
  {"nombre": "Monteverde", "latitude": 10.315210948102941, "longitude": -84.825210948102941},
  {"nombre": "Cabo Blanco", "latitude": 9.578210948102941, "longitude": -85.118210948102941},
  {"nombre": "Manzanillo (Limón)", "latitude": 9.631210948102941, "longitude": -82.656210948102941},
  {"nombre": "Ostional", "latitude": 9.998210948102941, "longitude": -85.702210948102941},
  {"nombre": "Caño Negro", "latitude": 10.892210948102941, "longitude": -84.792210948102941},
  {"nombre": "Isla del Caño", "latitude": 8.705210948102941, "longitude": -83.882210948102941}
];

async function main() {
  console.log('Iniciando actualización de coordenadas...');
  let actualizados = 0;
  let noEncontrados = 0;

  for (const lugar of coordenadas) {
    const { nombre, latitude, longitude } = lugar;

    // Actualizamos usando updateMany por si hay coincidencias exactas con el nombre
    const result = await prisma.lugar.updateMany({
      where: {
        nombre: {
          contains: nombre,
          mode: 'insensitive' // Si la base de datos es PostgreSQL, usamos esto para ignorar mayúsculas/minúsculas
        }
      },
      data: {
        latitude: latitude,
        longitude: longitude
      }
    });

    if (result.count > 0) {
      console.log(`✅ Actualizado: ${nombre} (${result.count} registros)`);
      actualizados += result.count;
    } else {
      console.log(`⚠️ No encontrado/Actualizado: ${nombre}`);
      noEncontrados++;
    }
  }

  console.log('--- Resumen ---');
  console.log(`Total actualizados: ${actualizados}`);
  console.log(`Total no encontrados: ${noEncontrados}`);
}

main()
  .catch((e) => {
    console.error('Error al actualizar las coordenadas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
