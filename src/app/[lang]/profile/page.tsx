"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { UserCircle, Award, Trophy, Medal, Star, Edit3, BookOpen, Loader2, HelpCircle, LogIn } from 'lucide-react';
import { Categoria } from '../../../data/mockData';
import { useLugaresData } from '../../../context/LugaresContext';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';
import { calcularNivel } from '../../../utils/gamification';
import SharePoster from '../../../components/SharePoster';
import PassportModal from '../../../components/PassportModal';

// Constantes visuales para las categorías
const CATEGORY_UI: Partial<Record<Categoria, { icon: string, label: string, color: string }>> = {
  PROVINCIA: { icon: '🗺️', label: 'Provincias', color: 'bg-emerald-600' },
  VOLCAN: { icon: '🌋', label: 'Volcanes', color: 'bg-orange-500' },
  PARQUE_NACIONAL: { icon: '🌳', label: 'Parques Nacionales', color: 'bg-green-600' },
  PLAYA: { icon: '🏖️', label: 'Playas', color: 'bg-cyan-500' },
  RIOS_Y_CATARATAS: { icon: '💧', label: 'Ríos y Cataratas', color: 'bg-blue-500' },
  LAGUNAS: { icon: '🏞️', label: 'Lagunas', color: 'bg-teal-500' },
  CIUDAD_Y_CULTURA: { icon: '🏛️', label: 'Ciudad y Cultura', color: 'bg-amber-600' },
  BOSQUES_RESERVAS: { icon: '🌳', label: 'Bosques y Reservas', color: 'bg-green-700' },
};

import { useProgress } from '../../../context/ProgressContext';
import { useDictionary } from '../../../context/DictionaryContext';
import { mapLugaresByLocale } from '../../../utils/getLugares';
import dynamic from 'next/dynamic';
import MedalFlipCard from '../../../components/MedalFlipCard';

import StaticProgressMap from '../../../components/StaticProgressMap';

import { getProvincesForLugar } from '../../../utils/getLugares';

export default function Profile() {
  const { completedPlaces, unlockModes, currentStreak, xp, level, userProfile } = useProgress(); 
  const dict = useDictionary(); 
  const dbLugares = useLugaresData();
  const lang = dict?.lang || 'es';
  const localizedLugares = mapLugaresByLocale(dbLugares, lang);
  
  const progressRef = useRef<HTMLDivElement>(null);
  const generatedFileRef = useRef<File | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [canShareNative, setCanShareNative] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const [username, setUsername] = useState<string>('Coleccionista');
  const [userGender, setUserGender] = useState<string>('Masculino');
  const [playMode, setPlayMode] = useState<string>('Modo Curioso');

  useEffect(() => {
    if (userProfile) {
      if (userProfile.avatarUrl) setAvatarUrl(userProfile.avatarUrl);
      if (userProfile.username) setUsername(userProfile.username);
      if (userProfile.gender) setUserGender(userProfile.gender);
      if (userProfile.playMode) setPlayMode(userProfile.playMode);
    } else {
      try {
        const saved = localStorage.getItem('userProfileData');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          if (data.username) setUsername(data.username);
          if (data.gender) setUserGender(data.gender);
          if (data.playMode) setPlayMode(data.playMode);
        } else if (isLoaded && user?.username) {
          setUsername(user.username);
        }
      } catch (e) {}
    }
  }, [isLoaded, user, userProfile]);
  
  const handleNativeShare = async () => {
    if (!generatedFileRef.current || typeof navigator === 'undefined' || !('share' in navigator)) return;
    try {
      if ('canShare' in navigator && navigator.canShare({ files: [generatedFileRef.current] })) {
        await navigator.share({
          title: lang === 'en' ? 'My Colectikos Passport' : 'Mi Pasaporte Colectikos',
          text: lang === 'en'
            ? `I have conquered ${completadosGlobal} of ${totalGlobal} places in Colectikos! 🇨🇷✨`
            : `¡Llevo ${completadosGlobal} de ${totalGlobal} lugares conquistados en Colectikos! 🇨🇷✨`,
          files: [generatedFileRef.current]
        });
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Native share error:', e);
      }
    }
  };

  const handleShareProgress = async () => {
    if (!progressRef.current) return;
    
    try {
      setIsSharing(true);
      
      const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // En móviles usamos pixelRatio: 1.25 para evitar agotar la memoria de GPU de WebKit / Safari
      // y prevenir reinicios de pestaña. En Desktop mantenemos 2.0.
      const pixelRatio = isMobile ? 1.25 : 2;
      
      const dataUrl = await toPng(progressRef.current, { 
        pixelRatio,
        cacheBust: true,
      });
      
      setPreviewDataUrl(dataUrl);

      // Crear archivo para Native Share
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], lang === 'en' ? 'My-Colectikos-Passport.png' : 'Mi-Pasaporte-Colectikos.png', { type: blob.type || 'image/png' });
        generatedFileRef.current = file;

        const hasShare = Boolean(
          typeof navigator !== 'undefined' &&
          'share' in navigator &&
          'canShare' in navigator &&
          navigator.canShare({ files: [file] })
        );
        setCanShareNative(hasShare);

        // Si es móvil y soporta compartir archivos directamente, intentamos invocar el menú nativo
        if (isMobile && hasShare) {
          try {
            await navigator.share({
              title: 'Mi Pasaporte Colectikos',
              text: `¡Llevo ${completadosGlobal} de ${totalGlobal} lugares conquistados en Colectikos! 🇨🇷✨`,
              files: [file]
            });
            toast.success(dict?.profile?.downloadSuccess || '¡Pasaporte listo!');
            setIsSharing(false);
            return;
          } catch (shareErr: any) {
            // Si el usuario canceló el share sheet nativo de iOS, no mostramos error
            if (shareErr?.name === 'AbortError') {
              setIsSharing(false);
              return;
            }
          }
        }
      } catch (fileErr) {
        console.warn("Could not prepare file for native share:", fileErr);
      }

      // Si no usó el share sheet nativo o en Desktop, abrimos el modal visual de respaldo
      setIsPassportModalOpen(true);
      toast.success(dict?.profile?.downloadSuccess || '¡Tu Pasaporte está listo!');
      
    } catch (error) {
      console.error('Error sharing progress:', error);
      toast.error(dict?.profile?.shareError || 'Hubo un error al generar la imagen.');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Calcular el progreso por provincia para el mapa
  const progressData: Record<string, { completed: number; total: number; percentage: number }> = {};
  const provinces = ['SAN JOSE', 'ALAJUELA', 'CARTAGO', 'HEREDIA', 'GUANACASTE', 'PUNTARENAS', 'LIMON'];
  
  provinces.forEach(p => progressData[p] = { completed: 0, total: 0, percentage: 0 });
  
  localizedLugares.forEach(lugar => {
    // Para el cálculo de porcentaje, NO contamos a la propia provincia,
    // solo contamos los lugares que pertenecen a ella.
    if (lugar.categoria === 'PROVINCIA') return;

    const provincesForLugar = getProvincesForLugar(lugar.id, dbLugares);
    
    provincesForLugar.forEach(province => {
      if (progressData[province]) {
        progressData[province].total += 1;
        if (completedPlaces.includes(lugar.id)) {
          progressData[province].completed += 1;
        }
      }
    });
  });

  provinces.forEach(p => {
    if (progressData[p].total > 0) {
      progressData[p].percentage = Math.round((progressData[p].completed / progressData[p].total) * 100);
    }
  });



  // Excluir la categoría Provincias del progreso total general
  const baseLugares = localizedLugares.filter(l => l.categoria !== 'PROVINCIA');
  const totalGlobal = baseLugares.length;
  const completadosGlobal = baseLugares.filter(l => completedPlaces.includes(l.id)).length;
  const porcentajeGlobal = Math.round((completadosGlobal / totalGlobal) * 100) || 0;
  
  // Usar género desde el perfil
  const { titulo: globalTitle } = calcularNivel(porcentajeGlobal, userGender.toUpperCase(), dict?.levels);

  // Calcular estadísticas por categoría
  const categoryStats = Object.keys(CATEGORY_UI)
    .filter(catKey => catKey !== 'PROVINCIA')
    .map(catKey => {
    const key = catKey as Categoria;
    const placesInCat = localizedLugares.filter(l => l.categoria === key);
    const completedInCat = placesInCat.filter(l => completedPlaces.includes(l.id));
    
    const total = placesInCat.length;
    const completed = completedInCat.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Nivel de Medalla
    let medalLevel = 'none';
    let MedalIcon = Medal;
    let medalColor = 'text-stone-300';
    let medalBg = 'bg-stone-100';
    let catTitle = '';
    let isPerfectScore = false;

    // Integración de niveles gamificados estándar
    const result = calcularNivel(percentage, userGender.toUpperCase(), dict?.levels);
    catTitle = result.titulo;
    isPerfectScore = result.isPerfectScore;

    if (percentage >= 75) {
      medalLevel = 'gold';
      MedalIcon = Trophy;
      medalColor = 'text-yellow-500';
      medalBg = 'bg-yellow-50 border-yellow-200';
    } else if (percentage >= 50) {
      medalLevel = 'silver';
      MedalIcon = Award;
      medalColor = 'text-slate-400';
      medalBg = 'bg-slate-50 border-slate-200';
    } else if (percentage >= 25) {
      medalLevel = 'bronze';
      MedalIcon = Medal;
      medalColor = 'text-amber-600';
      medalBg = 'bg-amber-50 border-amber-200';
    } else {
      medalLevel = 'paper';
      MedalIcon = Medal;
      medalColor = 'text-stone-400';
      medalBg = 'bg-stone-100 border-stone-200';
    }

    return {
      id: key,
      ...CATEGORY_UI[key],
      label: dict?.categories?.[key] || CATEGORY_UI[key]?.label,
      total,
      completed,
      percentage,
      medalLevel,
      MedalIcon,
      medalColor,
      medalBg,
      catTitle,
      isPerfectScore
    };
  });

  const modeStats = {
    Curioso: 0,
    Nómada: 0,
    Conquistador: 0
  };

  completedPlaces.forEach(id => {
    const mode = unlockModes?.[id];
    if (mode === 'Curioso') modeStats.Curioso++;
    else if (mode === 'Nómada') modeStats.Nómada++;
    else if (mode === 'Conquistador') modeStats.Conquistador++;
  });

  return (
    <>
      
      <main className="flex-1 w-full bg-transparent min-h-[calc(100vh-64px)] py-12">
        <div className="w-full max-w-7xl mx-auto space-y-8 pb-24 px-5 sm:px-6 lg:px-8">
          
          {/* Cabecera del Perfil */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 flex flex-col md:flex-row items-center gap-8 relative">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center border-4 border-emerald-50 overflow-hidden relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={lang === 'en' ? 'Profile Avatar' : 'Avatar de Perfil'} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={80} className="text-stone-300" />
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-3xl font-extrabold text-stone-900">{username}</h1>
                
                <div className="flex-1 flex justify-center order-first md:order-none mb-2 md:mb-0">
                  <span className="text-emerald-700 font-black text-3xl md:text-4xl tracking-tight bg-emerald-50/80 px-5 py-1 rounded-2xl border-2 border-emerald-200 shadow-sm rotate-2 hover:rotate-0 transition-transform cursor-default">
                    {userGender.toLowerCase() === 'femenino' ? 'Tica' : 'Tico'}{porcentajeGlobal}
                  </span>
                </div>
                
                <div id="profile-actions" className="flex flex-wrap justify-center md:justify-end items-center gap-3">
                  <button 
                    onClick={handleShareProgress}
                    disabled={isSharing}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 border border-emerald-700 rounded-xl hover:bg-emerald-500 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSharing ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                    {isSharing ? (dict?.profile?.generating || 'Generando...') : (dict?.profile?.shareProgress || 'Mi Pasaporte')}
                  </button>
                  <Link href={`/${lang}/settings`} className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-all shadow-sm hover:shadow">
                    <Edit3 size={16} /> {dict?.profile?.editProfile || 'Editar Perfil'}
                  </Link>
                </div>
              </div>
              <p className="text-lg font-medium text-emerald-700 mb-2">{globalTitle}</p>
              
              <div className="flex flex-row flex-wrap gap-2 md:gap-3 mt-2 mb-6 justify-center md:justify-start items-center">
                <span className="bg-orange-50 text-orange-700 px-3 py-1.5 md:py-1 rounded-full text-xs md:text-sm font-medium border border-orange-200 flex items-center gap-1 shadow-sm md:shadow-none">
                  🔥 {dict?.gamification?.streakDays ? dict.gamification.streakDays.replace('{days}', currentStreak.toString()) : `${currentStreak} Días`}
                </span>
                <span className="bg-amber-50 text-amber-700 px-3 py-1.5 md:py-1 rounded-full text-xs md:text-sm font-medium border border-amber-200 flex items-center gap-1 shadow-sm md:shadow-none">
                  ⭐ {dict?.gamification?.level ? dict.gamification.level.replace('{level}', level.toString()) : `Nivel ${level}`}
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 md:py-1 rounded-full text-xs md:text-sm font-medium border border-emerald-200 flex items-center gap-1 shadow-sm md:shadow-none">
                  ✨ {xp} XP
                </span>
                <Link 
                  href={`/${lang}/nuestra-app?tab=instrucciones`} 
                  className="bg-stone-50 text-stone-500 px-3 py-1 rounded-full text-sm font-medium border border-stone-200 flex items-center gap-1 cursor-pointer hover:opacity-80 hover:bg-stone-100 transition-all"
                  title={lang === 'en' ? 'How do streaks and levels work?' : '¿Cómo funcionan las rachas y niveles?'}
                >
                  <HelpCircle className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <span className="text-stone-600">{dict?.profile?.ticoProgress || 'Progreso Tico'}</span>
                  <span className="text-emerald-700">{porcentajeGlobal}%</span>
                </div>
                <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                    style={{ width: `${porcentajeGlobal}%` }}
                  ></div>
                </div>
                <p className="text-xs text-stone-500 font-medium mt-2 text-right">
                  {dict?.profile?.placesConquered 
                    ? dict.profile.placesConquered.replace('{completed}', completadosGlobal.toString()).replace('{total}', totalGlobal.toString())
                    : `${completadosGlobal} de ${totalGlobal} lugares conquistados`}
                </p>
              </div>
            </div>
          </div>

          {/* Sección Orgullo de Coleccionista */}
          <div className="mb-8 mt-12">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Star className="text-emerald-500" /> 
              {dict?.profileStats?.title || 'Orgullo de Coleccionista'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto">
              <div className="bg-[#cd7f32]/10 border-2 border-[#cd7f32]/30 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-4xl font-black text-[#cd7f32] mb-1">{modeStats.Curioso}</span>
                <span className="text-sm font-bold text-stone-700 text-center">{dict?.profileStats?.curioso || 'Postales Curiosas'}</span>
              </div>
              <div className="bg-[#c0c0c0]/10 border-2 border-[#c0c0c0]/40 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-4xl font-black text-stone-500 mb-1">{modeStats.Nómada}</span>
                <span className="text-sm font-bold text-stone-700 text-center">{dict?.profileStats?.nomada || 'Postales Nómadas'}</span>
              </div>
              <div className="bg-[#ffd700]/10 border-2 border-[#ffd700]/40 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-4xl font-black text-amber-500 mb-1">{modeStats.Conquistador}</span>
                <span className="text-sm font-bold text-stone-700 text-center">{dict?.profileStats?.conquistador || 'Postales Conquistadas'}</span>
              </div>
            </div>
          </div>

          {/* Sección Unificada: Medallas y Progreso */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> 
              {dict?.profile?.yourMedals || 'Tus Logros'}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl mx-auto mt-6">
              {categoryStats.map((stat, index) => (
                <div key={stat.id} className={index === 6 ? "col-span-2 sm:col-span-1 sm:col-start-1 md:col-span-1 md:col-start-2" : ""}>
                  <MedalFlipCard stat={stat} dict={dict} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Mapa Estático de Costa Rica */}
          <StaticProgressMap progressData={progressData} dict={dict} />

        </div>
      </main>
      <SharePoster 
        posterRef={progressRef}
        username={username}
        avatarUrl={avatarUrl}
        globalTitle={globalTitle}
        completadosGlobal={completadosGlobal}
        totalGlobal={totalGlobal}
        porcentajeGlobal={porcentajeGlobal}
        categoryStats={categoryStats}
        progressData={progressData}
        dict={dict}
        playMode={playMode}
        currentStreak={currentStreak}
        xp={xp}
        level={level}
        gender={userGender}
      />
      <PassportModal 
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
        imageUrl={previewDataUrl}
        onShareNative={handleNativeShare}
        canShareNative={canShareNative}
        dict={dict}
      />
    </>
  );
}
