import React from 'react';
import { PieChart, BarChart2, MapPin, Tent, Users, Award, Map, Navigation, PawPrint } from 'lucide-react';
import prisma from '@/lib/prisma';
import InsightClient from './InsightClient';
import InsightsFilters from './InsightsFilters';
import { generateCrossInsight } from './actions';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const CR_PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

export default async function DemografiaInsights({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang || 'es';
  const isEn = lang === 'en';
  const queryParams = await searchParams; // In Next.js 15, searchParams is a Promise
  const provinciaFilter = typeof queryParams.provincia === 'string' ? queryParams.provincia : undefined;
  const edadFilter = typeof queryParams.edad === 'string' ? queryParams.edad : undefined;
  const preferenciaFilter = typeof queryParams.preferencia === 'string' ? queryParams.preferencia : undefined;

  const baseWhere: any = {};
  if (provinciaFilter) baseWhere.provinciaResidencia = provinciaFilter;
  if (edadFilter) baseWhere.rangoEdad = edadFilter;
  if (preferenciaFilter) baseWhere.tipoLugarPreferido = preferenciaFilter;

  // 1. Fetch Demographics
  const totalUsersWithAge = await prisma.user.count({ where: { ...baseWhere, rangoEdad: { not: null } } });
  const totalUsersWithPref = await prisma.user.count({ where: { ...baseWhere, tipoLugarPreferido: { not: null } } });
  const totalUsersWithLocation = await prisma.user.count({ where: { ...baseWhere, provinciaResidencia: { not: null } } });
  const totalUsersWithStyle = await prisma.user.count({ where: { ...baseWhere, estiloViaje: { not: null } } });
  const totalUsersWithCompany = await prisma.user.count({ where: { ...baseWhere, companiaHabitual: { not: null } } });
  const totalUsersWithGender = await prisma.user.count({ where: { ...baseWhere, genero: { not: null } } });

  const ageData = await prisma.user.groupBy({ by: ['rangoEdad'], _count: { id: true }, where: { ...baseWhere, rangoEdad: { not: null } } });
  const prefData = await prisma.user.groupBy({ by: ['tipoLugarPreferido'], _count: { id: true }, where: { ...baseWhere, tipoLugarPreferido: { not: null } } });
  const locationData = await prisma.user.groupBy({ by: ['provinciaResidencia'], _count: { id: true }, where: { ...baseWhere, provinciaResidencia: { not: null } }, orderBy: { _count: { id: 'desc' } } });
  const placeData = await prisma.user.groupBy({ by: ['lugarFavorito'], _count: { id: true }, where: { ...baseWhere, lugarFavorito: { not: null } }, orderBy: { _count: { id: 'desc' } }, take: 20 });
  const styleData = await prisma.user.groupBy({ by: ['estiloViaje'], _count: { id: true }, where: { ...baseWhere, estiloViaje: { not: null } } });
  const companyData = await prisma.user.groupBy({ by: ['companiaHabitual'], _count: { id: true }, where: { ...baseWhere, companiaHabitual: { not: null } } });
  const genderData = await prisma.user.groupBy({ by: ['genero'], _count: { id: true }, where: { ...baseWhere } });

  const totalAges = totalUsersWithAge || 1;
  const totalPrefs = totalUsersWithPref || 1;
  const totalLocations = totalUsersWithLocation || 1;

  // -- Edades --
  const agePercentages: Record<string, number> = { 
    "<18": 0,
    "18-25": 0, 
    "26-35": 0, 
    "36-45": 0, 
    "46-55": 0, 
    "56+": 0 
  };
  ageData.forEach((d: any) => { 
    if (d.rangoEdad) agePercentages[d.rangoEdad] = Math.round((d._count.id / totalAges) * 100); 
  });
  if (totalUsersWithAge === 0) { 
    agePercentages["<18"] = 5;
    agePercentages["18-25"] = 25; 
    agePercentages["26-35"] = 40; 
    agePercentages["36-45"] = 20; 
    agePercentages["46-55"] = 7;
    agePercentages["56+"] = 3;
  }
  
  const p1 = agePercentages["<18"];
  const p2 = p1 + agePercentages["18-25"];
  const p3 = p2 + agePercentages["26-35"];
  const p4 = p3 + agePercentages["36-45"];
  const p5 = p4 + agePercentages["46-55"];
  const conicGradient = `conic-gradient(#06b6d4 0% ${p1}%, #3b82f6 ${p1}% ${p2}%, #10b981 ${p2}% ${p3}%, #f59e0b ${p3}% ${p4}%, #6366f1 ${p4}% ${p5}%, #ec4899 ${p5}% 100%)`;

  // -- Preferencias --
  const prefMap: Record<string, number> = {};
  prefData.forEach((d: any) => { if (d.tipoLugarPreferido) prefMap[d.tipoLugarPreferido] = Math.round((d._count.id / totalPrefs) * 100); });
  const playa = totalUsersWithPref > 0 ? (prefMap['Playas'] || 0) : 38;
  const montana = totalUsersWithPref > 0 ? (prefMap['Volcanes'] || 0) : 32;
  const aventura = totalUsersWithPref > 0 ? ((prefMap['Ríos'] || 0) + (prefMap['Bosques y Reservas'] || 0)) : 18;
  const relajacion = totalUsersWithPref > 0 ? (prefMap['Cultura'] || 0) : 12;

  // -- Origen (Residente vs Visitante) y Provincias --
  const locationCountMap: Record<string, number> = {};
  let residents = 0;
  let visitors = 0;
  locationData.forEach((d: any) => {
    if (d.provinciaResidencia) {
      locationCountMap[d.provinciaResidencia] = d._count.id;
      if (CR_PROVINCES.includes(d.provinciaResidencia)) residents += d._count.id;
      else visitors += d._count.id;
    }
  });
  const resPct = totalLocations > 1 ? Math.round((residents / totalLocations) * 100) : (totalUsersWithLocation === 0 ? 80 : (residents > 0 ? 100 : 0));
  const visPct = totalLocations > 1 ? Math.round((visitors / totalLocations) * 100) : (totalUsersWithLocation === 0 ? 20 : (visitors > 0 ? 100 : 0));

  // Lista de las 7 provincias oficiales de Costa Rica (garantizando San José y todas las demás)
  const allProvincesList: { name: string; count: number }[] = CR_PROVINCES.map((prov) => ({
    name: prov,
    count: locationCountMap[prov] || 0
  }));

  // Agregar otras ubicaciones registradas no pertenecientes a las 7 provincias (ej. visitantes internacionales)
  locationData.forEach((d: any) => {
    if (d.provinciaResidencia && !CR_PROVINCES.includes(d.provinciaResidencia)) {
      allProvincesList.push({
        name: d.provinciaResidencia,
        count: d._count.id
      });
    }
  });

  // Ordenar de mayor a menor según cantidad de usuarios registrados para destacar los principales polos
  allProvincesList.sort((a, b) => b.count - a.count);

  // Filtrado reactivo si el usuario seleccionó una provincia específica en la barra superior
  const displayLocations = provinciaFilter
    ? allProvincesList.filter(p => p.count > 0 || p.name === provinciaFilter)
    : allProvincesList;

  // -- Estilo de Viaje --
  const styleMap: Record<string, number> = {};
  styleData.forEach((d: any) => { if (d.estiloViaje) styleMap[d.estiloViaje] = d._count.id; });
  const getStylePct = (k: string) => totalUsersWithStyle > 0 ? Math.round(((styleMap[k] || 0) / totalUsersWithStyle) * 100) : 25;

  // -- Compañía Habitual --
  const compMap: Record<string, number> = {};
  companyData.forEach((d: any) => { if (d.companiaHabitual) compMap[d.companiaHabitual] = d._count.id; });
  const getCompPct = (k: string) => totalUsersWithCompany > 0 ? Math.round(((compMap[k] || 0) / totalUsersWithCompany) * 100) : 25;

  // -- Género --
  let femaleCount = 0;
  let maleCount = 0;
  let neutralCount = 0;

  genderData.forEach((d: any) => {
    const rawGen = (d.genero || '').toUpperCase().trim();
    if (rawGen === 'FEMENINO') {
      femaleCount += d._count.id;
    } else if (rawGen === 'MASCULINO') {
      maleCount += d._count.id;
    } else {
      neutralCount += d._count.id;
    }
  });

  const totalGenderUsers = femaleCount + maleCount + neutralCount;
  const femalePct = totalGenderUsers > 0 ? Math.round((femaleCount / totalGenderUsers) * 100) : 0;
  const malePct = totalGenderUsers > 0 ? Math.round((maleCount / totalGenderUsers) * 100) : 0;
  const neutralPct = totalGenderUsers > 0 ? Math.max(0, 100 - femalePct - malePct) : 0;

  // -- Calificaciones (Ratings) --
  let avgRatings: { name: string, avg: number, count: number }[] = [];
  try {
    const placesWithRatings = await prisma.lugar.findMany({
      include: { ratings: { select: { score: true } } }
    });
    avgRatings = placesWithRatings.map((place: any) => {
      const totalScore = place.ratings.reduce((acc: number, curr: any) => acc + curr.score, 0);
      const avg = place.ratings.length > 0 ? totalScore / place.ratings.length : 0;
      return { name: place.nombre, avg: Number(avg.toFixed(1)), count: place.ratings.length };
   }).filter((p: any) => p.count > 0).sort((a: any, b: any) => b.avg - a.avg).slice(0, 5);
  } catch (error) {
    console.log("No se pudo obtener las calificaciones (la tabla puede no existir o no hay conexión):", error);
  }

  if (avgRatings.length === 0) {
    // Mock data si no hay ratings en DB local o si falló la consulta
    avgRatings = [
      { name: 'Volcán Arenal', avg: 3.9, count: 42 },
      { name: 'Parque Nacional Manuel Antonio', avg: 3.8, count: 38 },
      { name: 'Río Celeste', avg: 3.7, count: 35 },
      { name: 'Playa Conchal', avg: 3.5, count: 29 },
      { name: 'Monteverde', avg: 3.4, count: 24 }
    ];
  }

  const totalUsersStr = totalUsersWithAge > 0 ? totalUsersWithAge.toString() : '12k';
  const initialInsight = await generateCrossInsight();

  // Nube de palabras auxiliar
  const maxPlaceCount = placeData.length > 0 ? placeData[0]._count.id : 1;

  return (
    <div className="min-h-screen bg-stone-100 p-6 md:p-10 font-sans text-stone-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header de Filtros Interactivo */}
        <InsightsFilters />

        {/* Fila 1: Edades y Preferencias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Distribución Demográfica */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between mb-8 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-bold text-stone-800 tracking-wide">{isEn ? 'Age Distribution' : 'Distribución de Edad'}</h2>
              <PieChart className="text-emerald-500" size={24} />
            </div>
            
            <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-8 mt-2">
              <div className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-sm transition-all duration-700 ease-in-out shrink-0"
                   style={{ background: conicGradient }}>
                <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-3xl font-black text-stone-800">{totalUsersStr}</span>
                  <span className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1">{isEn ? 'Users' : 'Usuarios'}</span>
                </div>
              </div>
              
              <div className="space-y-3 w-full xl:w-auto">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 shadow-sm"></div>
                  <span className="text-sm font-medium text-stone-600 flex-1">{isEn ? "Under 18 years old" : "Menor de 18 años"}</span>
                  <span className="text-base font-bold text-stone-800">{agePercentages["<18"]}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm"></div>
                  <span className="text-sm font-medium text-stone-600 flex-1">{isEn ? "18 - 25 years" : "18 - 25 años"}</span>
                  <span className="text-base font-bold text-stone-800">{agePercentages["18-25"]}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm"></div>
                  <span className="text-sm font-medium text-stone-600 flex-1">{isEn ? "26 - 35 years" : "26 - 35 años"}</span>
                  <span className="text-base font-bold text-stone-800">{agePercentages["26-35"]}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500 shadow-sm"></div>
                  <span className="text-sm font-medium text-stone-600 flex-1">{isEn ? "36 - 45 years" : "36 - 45 años"}</span>
                  <span className="text-base font-bold text-stone-800">{agePercentages["36-45"]}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-sm"></div>
                  <span className="text-sm font-medium text-stone-600 flex-1">{isEn ? "46 - 55 years" : "46 - 55 años"}</span>
                  <span className="text-base font-bold text-stone-800">{agePercentages["46-55"]}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-pink-500 shadow-sm"></div>
                  <span className="text-sm font-medium text-stone-600 flex-1">{isEn ? "56 years or older" : "56 años o más"}</span>
                  <span className="text-base font-bold text-stone-800">{agePercentages["56+"]}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tendencias de Destino */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between mb-8 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-bold text-stone-800 tracking-wide">Preferencia Principal</h2>
              <Map className="text-blue-500" size={24} />
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-7 w-full mt-2">
              {[
                { label: 'Playas', val: playa, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { label: 'Montaña/Volcanes', val: montana, color: 'bg-blue-500', text: 'text-blue-500' },
                { label: 'Aventura/Naturaleza', val: aventura, color: 'bg-amber-500', text: 'text-amber-500' },
                { label: 'Cultura/Relajación', val: relajacion, color: 'bg-indigo-500', text: 'text-indigo-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-stone-700">{item.label}</span>
                    <span className={`font-bold ${item.text}`}>{item.val}%</span>
                  </div>
                  <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila 2: Origen y Compañía */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ¿De dónde eres? */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-bold text-stone-800 tracking-wide">{isEn ? 'Where are you from? (Residence)' : '¿De dónde eres? (Residencia)'}</h2>
              <MapPin className="text-rose-500" size={24} />
            </div>
            
            <div className="flex gap-4 h-12 rounded-2xl overflow-hidden shadow-inner bg-stone-100 mb-6">
              <div className="bg-rose-500 h-full flex items-center justify-center text-white font-bold text-sm transition-all" style={{ width: `${resPct}%` }}>
                {resPct > 10 && (isEn ? `Residents ${resPct}%` : `Residentes ${resPct}%`)}
              </div>
              <div className="bg-orange-400 h-full flex items-center justify-center text-white font-bold text-sm transition-all" style={{ width: `${visPct}%` }}>
                {visPct > 10 && (isEn ? `Visitors ${visPct}%` : `Visitantes ${visPct}%`)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
              {displayLocations.map((loc) => (
                <div key={loc.name} className="flex justify-between items-center text-sm p-2 bg-stone-50 rounded-xl border border-stone-100 hover:bg-stone-100/70 transition-colors">
                  <span className="text-stone-600 font-medium truncate">{loc.name === 'Limón' && isEn ? 'Limon' : loc.name}</span>
                  <span className="font-bold text-stone-800">{loc.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compañía Habitual */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-bold text-stone-800 tracking-wide">Compañía Habitual</h2>
              <Users className="text-violet-500" size={24} />
            </div>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {[
                { name: 'En Pareja', pct: getCompPct('En Pareja'), color: 'bg-violet-500' },
                { name: 'Familia', pct: getCompPct('Familia'), color: 'bg-fuchsia-500' },
                { name: 'Amigos', pct: getCompPct('Amigos'), color: 'bg-purple-400' },
                { name: 'Solo', pct: getCompPct('Solo'), color: 'bg-slate-400' }
              ].map(comp => (
                <div key={comp.name} className="relative h-12 bg-stone-50 rounded-2xl overflow-hidden border border-stone-100 flex items-center">
                  <div className={`absolute top-0 left-0 h-full ${comp.color} opacity-20`} style={{ width: `${comp.pct}%` }}></div>
                  <div className="relative z-10 w-full flex justify-between px-4 text-sm">
                    <span className="font-bold text-stone-700">{comp.name}</span>
                    <span className="font-bold text-stone-900">{comp.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila 3: Estilo de Viaje y Código de Honor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tu estilo de viaje */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-bold text-stone-800 tracking-wide">Estilo de Viaje</h2>
              <Tent className="text-amber-600" size={24} />
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1">
              {[
                { name: 'Aventurero', pct: getStylePct('Aventurero') },
                { name: 'Relax', pct: getStylePct('Relax') },
                { name: 'Mochilero', pct: getStylePct('Mochilero') },
                { name: 'Familiar', pct: getStylePct('Familiar') }
              ].map(st => (
                <div key={st.name} className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-amber-600 mb-1">{st.pct}%</span>
                  <span className="text-sm font-bold text-stone-700">{st.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución por Género */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-800 tracking-wide">
                  {isEn ? 'Gender Identity' : 'Identidad de Género'}
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isEn ? 'Declared by registered explorers' : 'Declarado por los exploradores'}
                </p>
              </div>
              <Users className="text-rose-500" size={24} />
            </div>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {[
                { name: isEn ? 'Female' : 'Femenino', count: femaleCount, pct: femalePct, color: 'bg-rose-500' },
                { name: isEn ? 'Male' : 'Masculino', count: maleCount, pct: malePct, color: 'bg-blue-500' },
                { name: isEn ? 'Neutral / Other' : 'Neutro / Otro', count: neutralCount, pct: neutralPct, color: 'bg-emerald-500' }
              ].map(gender => (
                <div key={gender.name} className="flex items-center gap-4">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col items-center justify-center shadow-inner">
                    <span className="font-bold text-lg text-stone-700">{gender.pct}%</span>
                    <span className="text-[10px] text-stone-400 font-semibold">{gender.count}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-stone-700">{gender.name}</span>
                      <span className="text-xs text-stone-400 font-medium">{gender.pct}%</span>
                    </div>
                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full ${gender.color} rounded-full transition-all duration-500`} style={{ width: `${gender.pct}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila 4: Nube de Palabras y Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Lugar Favorito */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-stone-100 pb-4">
              <Navigation className="text-emerald-500" size={24} />
              <h2 className="text-lg font-bold text-stone-800 tracking-wide">Lugar Favorito</h2>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4 py-8 px-4 flex-1 bg-stone-50 rounded-2xl border border-stone-100 shadow-inner">
              {placeData.length > 0 ? placeData.map((place: any, idx: any) => {
                const ratio = place._count.id / maxPlaceCount;
                const size = 0.8 + (ratio * 1.7);
                const colors = ['text-emerald-600', 'text-blue-500', 'text-amber-500', 'text-rose-500', 'text-indigo-500', 'text-cyan-600', 'text-fuchsia-600'];
                const colorClass = colors[idx % colors.length];
                
                return (
                  <span 
                    key={idx} 
                    className={`font-black ${colorClass} transition-transform hover:scale-110 cursor-default`}
                    style={{ fontSize: `${size}rem`, opacity: 0.6 + (ratio * 0.4) }}
                    title={`${place._count.id} usuarios`}
                  >
                    {place.lugarFavorito}
                  </span>
                );
              }) : (
                <span className="text-stone-400 font-medium italic">Aún no hay lugares registrados.</span>
              )}
            </div>
          </div>

          {/* Top Calificaciones (Ratings) */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-bold text-stone-800 tracking-wide">Top Postales (Huellas)</h2>
              <PawPrint className="text-amber-500" size={24} />
            </div>
            
            <div className="space-y-5 flex-1 flex flex-col justify-center">
              {avgRatings.map((rating, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-black text-sm shadow-inner">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-stone-700 truncate">{rating.name}</span>
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        {rating.avg} <PawPrint size={14} className="fill-amber-500" />
                      </span>
                    </div>
                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(rating.avg / 4) * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider text-right">{rating.count} reseñas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generador de Insights para Redes (Client Component) */}
        <InsightClient initialInsight={initialInsight} />

      </div>
    </div>
  );
}
