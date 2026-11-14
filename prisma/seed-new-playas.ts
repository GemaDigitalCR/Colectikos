import 'dotenv/config';
import prisma from '../src/lib/prisma';

const newPlayas = [
  {
    nombre: "Playa Biesanz",
    nombre_en: "Biesanz Beach",
    categoria: "PLAYA" as const,
    descripcion: "Caleta escondida de aguas calmas color turquesa y selva tropical viva.",
    descripcion_en: "Hidden cove with calm turquoise waters surrounded by lush rainforest.",
    ubicacion: "Quepos, Puntarenas",
    imagenUrl: "/images/Postales_Generales/Playas/Postales-playas-biesanz.png",
    latitude: 9.40098968225027,
    longitude: -84.16800424385173,
    edition: "FOUNDER",
    isVisible: true,
  },
  {
    nombre: "Playa Rajada",
    nombre_en: "Rajada Beach",
    categoria: "PLAYA" as const,
    descripcion: "Playa virgen de arena dorada, mar sereno y formaciones rocosas únicas.",
    descripcion_en: "Pristine beach with golden sand, serene waters, and unique rock formations.",
    ubicacion: "La Cruz, Guanacaste",
    imagenUrl: "/images/Postales_Generales/Playas/Postales-playas-rajada.png",
    latitude: 11.042907213126762,
    longitude: -85.72254178884275,
    edition: "FOUNDER",
    isVisible: true,
  },
  {
    nombre: "Playa Junquillal",
    nombre_en: "Junquillal Beach",
    categoria: "PLAYA" as const,
    descripcion: "Refugio costero de aguas cristalinas y apacibles rodeado de manglares y naturaleza.",
    descripcion_en: "Coastal refuge with crystal-clear calm waters surrounded by mangroves and nature.",
    ubicacion: "La Cruz, Guanacaste",
    imagenUrl: "/images/Postales_Generales/Playas/Postales-playas-junquillal.png",
    latitude: 10.994590722662872,
    longitude: -85.69549785438261,
    edition: "FOUNDER",
    isVisible: true,
  },
];

async function main() {
  console.log("Iniciando inserción / actualización de las 3 nuevas playas en Neon PostgreSQL...");

  for (const playa of newPlayas) {
    const existing = await prisma.lugar.findUnique({
      where: { nombre: playa.nombre },
    });

    if (existing) {
      const updated = await prisma.lugar.update({
        where: { id: existing.id },
        data: {
          nombre_en: playa.nombre_en,
          categoria: playa.categoria,
          descripcion: playa.descripcion,
          descripcion_en: playa.descripcion_en,
          ubicacion: playa.ubicacion,
          imagenUrl: playa.imagenUrl,
          latitude: playa.latitude,
          longitude: playa.longitude,
          edition: playa.edition,
          isVisible: playa.isVisible,
        },
      });
      console.log(`✅ Actualizada existente: ${updated.nombre} (ID: ${updated.id})`);
    } else {
      const created = await prisma.lugar.create({
        data: playa,
      });
      console.log(`🎉 Creada con éxito: ${created.nombre} (ID: ${created.id})`);
    }
  }

  const total = await prisma.lugar.count();
  console.log(`\n✨ Total de postales en la base de datos: ${total}`);
}

main()
  .catch((err) => {
    console.error("❌ Error en seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
