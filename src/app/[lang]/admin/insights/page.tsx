import React from 'react';
import { PieChart, BarChart2, MapPin, Tent, Users, Award, Map, Navigation, PawPrint, Trophy, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import prisma from '@/lib/prisma';
import InsightClient from './InsightClient';
import InsightsFilters from './InsightsFilters';
import { generateCrossInsight } from './actions';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const CR_PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

const CATEGORY_NAMES: Record<string, string> = {
  VOLCAN: 'Volcán',
  PARQUE_NACIONAL: 'Parque Nacional',
  PLAYA: 'Playa',
  RIOS_Y_CATARATAS: 'Ríos y Cataratas',
  LAGUNAS: 'Laguna',
  CIUDAD_Y_CULTURA: 'Ciudad y Cultura',
  BOSQUES_RESERVAS: 'Bosque y Reserva',
  HITOS_CULTURALES: 'Hito Cultural',
};

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

  // -- Postales: Top Desbloqueadas y Top Calificadas --
  const userFilter = Object.keys(baseWhere).length > 0 ? { user: baseWhere } : {};

  let topUnlockedPlaces: {
    id: string;
    nombre: string;
    categoria: string;
    ubicacion: string;
    imagenUrl: string | null;
    unlockCount: number;
    pct: number;
  }[] = [];

  let topRatedPlaces: {
    id: string;
    nombre: string;
    categoria: string;
    ubicacion: string;
    imagenUrl: string | null;
    avgScore: number;
    reviewCount: number;
  }[] = [];

  try {
    const places = await prisma.lugar.findMany({
      where: {
        categoria: { not: 'PROVINCIA' },
        isVisible: true,
      },
      select: {
        id: true,
        nombre: true,
        categoria: true,
        ubicacion: true,
        imagenUrl: true,
        _count: {
          select: {
            userProgress: {
              where: {
                completado: true,
                ...userFilter,
              },
            },
            ratings: {
              where: userFilter,
            },
          },
        },
        ratings: {
          where: userFilter,
          select: { score: true },
        },
      },
    });

    // 1. Top Desbloqueadas
    const sortedByUnlocks = [...places]
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: CATEGORY_NAMES[p.categoria] || p.categoria,
        ubicacion: p.ubicacion,
        imagenUrl: p.imagenUrl,
        unlockCount: p._count.userProgress,
      }))
      .filter((p) => p.unlockCount > 0)
      .sort((a, b) => b.unlockCount - a.unlockCount)
      .slice(0, 5);

    const maxUnlock = sortedByUnlocks[0]?.unlockCount || 1;
    topUnlockedPlaces = sortedByUnlocks.map((p) => ({
      ...p,
      pct: Math.round((p.unlockCount / maxUnlock) * 100),
    }));

    // 2. Top Calificadas (Promedio comunitario)
    topRatedPlaces = places
      .map((p) => {
        const total = p.ratings.reduce((acc, curr) => acc + curr.score, 0);
        const count = p.ratings.length;
        const avg = count > 0 ? total / count : 0;
        return {
          id: p.id,
          nombre: p.nombre,
          categoria: CATEGORY_NAMES[p.categoria] || p.categoria,
          ubicacion: p.ubicacion,
          imagenUrl: p.imagenUrl,
          avgScore: Number(avg.toFixed(1)),
          reviewCount: count,
        };
      })
      .filter((p) => p.reviewCount > 0)
      .sort((a, b) => {
        if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
        return b.reviewCount - a.reviewCount;
      })
      .slice(0, 5);
  } catch (error) {
    console.error("Error al obtener postales top en insights:", error);
  }

  // Fallbacks si la base de datos está en desarrollo o aún no tiene interacciones suficientes
  if (topUnlockedPlaces.length === 0) {
    topUnlockedPlaces = [
      { id: '1', nombre: 'Volcán Arenal', categoria: 'Volcán', ubicacion: 'Alajuela, San Carlos', imagenUrl: null, unlockCount: 142, pct: 100 },
      { id: '2', nombre: 'Parque Nacional Manuel Antonio', categoria: 'Parque Nacional', ubicacion: 'Puntarenas, Quepos', imagenUrl: null, unlockCount: 128, pct: 90 },
      { id: '3', nombre: 'Catarata Río Celeste', categoria: 'Ríos y Cataratas', ubicacion: 'Alajuela, Guatuso', imagenUrl: null, unlockCount: 115, pct: 81 },
      { id: '4', nombre: 'Reserva Bosque Nuboso Monteverde', categoria: 'Bosque y Reserva', ubicacion: 'Puntarenas, Monteverde', imagenUrl: null, unlockCount: 94, pct: 66 },
      { id: '5', nombre: 'Playa Conchal', categoria: 'Playa', ubicacion: 'Guanacaste, Santa Cruz', imagenUrl: null, unlockCount: 82, pct: 58 },
    ];
  }

  if (topRatedPlaces.length === 0) {
    topRatedPlaces = [
      { id: '1', nombre: 'Volcán Arenal', categoria: 'Volcán', ubicacion: 'Alajuela, San Carlos', imagenUrl: null, avgScore: 3.9, reviewCount: 42 },
      { id: '2', nombre: 'Parque Nacional Manuel Antonio', categoria: 'Parque Nacional', ubicacion: 'Puntarenas, Quepos', imagenUrl: null, avgScore: 3.8, reviewCount: 38 },
      { id: '3', nombre: 'Catarata Río Celeste', categoria: 'Ríos y Cataratas', ubicacion: 'Alajuela, Guatuso', imagenUrl: null, avgScore: 3.7, reviewCount: 35 },
      { id: '4', nombre: 'Playa Conchal', categoria: 'Playa', ubicacion: 'Guanacaste, Santa Cruz', imagenUrl: null, avgScore: 3.5, reviewCount: 29 },
      { id: '5', nombre: 'Reserva Bosque Nuboso Monteverde', categoria: 'Bosque y Reserva', ubicacion: 'Puntarenas, Monteverde', imagenUrl: null, avgScore: 3.4, reviewCount: 24 },
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

        {/* Fila 4: Top 5 Postales Más Desbloqueadas y Top 5 Mejor Calificadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top 5 Postales Más Desbloqueadas */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-stone-800 tracking-wide">
                    {isEn ? 'Top 5 Most Unlocked Postcards' : 'Top 5 Postales Más Desbloqueadas'}
                  </h2>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isEn ? 'Destinations with the highest number of completions' : 'Destinos con mayor cantidad de exploradores que los han completado'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Trophy className="text-emerald-600" size={22} />
              </div>
            </div>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {topUnlockedPlaces.map((place, idx) => {
                const rankStyles = [
                  'bg-amber-100 text-amber-800 border-amber-300 shadow-sm ring-2 ring-amber-400/20',
                  'bg-slate-100 text-slate-700 border-slate-300 shadow-sm',
                  'bg-amber-50 text-amber-900 border-amber-200 shadow-sm',
                  'bg-stone-50 text-stone-600 border-stone-200',
                  'bg-stone-50 text-stone-600 border-stone-200',
                ];
                const badgeStyle = rankStyles[idx] || rankStyles[3];

                return (
                  <div key={place.id || idx} className="p-3.5 bg-stone-50/70 hover:bg-stone-50 rounded-2xl border border-stone-100 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center font-black text-sm ${badgeStyle}`}>
                        #{idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-stone-800 text-sm truncate" title={place.nombre}>
                            {place.nombre}
                          </span>
                          <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            {place.unlockCount} {isEn ? 'unlocks' : 'desbloqueos'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
                          <span className="truncate max-w-[200px] sm:max-w-xs">{place.ubicacion}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-stone-200/60 text-stone-600 text-[10px] font-semibold uppercase tracking-wider">
                            {place.categoria}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-stone-200/60 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700" 
                            style={{ width: `${place.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 5 Postales Mejor Calificadas */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-stone-800 tracking-wide">
                    {isEn ? 'Top 5 Highest Rated Postcards' : 'Top 5 Postales Mejor Calificadas'}
                  </h2>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isEn ? 'Community average rating (1 - 4 paw scale)' : 'Promedio otorgado por la comunidad (Escala 1 a 4 huellas)'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <Star className="text-amber-500 fill-amber-400" size={22} />
              </div>
            </div>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {topRatedPlaces.map((place, idx) => {
                const rankStyles = [
                  'bg-amber-100 text-amber-800 border-amber-300 shadow-sm ring-2 ring-amber-400/20',
                  'bg-slate-100 text-slate-700 border-slate-300 shadow-sm',
                  'bg-amber-50 text-amber-900 border-amber-200 shadow-sm',
                  'bg-stone-50 text-stone-600 border-stone-200',
                  'bg-stone-50 text-stone-600 border-stone-200',
                ];
                const badgeStyle = rankStyles[idx] || rankStyles[3];
                const ratingPercent = Math.min(100, Math.round((place.avgScore / 4) * 100));

                return (
                  <div key={place.id || idx} className="p-3.5 bg-stone-50/70 hover:bg-stone-50 rounded-2xl border border-stone-100 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center font-black text-sm ${badgeStyle}`}>
                        #{idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-stone-800 text-sm truncate" title={place.nombre}>
                            {place.nombre}
                          </span>
                          <span className="shrink-0 flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200/80">
                            {place.avgScore.toFixed(1)}
                            <PawPrint size={12} className="fill-amber-500 text-amber-500" />
                            <span className="text-[10px] text-amber-600/80 font-semibold">/ 4</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
                          <span className="truncate max-w-[200px] sm:max-w-xs">{place.ubicacion}</span>
                          <span className="text-[10px] text-stone-400 font-medium">
                            {place.reviewCount} {isEn ? 'reviews' : 'reseñas'}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-stone-200/60 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 rounded-full transition-all duration-700" 
                            style={{ width: `${ratingPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fila 5: Lugar Favorito (Nube de Palabras) */}
        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Navigation className="text-emerald-600" size={22} />
                <h2 className="text-lg font-bold text-stone-800 tracking-wide">
                  {isEn ? 'Favorite Places Mentioned by Explorers' : 'Lugares Favoritos Citados por Exploradores'}
                </h2>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {isEn ? 'Most cited places in Costa Rica during onboarding registration' : 'Lugares de Costa Rica más citados al completar el perfil de explorador'}
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-400 bg-stone-50 px-3 py-1 rounded-full border border-stone-200">
              {placeData.length} {isEn ? 'unique places' : 'menciones únicas'}
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 py-8 px-6 bg-stone-50 rounded-2xl border border-stone-100 shadow-inner min-h-[160px]">
            {placeData.length > 0 ? placeData.map((place: any, idx: any) => {
              const ratio = place._count.id / maxPlaceCount;
              const size = 0.85 + (ratio * 1.8);
              const colors = [
                'text-emerald-600 hover:text-emerald-700',
                'text-blue-500 hover:text-blue-600',
                'text-amber-500 hover:text-amber-600',
                'text-rose-500 hover:text-rose-600',
                'text-indigo-500 hover:text-indigo-600',
                'text-cyan-600 hover:text-cyan-700',
                'text-fuchsia-600 hover:text-fuchsia-700',
                'text-teal-600 hover:text-teal-700'
              ];
              const colorClass = colors[idx % colors.length];
              
              return (
                <span 
                  key={idx} 
                  className={`font-black ${colorClass} transition-all duration-200 hover:scale-110 cursor-default select-none px-2 py-1 rounded-lg hover:bg-white/80 hover:shadow-xs`}
                  style={{ fontSize: `${size}rem`, opacity: 0.65 + (ratio * 0.35) }}
                  title={`${place.lugarFavorito}: ${place._count.id} ${isEn ? 'explorers' : 'exploradores'}`}
                >
                  {place.lugarFavorito}
                  <span className="text-[10px] ml-1.5 opacity-60 font-semibold align-super">
                    {place._count.id}
                  </span>
                </span>
              );
            }) : (
              <span className="text-stone-400 font-medium italic">
                {isEn ? 'No favorite places registered yet.' : 'Aún no hay lugares registrados.'}
              </span>
            )}
          </div>
        </div>

        {/* Generador de Insights para Redes (Client Component) */}
        <InsightClient initialInsight={initialInsight} />

      </div>
    </div>
  );
}
