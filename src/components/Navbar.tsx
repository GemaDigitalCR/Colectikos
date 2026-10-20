"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { Leaf, UserCircle, LogOut, LogIn, Search, Menu, X, ChevronDown, Globe, Settings, Compass, HelpCircle } from 'lucide-react';
import { useLugaresData } from '../context/LugaresContext';
import { calcularNivel } from '../utils/gamification';
import { useProgress } from '../context/ProgressContext';
import { mapLugaresByLocale } from '../utils/getLugares';
import SearchBar from './SearchBar';
import EnergyTracker from './EnergyTracker';
import toast from 'react-hot-toast';

export default function Navbar({ dict, dictLevels }: { dict: any; dictLevels?: any }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const [username, setUsername] = useState<string>('NuevoUsuario');
  const [userGender, setUserGender] = useState<string>('Masculino');
  const { completedPlaces, xp, level, currentStreak, userProfile, bucketList } = useProgress();
  const bucketListCount = bucketList?.length || 0;

  useEffect(() => {
    if (isLoaded && !user) {
      setUsername('NuevoUsuario');
      setAvatarUrl(null);
      return;
    }
    
    // Si tenemos el perfil desde el contexto (reacciona automáticamente)
    if (userProfile) {
      if (userProfile.avatarUrl) setAvatarUrl(userProfile.avatarUrl);
      if (userProfile.username) setUsername(userProfile.username);
      if (userProfile.gender) setUserGender(userProfile.gender);
    } else {
      // Fallback a localStorage si el contexto aún no lo tiene pero está en memoria
      const saved = localStorage.getItem('userProfileData');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          if (data.username) setUsername(data.username);
          if (data.gender) setUserGender(data.gender);
        } catch (e) {}
      } else if (isLoaded && user?.username) {
        setUsername(user.username);
      } else if (isLoaded && !user?.username) {
        setUsername('NuevoUsuario');
      }
    }
  }, [isLoaded, user, userProfile]);

  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const dbLugares = useLugaresData();
  const isEn = pathname.startsWith('/en');
  const currentLang = isEn ? 'en' : 'es';

  const localizedLugares = useMemo(() => {
    return mapLugaresByLocale(dbLugares, currentLang);
  }, [dbLugares, currentLang]);

  const baseLugares = dbLugares.filter(l => l.categoria !== 'PROVINCIA');
  const totalGlobal = baseLugares.length;
  const completadosGlobal = baseLugares.filter(l => completedPlaces.includes(l.id)).length;
  const porcentajeGlobal = Math.round((completadosGlobal / totalGlobal) * 100) || 0;

  const { titulo: globalTitle } = calcularNivel(porcentajeGlobal, userGender.toUpperCase(), dictLevels);

  const handleLanguageChange = (targetLocale: string) => {
    const currentPath = pathname.replace(/^\/en/, '') || '/';

    let targetPath = currentPath;
    if (targetLocale === 'en') {
      targetPath = `/en${currentPath === '/' ? '' : currentPath}`;
    }

    toast.loading(isEn ? 'Changing language...' : 'Cambiando idioma...', { duration: 1000 });
    // Delegamos la creación de la cookie al servidor (Backend) mediante una API Route.
    // Esto es vital porque Safari y otros navegadores a veces ignoran 'document.cookie'
    // si se establece desde el cliente, pero NUNCA ignoran una cabecera HTTP 'Set-Cookie'.
    window.location.href = `/api/set-language?lang=${targetLocale}&redirect=${encodeURIComponent(targetPath)}`;
  };

  const handlePlaceholderClick = (e: React.MouseEvent, feature: string) => {
    e.preventDefault();
    toast.success(isEn ? `The section "${feature}" will be available soon.` : `La sección "${feature}" estará disponible pronto.`, {
      icon: '🚧',
    });
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      // Guardar el flag del tour
      const hasSeenTour = localStorage.getItem('hasSeenTicos100Tour');
      
      // Limpiar toda la memoria local (sesión y perfil)
      localStorage.clear();
      sessionStorage.clear();
      
      // Restaurar el flag del tour para que no lo vuelva a ver
      if (hasSeenTour) {
        localStorage.setItem('hasSeenTicos100Tour', hasSeenTour);
      }

      toast.success(isEn ? 'Logging out...' : 'Cerrando sesión...');
      
      // Cerrar sesión en Clerk y redirigir
      await signOut();
      window.location.href = isEn ? '/en' : '/';
    } catch (error) {
      console.error(error);
      window.location.href = isEn ? '/en' : '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 lg:h-24">
          {/* LADO IZQUIERDO: Logo (Mascota) e Inicio */}
          <Link
            href={isEn ? "/en" : "/"}
            title={dict?.home || "Inicio"}
            className="flex items-end gap-2 sm:gap-4 flex-shrink-0 group cursor-pointer h-full relative"
          >
            <div className="w-16 sm:w-24 lg:w-40 h-full relative shrink-0">
              <img
                src="/images/Imagenes_Pagina/otico-manitas-banner.PNG"
                alt="Mascota Colectikos"
                className="absolute -bottom-2 lg:-bottom-4 left-0 w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                style={{ transformOrigin: 'bottom center' }}
              />
            </div>
            <span className="hidden md:block pb-2 lg:pb-3 text-base lg:text-lg font-bold text-stone-500 group-hover:text-emerald-700 transition-colors">
              {dict?.home || "Inicio"}
            </span>
          </Link>

          {/* LADO DERECHO: Menús Desktop */}
          <div className="hidden lg:flex flex-col justify-center items-end h-full w-full">

            {/* Nivel Superior (Secundario) */}
            <div className="flex items-center gap-6 mb-1 mt-2 border-b border-stone-100 pb-1.5 w-full justify-end">
              <EnergyTracker />
              {/* Buscador Integrado */}
              <SearchBar lugares={localizedLugares} />

              {/* Idioma - Dropdown */}
              <div className="flex items-center gap-1.5 text-stone-500 hover:text-emerald-700 cursor-pointer transition-colors text-sm font-medium group relative py-2">
                <Globe size={16} />
                <span>{dict?.language || 'Language'}</span>
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 pt-2 w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden flex flex-col">
                    <button
                      onClick={() => handleLanguageChange('es')}
                      className={`px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 ${!isEn ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-stone-700'}`}
                    >
                      Español
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 ${isEn ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-stone-700'}`}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>

              {/* Configuración */}
              <Link href={`/${currentLang}/settings`} className="flex items-center gap-1.5 text-stone-500 hover:text-emerald-700 cursor-pointer transition-colors text-sm font-medium group relative py-2">
                <Settings size={16} />
                <span>{dict?.settings || 'Perfil'}</span>
              </Link>

              <div className="w-px h-5 bg-stone-300 mx-2"></div>

              {/* Funcionalidad Preservada: Perfil de Usuario con Nivel XP o Iniciar Sesión */}
              {isLoaded && user ? (
                <>
                  <Link id="tour-profile" href={`/${currentLang}/profile`} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <div className="text-right flex flex-col items-end justify-center">
                      <div className="flex items-center gap-1.5">
                        {currentStreak > 0 && (
                          <span id="tour-streak" className="flex items-center text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/50 shadow-sm" title={isEn ? `${currentStreak}-day streak` : `Racha de ${currentStreak} días seguidos`}>
                            {currentStreak} <span className="ml-0.5 opacity-90">🔥</span>
                          </span>
                        )}
                        <p className="text-sm font-bold text-stone-800 whitespace-nowrap">{username}</p>
                      </div>
                      <p id="tour-xp" className="text-xs font-semibold text-emerald-600 whitespace-nowrap">{globalTitle} - {xp} XP</p>
                    </div>
                    <div className="relative">
                      {avatarUrl ? (
                        <div id="tour-avatar" className="w-8 h-8 relative rounded-full overflow-hidden border border-stone-200">
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <UserCircle id="tour-avatar" size={32} className="text-stone-300" />
                      )}
                      {/* Mini-Indicador de Nivel */}
                      <div id="tour-level" className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                        {level}
                      </div>
                    </div>
                  </Link>
                  <Link 
                    href={`/${currentLang}/nuestra-app?tab=instrucciones`} 
                    className="text-stone-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    title={isEn ? "How do streaks and levels work?" : "¿Cómo funcionan las rachas y niveles?"}
                  >
                    <HelpCircle size={16} />
                  </Link>

                  {/* Funcionalidad Preservada: Logout */}
                  <a
                    href="#"
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-stone-500 hover:text-emerald-700 transition-colors font-medium text-sm"
                  >
                    <LogOut size={16} />
                    <span>{dict?.logout || 'Salir'}</span>
                  </a>
                </>
              ) : (
                <Link
                  href={`/${currentLang}/login`}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm text-sm transition-all hover:shadow"
                >
                  <LogIn size={16} />
                  <span>{dict?.login || (isEn ? 'Sign In' : 'Iniciar Sesión')}</span>
                </Link>
              )}
            </div>

            {/* Nivel Inferior (Principal) */}
            <div className="flex items-center gap-7 text-stone-700 font-semibold text-base mt-1 mb-1">
              <Link href={`/${currentLang}/nuestra-app`} className="hover:text-emerald-700 transition-colors">{dict?.ourApp || 'Nuestra App'}</Link>
              <div className="relative group py-2">
                <Link href={`/${currentLang}/#mis-destinos`} className="flex items-center gap-1 hover:text-emerald-700 transition-colors">
                  {dict?.destinations || 'Destinos'} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </Link>
                <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden flex flex-col">
                    <Link
                      href={`/${currentLang}/provincias`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium border-b border-stone-50"
                    >
                      {dict?.provinces || 'Provincias'}
                    </Link>
                    <Link
                      href={`/${currentLang}/destinos-visitados`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium border-b border-stone-50"
                    >
                      {dict?.visitedDestinations || 'Mis Destinos Visitados'}
                    </Link>
                    <Link
                      href={`/${currentLang}/proximos-destinos`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium border-b border-stone-50"
                    >
                      {dict?.upcomingDestinations || 'Mis Próximos Destinos'}
                    </Link>
                    <Link
                      href={`/${currentLang}/destinos/complementos`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium"
                    >
                      {dict?.rideAddons || 'Complementos de tu Ride'}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Acceso Directo Destacado: Mis Próximos Destinos */}
              <Link
                href={`/${currentLang}/proximos-destinos`}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 shadow-xs border -translate-y-1 ${
                  bucketListCount > 0
                    ? 'bg-red-50 hover:bg-red-100/90 text-red-700 border-red-200 hover:scale-105 hover:shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80 hover:text-stone-900'
                }`}
                title={dict?.upcomingDestinations || (isEn ? "My Upcoming Destinations" : "Mis Próximos Destinos")}
              >
                <span className="text-base leading-none">🚩</span>
                <span>{dict?.upcomingDestinations || (isEn ? "Upcoming Destinations" : "Próximos Destinos")}</span>
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center transition-colors ${
                  bucketListCount > 0 
                    ? 'bg-red-500 text-white shadow-xs' 
                    : 'bg-stone-200/70 text-stone-500'
                }`}>
                  {bucketListCount}
                </span>
              </Link>
              <div className="relative group py-2">
                <Link href={`/${currentLang}/community`} className="flex items-center gap-1 hover:text-emerald-700 transition-colors">
                  {dict?.community || 'Comunidad'} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </Link>
                <div className="absolute top-full left-0 pt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden flex flex-col">
                    <Link
                      href={`/${currentLang}/community/rankings`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium border-b border-stone-50"
                    >
                      {dict?.rankings || 'Rankings'}
                    </Link>
                    <Link
                      href={`/${currentLang}/community/playa`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium border-b border-stone-50"
                    >
                      {isEn ? "Tiko Beach (Beta) 🏖️" : "Tiko Playa (Beta) 🏖️"}
                    </Link>
                    <Link
                      href={`/${currentLang}/community/parejitikas`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium border-b border-stone-50"
                    >
                      Parejitikas 🧩
                    </Link>
                    <Link
                      href={`/${currentLang}/community/sopitika`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium border-b border-stone-50"
                    >
                      Sopitika 🍲
                    </Link>
                    <Link
                      href={`/${currentLang}/community/preguntikas`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium border-b border-stone-50"
                    >
                      Preguntikas 🦜
                    </Link>
                    <Link
                      href={`/${currentLang}/community/muro`}
                      className="px-4 py-2 text-left w-full transition-colors hover:bg-stone-50 hover:text-emerald-700 text-stone-700 font-medium"
                    >
                      {dict?.explorersWall || (isEn ? "Explorers' Wall" : "Muro de Exploradores")}
                    </Link>
                  </div>
                </div>
              </div>
              <Link href={`/${currentLang}/contact`} className="hover:text-emerald-700 transition-colors">{dict?.contact || 'Contacto'}</Link>
            </div>

          </div>

          <div className="lg:hidden flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <EnergyTracker />
            
            {/* Acceso Rápido Móvil a Próximos Destinos */}
            <Link
              href={`/${currentLang}/proximos-destinos`}
              className="relative p-1.5 text-stone-700 hover:text-red-600 active:scale-95 transition-all flex items-center justify-center rounded-xl bg-stone-50 border border-stone-200/80 shadow-2xs shrink-0"
              title={dict?.upcomingDestinations || (isEn ? "My Upcoming Destinations" : "Mis Próximos Destinos")}
              aria-label={dict?.upcomingDestinations || (isEn ? "My Upcoming Destinations" : "Mis Próximos Destinos")}
            >
              <span className="text-base leading-none">🚩</span>
              {bucketListCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {bucketListCount}
                </span>
              )}
            </Link>
            {isLoaded && user ? (
              <>
                {/* Racha Móvil */}
                {currentStreak > 0 && (
                  <div id="tour-streak-mobile" className="flex items-center text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/50 shadow-sm shrink-0" title={isEn ? `${currentStreak}-day streak` : `Racha de ${currentStreak} días`}>
                    {currentStreak} <span className="ml-0.5 opacity-90">🔥</span>
                  </div>
                )}
                {/* Perfil minimizado en móvil con Nivel */}
                <Link id="tour-profile-mobile" href={`/${currentLang}/profile`} className="flex items-center hover:opacity-80 transition-opacity cursor-pointer relative shrink-0">
                  {avatarUrl ? (
                    <div id="tour-avatar-mobile" className="w-7 h-7 sm:w-8 sm:h-8 relative rounded-full overflow-hidden border border-stone-200">
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <UserCircle id="tour-avatar-mobile" size={28} className="text-stone-300" />
                  )}
                  {/* Mini-Indicador de Nivel (Mobile) */}
                  <div id="tour-level-mobile" className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                    {level}
                  </div>
                </Link>
              </>
            ) : (
              <Link
                href={`/${currentLang}/login`}
                className="flex items-center gap-1.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-xl shadow-sm text-xs transition-all shrink-0"
              >
                <LogIn size={13} />
                <span>{dict?.login || (isEn ? 'Sign In' : 'Entrar')}</span>
              </Link>
            )}
            <Link 
              href={`/${currentLang}/nuestra-app?tab=instrucciones`} 
              className="text-stone-400 hover:text-emerald-600 transition-colors cursor-pointer hidden sm:flex shrink-0"
              title={isEn ? "How do streaks and levels work?" : "¿Cómo funcionan las rachas y niveles?"}
            >
              <HelpCircle size={16} />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-lg text-stone-700 hover:text-emerald-700 hover:bg-stone-100 transition-colors focus:outline-none shrink-0 border border-stone-200/80 bg-stone-50"
              aria-label={isEn ? "Open menu" : "Abrir menú"}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Menú Desplegable Mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-stone-200 shadow-xl absolute w-full left-0 z-50 overflow-y-auto max-h-[calc(100vh-70px)]">
          <div className="px-4 pt-4 pb-8 space-y-4">

            {/* Buscador Integrado Móvil */}
            <div className="w-full">
              <SearchBar 
                id="mobile-search-input"
                inputRef={mobileSearchInputRef}
                lugares={localizedLugares}
                onSelectCallback={() => setIsMobileMenuOpen(false)}
                className="w-full max-w-none"
              />
            </div>

            {/* Tarjeta Destacada de Próximos Destinos en Móvil */}
            <Link
              href={`/${currentLang}/proximos-destinos`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-red-50/90 via-amber-50/60 to-stone-50 border border-red-200/80 shadow-xs active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-red-100 flex items-center justify-center text-xl shrink-0">
                  🚩
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900 leading-tight">
                    {dict?.upcomingDestinations || (isEn ? "My Upcoming Destinations" : "Mis Próximos Destinos")}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {isEn ? "Planned routes & recommended spots" : "Tus rutas y paradas recomendadas"}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                bucketListCount > 0 
                  ? 'bg-red-500 text-white shadow-xs' 
                  : 'bg-stone-200 text-stone-500'
              }`}>
                {bucketListCount}
              </span>
            </Link>

            {/* Opciones Principales */}
            <div className="flex flex-col space-y-4 pb-4 border-b border-stone-100">
              <Link href={`/${currentLang}/nuestra-app`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-800 font-semibold hover:text-emerald-700 block text-lg">{dict?.ourApp || 'Nuestra App'}</Link>
              <div className="space-y-2">
                <Link href={`/${currentLang}/#mis-destinos`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-800 font-semibold hover:text-emerald-700 block text-lg">{dict?.destinations || 'Destinos'}</Link>
                <div className="pl-4 border-l-2 border-stone-100 flex flex-col gap-3 mt-2">
                  <Link href={`/${currentLang}/provincias`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 block text-base">
                    {dict?.provinces || 'Provincias'}
                  </Link>
                  <Link href={`/${currentLang}/destinos-visitados`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 block text-base">
                    {dict?.visitedDestinations || 'Mis Destinos Visitados'}
                  </Link>
                  <Link href={`/${currentLang}/proximos-destinos`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 flex items-center justify-between text-base">
                    <span>{dict?.upcomingDestinations || 'Mis Próximos Destinos'}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${bucketListCount > 0 ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'}`}>
                      {bucketListCount}
                    </span>
                  </Link>
                  <Link href={`/${currentLang}/destinos/complementos`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 block text-base">
                    {dict?.rideAddons || 'Complementos de tu Ride'}
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
                <Link href={`/${currentLang}/community`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-800 font-semibold hover:text-emerald-700 block text-lg">{dict?.community || 'Comunidad'}</Link>
                <div className="pl-4 border-l-2 border-stone-100 flex flex-col gap-3 mt-2">
                  <Link href={`/${currentLang}/community/rankings`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 block text-base">
                    {dict?.rankings || 'Rankings'}
                  </Link>
                  <Link href={`/${currentLang}/community/playa`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-amber-600 block text-base">
                    {isEn ? "Tiko Beach (Beta) 🏖️" : "Tiko Playa (Beta) 🏖️"}
                  </Link>
                  <Link href={`/${currentLang}/community/parejitikas`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 block text-base">
                    Parejitikas 🧩
                  </Link>
                  <Link href={`/${currentLang}/community/sopitika`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 block text-base">
                    Sopitika 🍲
                  </Link>
                  <Link href={`/${currentLang}/community/preguntikas`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 block text-base">
                    Preguntikas 🦜
                  </Link>
                  <Link href={`/${currentLang}/community/muro`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-600 font-medium hover:text-emerald-700 block text-base">
                    {dict?.explorersWall || (isEn ? "Explorers' Wall" : "Muro de Exploradores")}
                  </Link>
                </div>
              </div>
              <Link href={`/${currentLang}/contact`} onClick={() => setIsMobileMenuOpen(false)} className="text-stone-800 font-semibold hover:text-emerald-700 block text-lg">{dict?.contact || 'Contacto'}</Link>

            </div>

            {/* Opciones Secundarias */}
            <div className="flex flex-col space-y-4 pb-4 border-b border-stone-100">
              <button
                type="button"
                className="flex items-center gap-3 text-stone-600 hover:text-emerald-700 font-medium text-left w-full transition-colors group cursor-pointer"
                onClick={() => {
                  if (mobileSearchInputRef.current) {
                    mobileSearchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    mobileSearchInputRef.current.focus();
                    mobileSearchInputRef.current.classList.add('ring-4', 'ring-emerald-400');
                    setTimeout(() => {
                      mobileSearchInputRef.current?.classList.remove('ring-4', 'ring-emerald-400');
                    }, 1500);
                  }
                }}
              >
                <Search size={20} className="text-stone-500 group-hover:text-emerald-600 transition-colors shrink-0" />
                <span>{dict?.navbar?.search || (isEn ? 'Search' : 'Buscar')}</span>
              </button>

              {/* Idioma - Expandable en Móvil */}
              <div>
                <div
                  className="flex items-center gap-3 text-stone-600 hover:text-emerald-700 cursor-pointer font-medium"
                  onClick={() => setIsMobileLangOpen(!isMobileLangOpen)}
                >
                  <Globe size={20} />
                  <span>{dict?.language || 'Language'}</span>
                  <ChevronDown size={16} className={`ml-auto transition-transform duration-200 ${isMobileLangOpen ? 'rotate-180' : ''}`} />
                </div>
                {isMobileLangOpen && (
                  <div className="mt-2 ml-8 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        handleLanguageChange('es');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`text-left font-medium text-sm py-2 px-3 rounded-md transition-colors ${!isEn ? 'bg-emerald-50 text-emerald-800' : 'text-stone-500 hover:bg-stone-50'}`}
                    >
                      Español
                    </button>
                    <button
                      onClick={() => {
                        handleLanguageChange('en');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`text-left font-medium text-sm py-2 px-3 rounded-md transition-colors ${isEn ? 'bg-emerald-50 text-emerald-800' : 'text-stone-500 hover:bg-stone-50'}`}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>
              <Link href={`/${currentLang}/settings`} className="flex items-center gap-3 text-stone-600 hover:text-emerald-700 cursor-pointer font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                <Settings size={20} />
                <span>{dict?.settings || 'Perfil'}</span>
              </Link>
            </div>

            {/* Perfil Completo & Logout / Login en Móvil */}
            <div className="flex flex-col space-y-4 pt-2">
              {isLoaded && user ? (
                <>
                  <Link href={`/${currentLang}/profile`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 bg-stone-50 p-3 rounded-lg border border-stone-100">
                    {avatarUrl ? (
                      <div className="w-7 h-7 relative rounded-full overflow-hidden border border-stone-200">
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <UserCircle size={28} className="text-stone-500" />
                    )}
                    <div>
                      <p className="text-base font-bold text-stone-800">{username}</p>
                      <p className="text-sm font-semibold text-emerald-600">{globalTitle} - {porcentajeGlobal}% Tico</p>
                    </div>
                  </Link>
                  <a
                    href="#"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 text-stone-600 bg-stone-100 active:bg-stone-200 active:text-emerald-700 font-bold py-3.5 w-full rounded-xl cursor-pointer relative z-50"
                  >
                    <LogOut size={20} />
                    <span>{dict?.logout || 'Cerrar Sesión'}</span>
                  </a>
                </>
              ) : (
                <Link
                  href={`/${currentLang}/login`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 text-white bg-emerald-600 active:bg-emerald-700 font-bold py-3.5 w-full rounded-xl shadow-md cursor-pointer relative z-50"
                >
                  <LogIn size={20} />
                  <span>{dict?.login || (isEn ? 'Sign In' : 'Iniciar Sesión')}</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}
