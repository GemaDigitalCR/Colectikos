"use client";

import React, { useState, useEffect } from 'react';
import { getGlobalXPRanking, getPostalesRanking, getStreakRanking, UserRankingEntry } from '../actions/rankings';
import { Medal, Flame, Search, ChevronDown, Award } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const PROVINCIAS = ['Todas', 'San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

// Mapeo amigable para el usuario
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
  const [provincia, setProvincia] = useState('Todas');
  const [categoria, setCategoria] = useState('Todas');

  const [top10, setTop10] = useState<UserRankingEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<UserRankingEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        if (activeTab === 'xp') {
          const res = await getGlobalXPRanking(currentUserId);
          setTop10(res.top10);
          setCurrentUserRank(res.currentUserRank);
        } else if (activeTab === 'racha') {
          const res = await getStreakRanking(currentUserId);
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
  }, [activeTab, provincia, categoria, currentUserId]);

  const renderAvatar = (url: string | null, sizeClass: string) => {
    if (url) {
      return <img src={url} alt="Avatar" className={`${sizeClass} rounded-full object-cover shadow-inner`} />;
    }
    return (
      <div className={`${sizeClass} rounded-full bg-stone-200 flex items-center justify-center shadow-inner`}>
        <span className="text-stone-400 font-bold">?</span>
      </div>
    );
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'border-yellow-400 bg-yellow-50 text-yellow-700';
    if (rank === 2) return 'border-slate-300 bg-slate-50 text-slate-700';
    if (rank === 3) return 'border-amber-600 bg-amber-50 text-amber-800';
    return 'border-stone-200 bg-white text-stone-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-100px)]">
      
      {/* Header & Tabs */}
      <div className="bg-white rounded-t-3xl shadow-sm border border-stone-100 p-6 pb-0 mb-4 z-10 relative">
        <h1 className="text-3xl md:text-4xl font-extrabold text-stone-800 mb-6 flex items-center gap-3">
          <Medal className="text-amber-500" size={36} />
          {isEn ? "Global Rankings" : "Rankings Globales"}
        </h1>

        <div className="flex border-b border-stone-200">
          <button 
            onClick={() => setActiveTab('xp')}
            className={`flex-1 py-4 font-bold text-center transition-colors relative ${activeTab === 'xp' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {isEn ? "By XP" : "Por XP"}
            {activeTab === 'xp' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('postales')}
            className={`flex-1 py-4 font-bold text-center transition-colors relative ${activeTab === 'postales' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {isEn ? "By Postcards" : "Por Postales"}
            {activeTab === 'postales' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('racha')}
            className={`flex-1 py-4 font-bold text-center transition-colors relative ${activeTab === 'racha' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {isEn ? "By Streak" : "Por Racha"}
            {activeTab === 'racha' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* Filters for Postales */}
        {activeTab === 'postales' && (
          <div className="flex flex-col md:flex-row gap-4 py-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">
                {isEn ? "Province" : "Provincia"}
              </label>
              <div className="relative">
                <select 
                  value={provincia} 
                  onChange={(e) => setProvincia(e.target.value)}
                  className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-2.5 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {PROVINCIAS.map(p => (
                    <option key={p} value={p}>
                      {p === 'Todas' ? (isEn ? 'All Provinces' : 'Todas') : p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
              </div>
            </div>
            
            <div className="flex-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">
                {isEn ? "Category" : "Categoría"}
              </label>
              <div className="relative">
                <select 
                  value={categoria} 
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-2.5 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {Object.entries(CATEGORIAS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {isEn ? CATEGORIAS_EN[key] || val : val}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-stone-50/50 p-4 md:p-8 rounded-b-3xl relative pb-36 md:pb-48">
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-40 bg-stone-200 rounded-3xl mb-8"></div>
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-stone-200 rounded-xl"></div>)}
          </div>
        ) : top10.length === 0 ? (
          <div className="text-center py-20">
            <Award size={64} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-xl font-bold text-stone-600 mb-2">
              {isEn ? "No explorers yet" : "Aún no hay exploradores"}
            </h3>
            <p className="text-stone-500 max-w-sm mx-auto">
              {isEn 
                ? "Be the first to unlock postcards with these filters!" 
                : "¡Sé el primero en desbloquear postales con estos filtros!"}
            </p>
          </div>
        ) : (
          <>
            {/* Podium for Top 3 */}
            <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 mt-8">
              {/* 2nd Place */}
              {top10[1] && (
                <div className="flex flex-col items-center order-1 w-1/3 max-w-[120px]">
                  <div className="relative mb-2">
                    {renderAvatar(top10[1].avatarUrl, "w-16 h-16 md:w-20 md:h-20 border-4 border-slate-300")}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">2</div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-stone-800 truncate w-full text-sm">{top10[1].username}</p>
                    <p className="text-xs text-stone-500 font-medium">Lvl {top10[1].level}</p>
                    <p className="text-emerald-600 font-black text-sm mt-1 flex justify-center items-center gap-1">
                      {top10[1].score} {activeTab === 'xp' ? 'XP' : activeTab === 'racha' ? <Flame size={14} /> : ''}
                    </p>
                  </div>
                  <div className="h-16 md:h-24 w-full bg-gradient-to-t from-slate-200 to-slate-100 mt-3 rounded-t-xl border-t-4 border-slate-300 shadow-inner"></div>
                </div>
              )}

              {/* 1st Place */}
              {top10[0] && (
                <div className="flex flex-col items-center order-2 w-1/3 max-w-[140px] z-10">
                  <div className="relative mb-2">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500">
                      <Medal size={32} fill="currentColor" />
                    </div>
                    {renderAvatar(top10[0].avatarUrl, "w-20 h-20 md:w-24 md:h-24 border-4 border-yellow-400 shadow-xl")}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">1</div>
                    {top10[0].currentStreak > 0 && (
                      <div className="absolute -right-2 top-0 bg-white rounded-full p-1 shadow flex items-center text-xs font-black text-orange-500">
                        🔥 {top10[0].currentStreak}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-stone-900 truncate w-full text-base">{top10[0].username}</p>
                    <p className="text-xs text-stone-500 font-bold">Lvl {top10[0].level}</p>
                    <p className="text-yellow-600 font-black text-lg mt-1 flex justify-center items-center gap-1">
                      {top10[0].score} {activeTab === 'xp' ? 'XP' : activeTab === 'racha' ? <Flame size={16} /> : ''}
                    </p>
                  </div>
                  <div className="h-24 md:h-32 w-full bg-gradient-to-t from-yellow-200 to-yellow-100 mt-3 rounded-t-xl border-t-4 border-yellow-400 shadow-inner"></div>
                </div>
              )}

              {/* 3rd Place */}
              {top10[2] && (
                <div className="flex flex-col items-center order-3 w-1/3 max-w-[120px]">
                  <div className="relative mb-2">
                    {renderAvatar(top10[2].avatarUrl, "w-16 h-16 md:w-20 md:h-20 border-4 border-amber-600")}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">3</div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-stone-800 truncate w-full text-sm">{top10[2].username}</p>
                    <p className="text-xs text-stone-500 font-medium">Lvl {top10[2].level}</p>
                    <p className="text-emerald-600 font-black text-sm mt-1 flex justify-center items-center gap-1">
                      {top10[2].score} {activeTab === 'xp' ? 'XP' : activeTab === 'racha' ? <Flame size={14} /> : ''}
                    </p>
                  </div>
                  <div className="h-12 md:h-16 w-full bg-gradient-to-t from-amber-200/50 to-amber-100/50 mt-3 rounded-t-xl border-t-4 border-amber-600 shadow-inner"></div>
                </div>
              )}
            </div>

            {/* List for 4th to 10th */}
            <div className="flex flex-col gap-3">
              {top10.slice(3).map((user, idx) => (
                <div key={user.id} className={`flex items-center p-3 rounded-xl border bg-white shadow-sm hover:shadow transition-shadow ${user.id === currentUserId ? 'ring-2 ring-emerald-500' : 'border-stone-100'}`}>
                  <div className="w-8 text-center font-bold text-stone-400 mr-2">
                    #{user.rank}
                  </div>
                  <div className="relative mr-4">
                    {renderAvatar(user.avatarUrl, "w-10 h-10")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-800 truncate">{user.username}</p>
                      {user.currentStreak > 0 && (
                        <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          🔥 {user.currentStreak}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 font-medium">Lvl {user.level}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-black text-emerald-700 text-lg flex items-center justify-end gap-1">
                      {user.score} {activeTab === 'xp' ? <span className="text-xs font-semibold">XP</span> : activeTab === 'racha' ? <Flame size={16} /> : ''}
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
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="max-w-4xl mx-auto flex items-center gap-4 px-2 md:px-4">
            <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 font-black text-lg ${getRankColor(currentUserRank.rank!)}`}>
              {currentUserRank.rank! > 0 ? `#${currentUserRank.rank}` : '-'}
            </div>
            
            {renderAvatar(currentUserRank.avatarUrl, "w-10 h-10 md:w-12 md:h-12 border-2 border-stone-200 hidden md:block")}
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                {isEn ? "Your Position" : "Tu Posición"}
              </p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-stone-800 truncate">{currentUserRank.username || (isEn ? "You" : "Tú")}</p>
                <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Lvl {currentUserRank.level}</span>
              </div>
            </div>

            <div className="text-right">
              <p className="font-black text-emerald-700 text-xl md:text-2xl flex items-center gap-1">
                {currentUserRank.score} {activeTab === 'xp' ? <span className="text-sm font-semibold">XP</span> : activeTab === 'racha' ? <Flame size={20} /> : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
