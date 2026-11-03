"use client";

import React, { useState, useEffect } from 'react';
import { getGlobalXPRanking, getPostalesRanking, getStreakRanking, UserRankingEntry } from '../actions/rankings';
import { Medal, Flame, Search, ChevronDown, Award, Calendar, Trophy, MapPin, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const PROVINCIAS = ['Todas', 'San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

const CATEGORIAS: Record<string, string> = {
  'Todas': 'Todas',
  'VOLCAN': 'Volcanes',
  'PARQUE_NACIONAL': 'Parques Nacionales',
  'PLAYA': 'Playas',
  'RIOS_Y_CATARATAS': 'Ríos y Cataratas',
  'LAGUNAS': 'Lagunas',
  'BOSQUES_RESERVAS': 'Bosques y Reservas',
  'CIUDAD_Y_CULTURA': 'Ciudad y Cultura'
};

const CATEGORIAS_EN: Record<string, string> = {
  'Todas': 'All Categories',
  'VOLCAN': 'Volcanoes',
  'PARQUE_NACIONAL': 'National Parks',
  'PLAYA': 'Beaches',
  'RIOS_Y_CATARATAS': 'Rivers & Waterfalls',
  'LAGUNAS': 'Lagoons',
  'BOSQUES_RESERVAS': 'Forests & Reserves',
  'CIUDAD_Y_CULTURA': 'City & Culture'
};

export default function RankingsView({ isEn }: { isEn: boolean }) {
  const { user: clerkUser } = useUser();
  const currentUserId = clerkUser?.id;

  const [activeTab, setActiveTab] = useState<'xp' | 'postales' | 'racha'>('xp');
  const [timeframe, setTimeframe] = useState<'month' | 'all'>('month');
  const [provincia, setProvincia] = useState('Todas');
  const [categoria, setCategoria] = useState('Todas');

  const [top10, setTop10] = useState<UserRankingEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<UserRankingEntry | null>(null);
  const [monthLabel, setMonthLabel] = useState<{ es: string; en: string }>(() => {
    const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return {
      es: `${monthsEs[now.getMonth()]} ${now.getFullYear()}`,
      en: `${monthsEn[now.getMonth()]} ${now.getFullYear()}`
    };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (activeTab === 'xp') {
          const res = await getGlobalXPRanking(
            currentUserId, 
            timeframe, 
            provincia === 'Todas' ? undefined : provincia
          );
          setTop10(res.top10);
          setCurrentUserRank(res.currentUserRank);
          if (res.periodName) {
            setMonthLabel(res.periodName);
          }
        } else if (activeTab === 'racha') {
          const res = await getStreakRanking(
            currentUserId,
            provincia === 'Todas' ? undefined : provincia
          );
          setTop10(res.top10);
          setCurrentUserRank(res.currentUserRank);
        } else {
          const res = await getPostalesRanking(
            currentUserId, 
            provincia === 'Todas' ? undefined : provincia, 
            categoria === 'Todas' ? undefined : categoria
          );
          setTop10(res.top10);
          setCurrentUserRank(res.currentUserRank);
        }
      } catch (error) {
        console.error("Error fetching ranking:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab, timeframe, provincia, categoria, currentUserId]);

  const renderAvatar = (url: string | null, sizeClass: string, isFounder?: boolean) => {
    return (
      <div className="relative inline-block">
        {url ? (
          <img src={url} alt="Avatar" className={`${sizeClass} rounded-full object-cover shadow-inner ${isFounder ? 'ring-2 ring-amber-400' : ''}`} />
        ) : (
          <div className={`${sizeClass} rounded-full bg-stone-200 flex items-center justify-center shadow-inner ${isFounder ? 'ring-2 ring-amber-400' : ''}`}>
            <span className="text-stone-400 font-bold">?</span>
          </div>
        )}
        {isFounder && (
          <div 
            className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-white text-[10px]"
            title={isEn ? "Pioneer / Founder Member" : "Miembro Pionero / Fundador"}
          >
            ★
          </div>
        )}
      </div>
    );
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'border-yellow-400 bg-yellow-50 text-yellow-700';
    if (rank === 2) return 'border-slate-300 bg-slate-50 text-slate-700';
    if (rank === 3) return 'border-amber-600 bg-amber-50 text-amber-800';
    return 'border-stone-200 bg-white text-stone-600';
  };

  // Puntos necesarios para superar al puesto anterior si estamos en el top 10
  const pointsToAhead = currentUserRank && currentUserRank.rank && currentUserRank.rank > 1 && currentUserRank.rank <= 10 && top10[currentUserRank.rank - 2]
    ? Math.max(1, top10[currentUserRank.rank - 2].score - currentUserRank.score + 1)
    : null;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-100px)] px-3 sm:px-4">
      
      {/* Header & Tabs */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 md:p-6 mb-4 z-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 flex items-center gap-2.5">
              <Medal className="text-amber-500 shrink-0" size={32} />
              <span>{isEn ? "Explorer Rankings" : "Rankings de Exploradores"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
              {isEn 
                ? "Compete fairly with monthly seasons and local province boards." 
                : "Compite con temporadas mensuales y clasificaciones por provincia."}
            </p>
          </div>

          {/* Insignia Explicativa de Fundadores */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shrink-0 self-start sm:self-auto">
            <span>⭐</span>
            <span>{isEn ? "Pioneers have Founder Badges" : "Fundadores con insignia dorada"}</span>
          </div>
        </div>

        {/* Pestañas Principales (XP, Postales, Racha) */}
        <div className="flex border-b border-stone-200">
          <button 
            type="button"
            onClick={() => setActiveTab('xp')}
            className={`flex-1 py-3.5 font-bold text-sm md:text-base text-center transition-colors relative cursor-pointer ${activeTab === 'xp' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {isEn ? "By XP" : "Por XP"}
            {activeTab === 'xp' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full"></div>}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('postales')}
            className={`flex-1 py-3.5 font-bold text-sm md:text-base text-center transition-colors relative cursor-pointer ${activeTab === 'postales' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {isEn ? "By Postcards" : "Por Postales"}
            {activeTab === 'postales' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full"></div>}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('racha')}
            className={`flex-1 py-3.5 font-bold text-sm md:text-base text-center transition-colors relative cursor-pointer ${activeTab === 'racha' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {isEn ? "By Streak" : "Por Racha"}
            {activeTab === 'racha' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* CONTROLES / FILTROS DE XP */}
        {activeTab === 'xp' && (
          <div className="pt-4 pb-2 space-y-3">
            {/* Toggle Temporal: Este Mes (Temporada) vs Histórico Global */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setTimeframe('month')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    timeframe === 'month'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Calendar size={14} />
                  <span>{isEn ? monthLabel.en : monthLabel.es}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('all')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    timeframe === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Trophy size={14} />
                  <span>{isEn ? "All-Time" : "Histórico Global"}</span>
                </button>
              </div>

              {/* Selector de Provincia de Residencia */}
              <div className="flex-1 sm:max-w-xs">
                <div className="relative">
                  <select 
                    value={provincia} 
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-2 px-3.5 pr-8 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    {PROVINCIAS.map(p => (
                      <option key={p} value={p}>
                        {p === 'Todas' ? (isEn ? '🇨🇷 All Costa Rica' : '🇨🇷 Todo Costa Rica') : `📍 ${p}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* Aviso informativo de temporada */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
              <span>
                {timeframe === 'month'
                  ? (isEn ? `⚡ Showing points earned in ${monthLabel.en}. Resets on the 1st of each month.` : `⚡ Mostrando puntos sumados en ${monthLabel.es}. Se reinicia el día 1 de cada mes.`)
                  : (isEn ? "🏆 Hall of Fame: Total cumulative XP since inception." : "🏆 Salón de la Fama: Total histórico acumulado de todos los tiempos.")}
              </span>
            </div>
          </div>
        )}

        {/* CONTROLES / FILTROS DE RACHA */}
        {activeTab === 'racha' && (
          <div className="pt-4 pb-2 flex items-center justify-between gap-3">
            <span className="text-xs text-stone-500 font-medium">
              {isEn ? "Filter by user's province of residence:" : "Filtrar por provincia de residencia:"}
            </span>
            <div className="relative min-w-[200px]">
              <select 
                value={provincia} 
                onChange={(e) => setProvincia(e.target.value)}
                className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-2 px-3.5 pr-8 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                {PROVINCIAS.map(p => (
                  <option key={p} value={p}>
                    {p === 'Todas' ? (isEn ? '🇨🇷 All Costa Rica' : '🇨🇷 Todo Costa Rica') : `📍 ${p}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
            </div>
          </div>
        )}

        {/* CONTROLES / FILTROS DE POSTALES */}
        {activeTab === 'postales' && (
          <div className="flex flex-col md:flex-row gap-3 py-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 block">
                {isEn ? "Postcard Location" : "Ubicación de Postal"}
              </label>
              <div className="relative">
                <select 
                  value={provincia} 
                  onChange={(e) => setProvincia(e.target.value)}
                  className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-2 px-3.5 pr-8 rounded-xl font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  {PROVINCIAS.map(p => (
                    <option key={p} value={p}>
                      {p === 'Todas' ? (isEn ? 'All Provinces' : 'Todas las Provincias') : p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
              </div>
            </div>
            
            <div className="flex-1">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1 block">
                {isEn ? "Category" : "Categoría"}
              </label>
              <div className="relative">
                <select 
                  value={categoria} 
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-2 px-3.5 pr-8 rounded-xl font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  {Object.entries(CATEGORIAS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {isEn ? CATEGORIAS_EN[key] || val : val}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-stone-100 relative pb-36 md:pb-48">
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-44 bg-stone-100 rounded-3xl mb-8"></div>
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-stone-100 rounded-xl"></div>)}
          </div>
        ) : top10.length === 0 ? (
          <div className="text-center py-20">
            <Award size={64} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-700 mb-2">
              {isEn ? "No explorers yet in this board" : "Aún no hay exploradores en esta clasificación"}
            </h3>
            <p className="text-stone-500 max-w-sm mx-auto text-sm">
              {isEn 
                ? "Be the first to score points or unlock postcards in this category!" 
                : "¡Sé el primero en sumar puntos o postales en este filtro!"}
            </p>
          </div>
        ) : (
          <>
            {/* Podium for Top 3 */}
            <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 mt-6">
              {/* 2nd Place */}
              {top10[1] && (
                <div className="flex flex-col items-center order-1 w-1/3 max-w-[130px]">
                  <div className="relative mb-2">
                    {renderAvatar(top10[1].avatarUrl, "w-16 h-16 md:w-20 md:h-20 border-4 border-slate-300 shadow-md", top10[1].isFounder)}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">2</div>
                  </div>
                  <div className="text-center w-full">
                    <p className="font-bold text-stone-800 truncate w-full text-sm">{top10[1].username}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className="text-[11px] text-stone-500 font-medium">Lvl {top10[1].level}</span>
                      {top10[1].isFounder && (
                        <span className="text-[10px] text-amber-700 font-bold" title={isEn ? "Founder" : "Fundador"}>⭐</span>
                      )}
                    </div>
                    {top10[1].provincia && (
                      <p className="text-[10px] text-stone-400 font-semibold truncate mt-0.5">📍 {top10[1].provincia}</p>
                    )}
                    <p className="text-emerald-700 font-black text-sm mt-1 flex justify-center items-center gap-1">
                      {top10[1].score} {activeTab === 'xp' ? 'XP' : activeTab === 'racha' ? <Flame size={14} /> : ''}
                    </p>
                  </div>
                  <div className="h-16 md:h-24 w-full bg-gradient-to-t from-slate-200 to-slate-100 mt-3 rounded-t-2xl border-t-4 border-slate-300 shadow-inner"></div>
                </div>
              )}

              {/* 1st Place */}
              {top10[0] && (
                <div className="flex flex-col items-center order-2 w-1/3 max-w-[150px] z-10">
                  <div className="relative mb-2">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500">
                      <Medal size={32} fill="currentColor" />
                    </div>
                    {renderAvatar(top10[0].avatarUrl, "w-20 h-20 md:w-24 md:h-24 border-4 border-yellow-400 shadow-xl", top10[0].isFounder)}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">1</div>
                    {top10[0].currentStreak > 0 && (
                      <div className="absolute -right-2 top-0 bg-white rounded-full p-1 shadow flex items-center text-xs font-black text-orange-500">
                        🔥 {top10[0].currentStreak}
                      </div>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <p className="font-black text-stone-900 truncate w-full text-base">{top10[0].username}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className="text-xs text-stone-500 font-bold">Lvl {top10[0].level}</span>
                      {top10[0].isFounder && (
                        <span className="text-[10px] text-amber-700 font-bold" title={isEn ? "Founder" : "Fundador"}>⭐</span>
                      )}
                    </div>
                    {top10[0].provincia && (
                      <p className="text-[11px] text-stone-500 font-bold truncate mt-0.5">📍 {top10[0].provincia}</p>
                    )}
                    <p className="text-yellow-600 font-black text-lg mt-1 flex justify-center items-center gap-1">
                      {top10[0].score} {activeTab === 'xp' ? 'XP' : activeTab === 'racha' ? <Flame size={16} /> : ''}
                    </p>
                  </div>
                  <div className="h-24 md:h-32 w-full bg-gradient-to-t from-yellow-200 to-yellow-100 mt-3 rounded-t-2xl border-t-4 border-yellow-400 shadow-inner"></div>
                </div>
              )}

              {/* 3rd Place */}
              {top10[2] && (
                <div className="flex flex-col items-center order-3 w-1/3 max-w-[130px]">
                  <div className="relative mb-2">
                    {renderAvatar(top10[2].avatarUrl, "w-16 h-16 md:w-20 md:h-20 border-4 border-amber-600 shadow-md", top10[2].isFounder)}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">3</div>
                  </div>
                  <div className="text-center w-full">
                    <p className="font-bold text-stone-800 truncate w-full text-sm">{top10[2].username}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className="text-[11px] text-stone-500 font-medium">Lvl {top10[2].level}</span>
                      {top10[2].isFounder && (
                        <span className="text-[10px] text-amber-700 font-bold" title={isEn ? "Founder" : "Fundador"}>⭐</span>
                      )}
                    </div>
                    {top10[2].provincia && (
                      <p className="text-[10px] text-stone-400 font-semibold truncate mt-0.5">📍 {top10[2].provincia}</p>
                    )}
                    <p className="text-emerald-700 font-black text-sm mt-1 flex justify-center items-center gap-1">
                      {top10[2].score} {activeTab === 'xp' ? 'XP' : activeTab === 'racha' ? <Flame size={14} /> : ''}
                    </p>
                  </div>
                  <div className="h-12 md:h-16 w-full bg-gradient-to-t from-amber-200/50 to-amber-100/50 mt-3 rounded-t-2xl border-t-4 border-amber-600 shadow-inner"></div>
                </div>
              )}
            </div>

            {/* List for 4th to 10th */}
            <div className="flex flex-col gap-2.5">
              {top10.slice(3).map((user) => (
                <div 
                  key={user.id} 
                  className={`flex items-center p-3 rounded-2xl border transition-all ${
                    user.id === currentUserId 
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500 shadow-sm' 
                      : 'bg-white border-stone-200/70 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  <div className="w-8 text-center font-black text-stone-400 mr-2 text-sm">
                    #{user.rank}
                  </div>
                  <div className="relative mr-3.5">
                    {renderAvatar(user.avatarUrl, "w-10 h-10", user.isFounder)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-stone-800 truncate text-sm">{user.username}</p>
                      {user.isFounder && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                          ⭐ {isEn ? "Founder" : "Fundador"}
                        </span>
                      )}
                      {user.provincia && (
                        <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                          📍 {user.provincia}
                        </span>
                      )}
                      {user.currentStreak > 0 && (
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          🔥 {user.currentStreak}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 font-medium mt-0.5">Lvl {user.level}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-black text-emerald-700 text-base md:text-lg flex items-center justify-end gap-1">
                      {user.score} {activeTab === 'xp' ? <span className="text-xs font-bold text-stone-400">XP</span> : activeTab === 'racha' ? <Flame size={16} /> : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Bar for Current User */}
      {currentUserRank && currentUserId && (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] p-3.5 z-40 animate-in slide-in-from-bottom-10 duration-500">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-1 md:px-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full border-2 font-black text-base shrink-0 ${getRankColor(currentUserRank.rank!)}`}>
                {currentUserRank.rank! > 0 ? `#${currentUserRank.rank}` : '-'}
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-stone-900 truncate text-sm md:text-base">
                    {currentUserRank.username || (isEn ? "You" : "Tú")}
                  </p>
                  {currentUserRank.isFounder && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                      ⭐ {isEn ? "Founder" : "Fundador"}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full hidden sm:inline">
                    Lvl {currentUserRank.level}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium truncate">
                  {currentUserRank.rank === 1 ? (
                    <span className="text-amber-600 font-bold">👑 {isEn ? "Leading this board!" : "¡Liderando este ranking!"}</span>
                  ) : pointsToAhead ? (
                    <span className="text-emerald-700 font-bold">
                      ⚡ {isEn ? `${pointsToAhead} pts to rank #${currentUserRank.rank! - 1}` : `A ${pointsToAhead} pts del puesto #${currentUserRank.rank! - 1}`}
                    </span>
                  ) : currentUserRank.rank === 0 ? (
                    <span className="text-stone-400">
                      {isEn ? "No points recorded under this filter yet" : "Sin puntos en este filtro aún"}
                    </span>
                  ) : (
                    <span>{isEn ? "Keep exploring to climb ranks!" : "¡Sigue sumando para subir puestos!"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="font-black text-emerald-700 text-lg md:text-xl flex items-center justify-end gap-1">
                {currentUserRank.score} {activeTab === 'xp' ? <span className="text-xs font-bold text-stone-400">XP</span> : activeTab === 'racha' ? <Flame size={18} /> : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
