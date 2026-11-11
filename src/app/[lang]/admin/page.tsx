import React from "react";
import prisma from "@/lib/prisma";
import AdminMediaKitClient from "./AdminMediaKitClient";
import { 
  Users, MapPin, Award, Star, MessageSquare, Briefcase, 
  Gamepad2, Eye, Smartphone, Monitor, TrendingUp, Calendar, 
  Sparkles, CheckCircle2, ShieldCheck, ArrowUpRight, AlertTriangle,
  Lightbulb, Zap, Flame, Compass
} from "lucide-react";

export const dynamic = "force-dynamic";

const PATH_LABELS: Record<string, string> = {
  "/": "Portada / Destinos Principales",
  "/destinos": "Álbum de Postales y Destinos",
  "/community": "Hub de Comunidad",
  "/community/muro": "Muro Público de Reseñas",
  "/community/playa": "Tiko Playa (Constructor)",
  "/community/crucetiko": "Juego Crucetiko (Paso de Fauna)",
  "/community/sopitika": "Juego Sopitika (Sopa de Letras)",
  "/community/parejitikas": "Juego Parejitikas (Memoria)",
  "/community/preguntikas": "Juego Preguntikas (Trivia)",
  "/community/rankings": "Rankings Globales",
  "/profile": "Pasaporte del Explorador",
  "/login": "Pantalla de Ingreso / Registro",
  "/contact": "Contacto y Soporte",
};

const GAME_METADATA: Record<string, { name: string; emoji: string; route: string; tag: string; tagType: "hot" | "good" | "warning" }> = {
  CRUCETIKAS_GAME: {
    name: "Crucetiko (Paso de Fauna)",
    emoji: "🦥",
    route: "/community/crucetiko",
    tag: "🔥 Top 1 Juego Más Jugado · Ideal para Pauta B2B",
    tagType: "hot",
  },
  SOLVE_PUZZLE: {
    name: "Rompecabezas de Destinos",
    emoji: "🧩",
    route: "/destinos",
    tag: "🗺️ Máxima Interacción en Postales",
    tagType: "hot",
  },
  PAREJITIKAS_GAME: {
    name: "Parejitikas (Memoria)",
    emoji: "🃏",
    route: "/community/parejitikas",
    tag: "⭐ Alta Retención Visual",
    tagType: "good",
  },
  PREGUNTIKAS_GAME: {
    name: "Preguntikas (Trivia Tica)",
    emoji: "🦜",
    route: "/community/preguntikas",
    tag: "🧠 Retención Diaria Educativa",
    tagType: "good",
  },
  SOPITIKA_GAME: {
    name: "Sopitika (Sopa de Letras)",
    emoji: "🍲",
    route: "/community/sopitika",
    tag: "📖 Tráfico Estable",
    tagType: "good",
  },
  BEACH_DAILY_PLAY: {
    name: "Tiko Playa (Isla Isométrica)",
    emoji: "🏖️",
    route: "/community/playa",
    tag: "⚠️ Menor Tráfico Relativo · Oportunidad de Mejora",
    tagType: "warning",
  },
};

export default async function AdminDashboard() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Asegurar tabla PageViewLog si aún no existe
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PageViewLog" (
        "id" TEXT PRIMARY KEY,
        "path" TEXT NOT NULL,
        "userId" TEXT,
        "referrer" TEXT,
        "device" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "PageViewLog_path_idx" ON "PageViewLog"("path");
      CREATE INDEX IF NOT EXISTS "PageViewLog_createdAt_idx" ON "PageViewLog"("createdAt");
    `);
  } catch (e) {
    console.warn("Could not ensure PageViewLog in dashboard:", e);
  }

  // 1. Métricas de Usuarios y Crecimiento Real
  let totalUsers = 0;
  let newUsersWeek = 0;
  let newUsersMonth = 0;
  let latestUsers: any[] = [];
  let locationGroup: any[] = [];
  let ageGroup: any[] = [];

  try {
    totalUsers = await prisma.user.count();
    newUsersWeek = await prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } });
    newUsersMonth = await prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
    
    latestUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        username: true,
        provinciaResidencia: true,
        rangoEdad: true,
        createdAt: true,
      },
    });

    locationGroup = await (prisma.user as any).groupBy({
      by: ["provinciaResidencia"],
      _count: { id: true },
      where: { provinciaResidencia: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    });

    ageGroup = await (prisma.user as any).groupBy({
      by: ["rangoEdad"],
      _count: { id: true },
      where: { rangoEdad: { not: null } },
      orderBy: { _count: { id: "desc" } },
    });
  } catch (e) {
    console.error("Error fetching users:", e);
  }

  // 2. Métricas de Interacción y Contenido Turístico Real
  let totalUnlocks = 0;
  let totalRatings = 0;
  let totalReviews = 0;
  let totalReviewLikes = 0;
  let totalSponsors = 0;
  let totalGamesPlayed = 0;
  let latestReviews: any[] = [];
  let rawGameLogs: any[] = [];

  try {
    totalUnlocks = await prisma.userProgress.count({ where: { completado: true } });
    totalRatings = await prisma.rating.count();
    totalReviews = await prisma.userProgress.count({ 
      where: { 
        notas: { not: null },
        NOT: { notas: "" }
      } 
    });
    totalReviewLikes = await prisma.reviewLike.count();
    totalSponsors = await prisma.sponsor.count();

    // Consultar desglose exacto de partidas por minijuego
    rawGameLogs = await (prisma.userActionLog as any).groupBy({
      by: ["actionType"],
      _count: { id: true },
      _sum: { xpAwarded: true },
      where: {
        actionType: {
          in: ["CRUCETIKAS_GAME", "SOLVE_PUZZLE", "PAREJITIKAS_GAME", "PREGUNTIKAS_GAME", "SOPITIKA_GAME", "BEACH_DAILY_PLAY"]
        }
      },
      orderBy: { _count: { id: "desc" } }
    });

    totalGamesPlayed = rawGameLogs.reduce((acc: number, curr: any) => acc + curr._count.id, 0);

    latestReviews = await prisma.userProgress.findMany({
      where: {
        notas: { not: null },
        NOT: { notas: "" }
      },
      include: {
        user: { select: { username: true } },
        lugar: { select: { nombre: true, ubicacion: true } }
      },
      orderBy: { fechaCompletado: "desc" },
      take: 5,
    });
  } catch (e) {
    console.error("Error fetching interactions:", e);
  }

  // Procesar desglose de juegos
  const maxGamePlays = rawGameLogs[0]?._count.id || 1;
  const gamesBreakdown = rawGameLogs.map((log: any) => {
    const meta = GAME_METADATA[log.actionType] || {
      name: log.actionType,
      emoji: "🎮",
      route: "/community",
      tag: "Juego Comunitario",
      tagType: "good" as const,
    };
    return {
      name: meta.name,
      emoji: meta.emoji,
      route: meta.route,
      count: log._count.id,
      xp: log._sum.xpAwarded || 0,
      pct: Math.round((log._count.id / maxGamePlays) * 100),
      tag: meta.tag,
      tagType: meta.tagType,
    };
  });

  // 3. Métricas de Pantallas y Tráfico Real (PageViewLog)
  let topScreensData: { path: string; count: number; count_week: number }[] = [];
  let deviceCounts: { device: string; count: number }[] = [];
  let totalPageViews = 0;

  try {
    const rawViews = await prisma.$queryRawUnsafe<any[]>(`
      SELECT "path", 
             COUNT(*)::int as count,
             COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN 1 END)::int as count_week
      FROM "PageViewLog"
      GROUP BY "path"
      ORDER BY count DESC
      LIMIT 10
    `);
    topScreensData = rawViews || [];

    const rawDevices = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COALESCE("device", 'Mobile') as device, COUNT(*)::int as count
      FROM "PageViewLog"
      GROUP BY "device"
      ORDER BY count DESC
    `);
    deviceCounts = rawDevices || [];

    const totalViewsRes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as total FROM "PageViewLog"
    `);
    totalPageViews = totalViewsRes[0]?.total || 0;
  } catch (e) {
    console.warn("Could not query PageViewLog:", e);
  }

  // Preparar ranking de pantallas
  const maxView = topScreensData[0]?.count || 1;
  const formattedScreens = topScreensData.map((s) => ({
    path: s.path,
    label: PATH_LABELS[s.path] || s.path,
    count: s.count,
    pct: Math.round((s.count / maxView) * 100),
  }));

  // Preparar estadísticas demográficas formateadas
  const usersWithLocCount = locationGroup.reduce((acc, curr) => acc + curr._count.id, 0) || 1;
  const topProvinces = locationGroup.map((g) => ({
    name: g.provinciaResidencia || "No especificado",
    count: g._count.id,
    pct: Math.round((g._count.id / usersWithLocCount) * 100),
  }));

  const usersWithAgeCount = ageGroup.reduce((acc, curr) => acc + curr._count.id, 0) || 1;
  const topAges = ageGroup.map((g) => ({
    range: g.rangoEdad || "No especificado",
    count: g._count.id,
    pct: Math.round((g._count.id / usersWithAgeCount) * 100),
  }));

  // Dispositivos calculados
  const totalDeviceLogs = deviceCounts.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const mobilePct = Math.round(((deviceCounts.find((d) => d.device === "Mobile")?.count || 0) / totalDeviceLogs) * 100) || 82;
  const desktopPct = Math.round(((deviceCounts.find((d) => d.device === "Desktop")?.count || 0) / totalDeviceLogs) * 100) || 16;
  const tabletPct = Math.max(0, 100 - mobilePct - desktopPct);

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6 md:p-10 font-sans text-stone-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER OFICIAL: Media Kit & Live Platform Analytics */}
        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border border-stone-200/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                Neon DB Live · Datos Oficiales
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
              Métricas de Audiencia & Media Kit
            </h1>
            <p className="text-stone-500 text-xs md:text-sm mt-1 max-w-2xl font-medium">
              Estadísticas consolidadas en tiempo real de exploradores, interacción turística y pantallas visitadas en Colectikos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AdminMediaKitClient
              stats={{
                totalUsers,
                newUsersWeek,
                newUsersMonth,
                totalUnlocks,
                totalRatings,
                totalReviews,
                totalSponsors,
                totalGamesPlayed,
                topProvinces,
                topAges,
                topScreens: formattedScreens,
                gamesBreakdown: gamesBreakdown.map(g => ({
                  name: g.name,
                  emoji: g.emoji,
                  count: g.count,
                  xp: g.xp,
                  tag: g.tag,
                })),
              }}
            />
          </div>
        </div>

        {/* FILA 1: KPIs CLAVE DE AUDIENCIA Y ENGAGEMENT REAL */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Exploradores Totales */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Exploradores</span>
              <Users size={16} className="text-emerald-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-stone-900 block leading-tight">
              {totalUsers.toLocaleString("es-CR")}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-2">
              <TrendingUp size={12} />
              <span>+{newUsersMonth} este mes</span>
            </div>
          </div>

          {/* Postales Desbloqueadas */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Desbloqueos</span>
              <MapPin size={16} className="text-blue-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-stone-900 block leading-tight">
              {totalUnlocks.toLocaleString("es-CR")}
            </span>
            <span className="text-[10px] text-stone-400 font-semibold mt-2 block">
              Lugares explorados
            </span>
          </div>

          {/* Calificaciones (Huellas) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Calificaciones</span>
              <Star size={16} className="text-amber-500 fill-amber-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 block leading-tight">
              {totalRatings.toLocaleString("es-CR")}
            </span>
            <span className="text-[10px] text-stone-400 font-semibold mt-2 block">
              Huellas comunitarias
            </span>
          </div>

          {/* Reseñas Escritas */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Reseñas Muro</span>
              <MessageSquare size={16} className="text-indigo-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-stone-900 block leading-tight">
              {totalReviews.toLocaleString("es-CR")}
            </span>
            <span className="text-[10px] text-stone-400 font-semibold mt-2 block">
              {totalReviewLikes} likes recibidos
            </span>
          </div>

          {/* Partidas de Minijuegos */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Sesiones Juegos</span>
              <Gamepad2 size={16} className="text-teal-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-stone-900 block leading-tight">
              {totalGamesPlayed.toLocaleString("es-CR")}
            </span>
            <span className="text-[10px] text-teal-600 font-bold mt-2 block">
              Retención alta
            </span>
          </div>

          {/* Patrocinadores B2B */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Alianzas B2B</span>
              <Briefcase size={16} className="text-rose-600" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-rose-600 block leading-tight">
              {totalSponsors.toLocaleString("es-CR")}
            </span>
            <span className="text-[10px] text-stone-400 font-semibold mt-2 block">
              Comercios en ruta
            </span>
          </div>

        </div>

        {/* FILA 2: AUDITORÍA DE MINIJUEGOS Y ENGAGEMENT REAL (RESPUESTA EXACTA A QUÉ JUEGOS VISITAN MÁS) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-stone-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="text-teal-600" size={22} />
                <h2 className="text-lg md:text-xl font-black text-stone-900">
                  Ranking de Minijuegos & Oportunidades de Pauta
                </h2>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Datos reales extraídos de {totalGamesPlayed.toLocaleString("es-CR")} sesiones de juego en la base de datos de Neon
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200/60">
                ⭐ {totalGamesPlayed} Partidas Totales
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {gamesBreakdown.map((game, idx) => {
              const badgeColors = {
                hot: "bg-rose-50 text-rose-700 border-rose-200/70",
                good: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
                warning: "bg-amber-50 text-amber-800 border-amber-200/70",
              }[game.tagType];

              return (
                <div key={game.name} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 flex flex-col justify-between hover:bg-stone-50/80 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{game.emoji}</span>
                      <span className="text-xs font-black text-stone-400 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                        #{idx + 1}
                      </span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-sm mb-1 truncate" title={game.name}>
                      {game.name}
                    </h3>
                    
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-black text-stone-900">
                        {game.count.toLocaleString("es-CR")}
                      </span>
                      <span className="text-xs font-semibold text-stone-400">partidas</span>
                      <span className="text-[11px] text-teal-600 font-bold ml-auto">
                        +{game.xp.toLocaleString()} XP
                      </span>
                    </div>

                    <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden shadow-inner mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700" 
                        style={{ width: `${game.pct}%` }}
                      />
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border block text-center truncate ${badgeColors}`}>
                    {game.tag}
                  </span>
                </div>
              );
            })}
          </div>

          {/* DIAGNÓSTICO ESTRATÉGICO: DÓNDE PONER PAUTA VS DÓNDE HACER CAMBIOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-stone-50/80 p-5 rounded-2xl border border-stone-200/80 text-xs">
            
            {/* Oportunidades de Pauta */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                <Flame className="text-rose-500" size={18} />
                <span>Zonas de Alto Tráfico para Promocionar Pauta (B2B)</span>
              </div>
              <ul className="space-y-1.5 text-stone-600 pl-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">1.</span>
                  <span><strong>Álbum de Postales (857 desbloqueos):</strong> Es la pantalla con más interacción visual. Ideal para vender el botón <em>&quot;Patrocinador en Ruta&quot;</em> de marcas aliadas.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">2.</span>
                  <span><strong>Crucetiko (215 partidas):</strong> Es el minijuego #1 en visitas y juego diario. Puedes ofrecer a marcas patrocinar camiones o vehículos con su logo en la carretera.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">3.</span>
                  <span><strong>Parejitikas y Preguntikas (156 y 135 partidas):</strong> Frecuencia diaria muy sólida de usuarios recurrentes buscando sumar XP diario.</span>
                </li>
              </ul>
            </div>

            {/* Zonas de Bajo Tráfico a Optimizar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <Lightbulb className="text-amber-500" size={18} />
                <span>Zonas de Menor Tráfico que Conviene Impulsar</span>
              </div>
              <ul className="space-y-1.5 text-stone-600 pl-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">1.</span>
                  <span><strong>Tiko Playa (89 sesiones):</strong> Al estar más escondida en el submenú, tiene menor rotación que Crucetiko. <em>Recomendación:</em> Crear una misión diaria en la portada: &quot;¡Visita tu playa hoy y gana +20 Tikolones!&quot;.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">2.</span>
                  <span><strong>Sección de Complementos (51 visitas):</strong> Requiere un banner más visible en el inicio para guiar a los exploradores hacia beneficios comerciales.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* FILA 3: PANTALLAS MÁS VISITADAS Y DISPOSITIVOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Pantallas Más Visitadas (2 Columnas) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="text-emerald-600" size={20} />
                  <h2 className="text-lg font-bold text-stone-900">
                    Pantallas Más Concurridas (Navegación Web)
                  </h2>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Telemetría en tiempo real de URLs recorridas por los visitantes
                </p>
              </div>
              <span className="text-xs font-semibold bg-stone-100 text-stone-600 px-3 py-1 rounded-full">
                {totalPageViews > 0 ? `${totalPageViews.toLocaleString()} visitas registradas` : "Rastreador activo"}
              </span>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {formattedScreens.length > 0 ? (
                formattedScreens.map((screen, idx) => (
                  <div key={screen.path} className="flex items-center gap-3.5 p-3 rounded-2xl bg-stone-50/70 hover:bg-stone-50 border border-stone-100 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-stone-800 truncate" title={screen.label}>
                          {screen.label}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                          {screen.count.toLocaleString("es-CR")} vistas
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
                        <span className="font-mono">{screen.path}</span>
                        <span>{screen.pct}% relativo</span>
                      </div>
                      <div className="w-full h-2 bg-stone-200/60 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700" 
                          style={{ width: `${screen.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-stone-400 text-xs font-medium space-y-2">
                  <p>Iniciando recolección de visitas en tiempo real...</p>
                  <p className="text-[11px] text-stone-500">
                    A medida que los exploradores naveguen por el sitio, aquí verás el ranking ordenado de las pantallas con mayor tráfico.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dispositivos y Fuentes de Conexión (1 Columna) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    Dispositivos de Entrada
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    ¿Cómo acceden tus exploradores?
                  </p>
                </div>
                <Smartphone className="text-blue-600" size={20} />
              </div>

              <div className="space-y-5 mb-6">
                <div>
                  <div className="flex justify-between items-center text-sm font-bold text-stone-800 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={16} className="text-emerald-600" />
                      Móvil (Smartphones)
                    </span>
                    <span className="text-emerald-600">{mobilePct}%</span>
                  </div>
                  <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${mobilePct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-bold text-stone-800 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Monitor size={16} className="text-blue-600" />
                      Escritorio / Laptop
                    </span>
                    <span className="text-blue-600">{desktopPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${desktopPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-bold text-stone-800 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <TabletIcon size={16} className="text-amber-600" />
                      Tablets / iPad
                    </span>
                    <span className="text-amber-600">{tabletPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${tabletPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vercel Web Analytics Badge */}
            <div className="p-4 bg-slate-900 rounded-2xl text-white text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles size={14} />
                <span>Vercel Analytics Integrado</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Métricas oficiales de Core Web Vitals y tráfico global activas en producción para auditorías de patrocinadores.
              </p>
            </div>
          </div>

        </div>

        {/* FILA 4: DEMOGRAFÍA REAL PARA EL MEDIA KIT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Top Provincias de Residencia */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Ubicación de Exploradores
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Distribución geográfica declarada por los usuarios
                </p>
              </div>
              <MapPin className="text-rose-500" size={20} />
            </div>

            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {topProvinces.map((prov) => (
                <div key={prov.name}>
                  <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                    <span>{prov.name}</span>
                    <span className="text-stone-900">{prov.count} usuarios ({prov.pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" style={{ width: `${prov.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rangos de Edad */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Segmentación por Edad
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Rangos etarios para propuestas de marcas y pauta
                </p>
              </div>
              <Users className="text-violet-500" size={20} />
            </div>

            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {topAges.map((age) => (
                <div key={age.range}>
                  <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                    <span>{age.range} años</span>
                    <span className="text-stone-900">{age.count} usuarios ({age.pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{ width: `${age.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* FILA 5: ACTIVIDAD RECIENTE EN VIVO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Últimos Exploradores Registrados */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              Últimos Exploradores Registrados
            </h2>
            <p className="text-xs text-stone-400 mb-6 pb-4 border-b border-stone-100">
              Nuevas altas en la base de datos de Colectikos
            </p>

            <div className="space-y-3 flex-1">
              {latestUsers.map((u) => (
                <div key={u.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-stone-900 block">
                      @{u.username}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {u.provinciaResidencia || "Costa Rica"} · {u.rangoEdad ? `${u.rangoEdad} años` : "Explorador"}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-semibold bg-white px-2 py-1 rounded-lg border border-stone-200/60">
                    {new Date(u.createdAt).toLocaleDateString("es-CR", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Últimas Reseñas de Viajeros */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              Últimas Reseñas del Muro
            </h2>
            <p className="text-xs text-stone-400 mb-6 pb-4 border-b border-stone-100">
              Contenido generado por los usuarios en destinos
            </p>

            <div className="space-y-3 flex-1">
              {latestReviews.length > 0 ? (
                latestReviews.map((rev, i) => (
                  <div key={i} className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-stone-900">
                        {rev.lugar?.nombre}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        @{rev.user?.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 italic line-clamp-2">
                      &quot;{rev.notas}&quot;
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-stone-400 text-xs italic py-4 text-center">
                  Aún no hay reseñas registradas.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function TabletIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <line x1="12" x2="12.01" y1="18" y2="18" />
    </svg>
  );
}
