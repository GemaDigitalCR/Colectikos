'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Compass } from 'lucide-react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useProgress } from '../context/ProgressContext';
import { useLugaresData } from '../context/LugaresContext';
import { calcularNivel } from '../utils/gamification';
import { mapLugaresByLocale } from '../utils/getLugares';
import enDict from '../dictionaries/en.json';
import esDict from '../dictionaries/es.json';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState('☀️');
  const [currentDate, setCurrentDate] = useState('');
  const [userData, setUserData] = useState({ username: 'Turista', gender: 'MASCULINO' });
  
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { completedPlaces, bucketList } = useProgress();
  const { user, isLoaded } = useUser();

  // Detectamos el idioma directamente desde la URL (ej. /en/ o /es/) en lugar del navegador
  // Esto mantiene la coherencia perfecta con el resto de la página
  const isEnglish = params?.lang === 'en';
  const dict = isEnglish ? enDict : esDict;

  const dbLugares = useLugaresData();

  useEffect(() => {
    const isHomePage = pathname === '/' || pathname === '/es' || pathname === '/en';
    if (!isHomePage) {
      setIsOpen(false);
      return;
    }

    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenWelcome) {
      setIsOpen(true);
      sessionStorage.setItem('hasSeenWelcomeModal', 'true');
    }

    // Configurar tiempo
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting(isEnglish ? 'Good morning' : 'Buenos días');
      setGreetingIcon('☀️');
    } else if (hour >= 12 && hour < 19) {
      setGreeting(isEnglish ? 'Good afternoon' : 'Buenas tardes');
      setGreetingIcon('🌤️');
    } else {
      setGreeting(isEnglish ? 'Good evening' : 'Buenas noches');
      setGreetingIcon('🌙');
    }

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    setCurrentDate(now.toLocaleDateString(isEnglish ? 'en-US' : 'es-ES', options));

    // Cargar perfil real del usuario
    try {
      const profileStr = localStorage.getItem('userProfileData');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        setUserData({
          username: profile.username || profile.name || (isLoaded && user?.username ? user.username : 'Turista'),
          gender: profile.gender?.toUpperCase() || profile.genero?.toUpperCase() || 'MASCULINO'
        });
      } else if (isLoaded && user?.username) {
        setUserData(prev => ({ ...prev, username: user.username! }));
      }
    } catch (e) {
      console.error("Error reading profile", e);
    }
  }, [isEnglish, isLoaded, user, pathname]);

  // Calcular métricas dinámicamente basadas en el estado real (completedPlaces y bucketList)
  const metrics = useMemo(() => {
    const getProvince = (lugarId: string, ubicacion: string) => {
      const provinceIds: Record<string, string> = {
        '1': 'SAN JOSE', '2': 'ALAJUELA', '3': 'CARTAGO', '4': 'HEREDIA',
        '5': 'PUNTARENAS', '6': 'LIMON', '7': 'GUANACASTE'
      };
      if (provinceIds[lugarId]) return provinceIds[lugarId];
      const u = ubicacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      if (u.includes('SAN JOSE')) return 'SAN JOSE';
      if (u.includes('ALAJUELA')) return 'ALAJUELA';
      if (u.includes('CARTAGO')) return 'CARTAGO';
      if (u.includes('HEREDIA')) return 'HEREDIA';
      if (u.includes('GUANACASTE')) return 'GUANACASTE';
      if (u.includes('PUNTARENAS') || u.includes('OSA') || u.includes('GARABITO')) return 'PUNTARENAS';
      if (u.includes('LIMON') || u.includes('TALAMANCA') || u.includes('CAHUITA')) return 'LIMON';
      return 'DESCONOCIDO';
    };

    const baseLugares = dbLugares.filter(l => l.categoria !== 'PROVINCIA');
    const totalBase = baseLugares.length;
    
    const completedBaseLugares = baseLugares.filter(l => completedPlaces.includes(l.id));
    const completedCount = completedBaseLugares.length;
    const progressPercentage = totalBase > 0 ? Math.round((completedCount / totalBase) * 100) : 0;

    // Pasamos dict.levels para que el título se traduzca correctamente
    const { titulo: rank } = calcularNivel(progressPercentage, userData.gender, dict.levels);

    const provinces = ['SAN JOSE', 'ALAJUELA', 'CARTAGO', 'HEREDIA', 'GUANACASTE', 'PUNTARENAS', 'LIMON'];
    const provStats: Record<string, { total: number; completed: number }> = {};
    provinces.forEach(p => provStats[p] = { total: 0, completed: 0 });

    baseLugares.forEach(lugar => {
      const p = getProvince(lugar.id, lugar.ubicacion);
      if (provStats[p]) {
        provStats[p].total += 1;
        if (completedPlaces.includes(lugar.id)) {
          provStats[p].completed += 1;
        }
      }
    });

    let lowestProvince = provinces[0];
    let lowestProvPercent = 101;
    provinces.forEach(p => {
      if (provStats[p].total > 0) {
        const percent = (provStats[p].completed / provStats[p].total) * 100;
        if (percent < lowestProvPercent) {
          lowestProvPercent = percent;
          lowestProvince = p;
        }
      }
    });

    const categoryStats: Record<string, { total: number; completed: number }> = {};
    baseLugares.forEach(lugar => {
      if (!categoryStats[lugar.categoria]) categoryStats[lugar.categoria] = { total: 0, completed: 0 };
      categoryStats[lugar.categoria].total += 1;
      if (completedPlaces.includes(lugar.id)) {
        categoryStats[lugar.categoria].completed += 1;
      }
    });

    let lowestCategory = Object.keys(categoryStats)[0] || 'Cultura';
    let lowestCatPercent = 101;
    Object.keys(categoryStats).forEach(c => {
      if (categoryStats[c].total > 0) {
        const percent = (categoryStats[c].completed / categoryStats[c].total) * 100;
        if (percent < lowestCatPercent) {
          lowestCatPercent = percent;
          lowestCategory = c;
        }
      }
    });

    const displayCategory = (dict.categories as Record<string, string>)[lowestCategory] || lowestCategory;

    // Localizar lugares para Próximos Destinos
    const localizedLugares = mapLugaresByLocale(dbLugares, isEnglish ? 'en' : 'es');
    const upcomingLugares = (bucketList || [])
      .map(id => localizedLugares.find(l => l.id === id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l));

    // Seleccionar destino recomendado si tiene en su lista de Próximos Destinos
    const recommendedPlace = upcomingLugares.length > 0
      ? upcomingLugares[new Date().getDate() % upcomingLugares.length]
      : null;

    return {
      progressPercentage,
      rank,
      lowestProvince: lowestProvince.charAt(0) + lowestProvince.slice(1).toLowerCase(),
      lowestCategory: displayCategory,
      recommendedPlace,
      upcomingCount: upcomingLugares.length
    };
  }, [completedPlaces, bucketList, dbLugares, isEnglish, userData.gender, dict]);

  if (!isOpen || pathname?.includes('/login')) return null;

  const ticoLabel = userData.gender.startsWith('F') ? 'Tica' : 'Tico';

  const handleExplore = () => {
    setIsOpen(false);
    if (metrics.recommendedPlace) {
      setTimeout(() => {
        const element = document.getElementById(`lugar-${metrics.recommendedPlace?.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-emerald-400', 'shadow-2xl', 'transition-all', 'duration-500');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-emerald-400', 'shadow-2xl');
          }, 2500);
        }
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8 max-w-lg w-full relative animate-fade-in-up"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 transition-colors bg-stone-100 hover:bg-stone-200 rounded-full p-2"
          aria-label={isEnglish ? "Close modal" : "Cerrar modal"}
        >
          <X size={20} />
        </button>

        <div className="inline-block border border-stone-200 rounded-full px-4 py-1.5 text-sm font-semibold text-stone-500 mb-2 bg-stone-50">
          {greetingIcon} {greeting} • <span className="capitalize">{currentDate}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 mt-3 tracking-tight">
          {isEnglish ? 'Hello, ' : 'Hola, '} <span className="text-emerald-500">{userData.username}</span>
        </h1>

        <p className="text-stone-600 mt-2.5 text-base sm:text-lg font-medium">
          {isEnglish ? `You are ${ticoLabel} at ` : `Eres ${ticoLabel} al `} 
          <span className="font-bold text-stone-900">
            {metrics.progressPercentage}%
          </span>. 
          {' '}
          {isEnglish ? 'Your current rank is: ' : 'Tu rango actual es: '}
          <span className="font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-md">
            {metrics.rank}
          </span>
        </p>

        {/* Recomendación personalizada: Basada en Próximos Destinos o sugerencia de avance */}
        <div className="bg-stone-50 rounded-2xl p-5 sm:p-6 mt-6 sm:mt-8 border border-stone-200/70 shadow-inner">
          {metrics.recommendedPlace ? (
            <div className="flex items-start gap-4">
              {metrics.recommendedPlace.imagenUrl && (
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-md relative bg-stone-200">
                  <img 
                    src={metrics.recommendedPlace.imagenUrl} 
                    alt={metrics.recommendedPlace.nombre} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    🚩
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-base leading-none">🚩</span>
                  <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                    {isEnglish ? 'Your next ride:' : 'Tu próximo ride:'}
                  </h3>
                  {metrics.upcomingCount > 1 && (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100/90 px-2 py-0.5 rounded-full">
                      {metrics.upcomingCount} {isEnglish ? 'planned' : 'en lista'}
                    </span>
                  )}
                </div>
                <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-medium">
                  {isEnglish ? (
                    <>
                      Remember you want to visit <span className="font-bold text-stone-950">{metrics.recommendedPlace.nombre}</span>{metrics.recommendedPlace.ubicacion ? ` in ${metrics.recommendedPlace.ubicacion}` : ''}. Don't hesitate any longer—it's the perfect time to experience this wonderful place and proudly unlock your postcard in your album!
                    </>
                  ) : (
                    <>
                      Recuerda que quieres visitar <span className="font-bold text-stone-950">{metrics.recommendedPlace.nombre}</span>{metrics.recommendedPlace.ubicacion ? ` en ${metrics.recommendedPlace.ubicacion}` : ''}. ¡No lo dudes más! Es el momento perfecto para disfrutar ese lugar tan hermoso y desbloquear tu postal con orgullo en tu álbum.
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-2">
                <Compass className="text-amber-500 shrink-0" size={24} />
                <h3 className="font-bold text-stone-800 text-lg">
                  {isEnglish ? '💡 Weekend idea:' : '💡 Idea para el finde:'}
                </h3>
              </div>
              <p className="text-stone-600 leading-relaxed font-medium">
                {isEnglish ? 'Your map shows you need to explore ' : 'Tu mapa muestra que te falta explorar '}
                <span className="font-bold text-amber-600">{metrics.lowestProvince}</span>. 
                {' '}
                {isEnglish ? 'Go ahead and discover a new adventure in the ' : 'Anímate a descubrir una nueva aventura en la categoría de '}
                <span className="font-bold text-amber-600 capitalize">{metrics.lowestCategory.toLowerCase()}</span>
                {isEnglish ? ' category.' : '.'}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button 
            onClick={handleExplore}
            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-full px-6 py-3.5 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer text-center"
          >
            {isEnglish ? "Let's explore!" : '¡A explorar!'}
          </button>
          <button 
            onClick={() => {
              setIsOpen(false);
              router.push(`/${isEnglish ? 'en' : 'es'}/profile`);
            }}
            className="flex-1 bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-700 font-bold rounded-full px-6 py-3.5 transition-all hover:border-stone-300 active:scale-95 cursor-pointer text-center"
          >
            {isEnglish ? 'View my profile' : 'Ver mi perfil'}
          </button>
        </div>
      </div>
    </div>
  );
}
