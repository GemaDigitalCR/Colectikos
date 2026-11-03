"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useDictionary } from '../../../../context/DictionaryContext';
import { useUser } from '@clerk/nextjs';
import { useProgress } from '../../../../context/ProgressContext';
import { awardComplementosDailyXP } from '../../../../actions/gamification';
import SponsorCard from '../../../../components/SponsorCard';
import { ChevronDown } from 'lucide-react';
import hotToast from 'react-hot-toast';
import { toast as sonnerToast } from 'sonner';
import confetti from 'canvas-confetti';
import { playHtmlAudioClick } from '../../../../lib/soundUtils';

export default function ComplementosClient({ sponsors }: { sponsors: any[] }) {
  const dict = useDictionary();
  const lang = dict?.lang || 'es';
  const { user } = useUser();
  const { updateLocalXp } = useProgress();
  
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [highlightedSponsorId, setHighlightedSponsorId] = useState<string | null>(null);

  const isCheckingRewardRef = useRef(false);
  const rewardCheckedRef = useRef(false);
  const alreadyNotifiedRef = useRef(false);

  // Verificación y asignación de Bono Diario de Explorador (10 XP)
  const checkAndAwardReward = useCallback(async (isUserAction: boolean = false) => {
    if (typeof window === 'undefined') return;
    if (isCheckingRewardRef.current) return;
    if (rewardCheckedRef.current && !isUserAction) return;

    isCheckingRewardRef.current = true;
    try {
      let localUsername = localStorage.getItem('localUsername') || undefined;
      const profileData = localStorage.getItem('userProfileData');
      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          if (parsed.username) localUsername = parsed.username;
        } catch {}
      }

      const res = await awardComplementosDailyXP(localUsername, user?.id);
      rewardCheckedRef.current = true;

      if (res?.success) {
        if (!res.alreadyClaimed && res.xpAwarded > 0) {
          if (updateLocalXp && res.newTotalXp !== undefined && res.newLevel !== undefined) {
            updateLocalXp(res.newTotalXp, res.newLevel);
          }

          playHtmlAudioClick();
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch {}

          const title = lang === 'en' ? '🧭 +10 XP Daily Explorer Bonus!' : '🧭 ¡+10 XP! Bono Diario de Explorador';
          const desc = lang === 'en' 
            ? 'Thanks for exploring Ride Add-ons and discovering local spots!' 
            : '¡Ganaste 10 XP por explorar Complementos de tu Ride y descubrir comercios locales!';

          hotToast.success(`${title}\n${desc}`, {
            duration: 6000,
            icon: '🧭',
            style: {
              borderRadius: '16px',
              background: '#064e3b',
              color: '#fff',
              border: '2px solid #10b981',
              fontWeight: 600
            }
          });
          sonnerToast.success(title, { description: desc, duration: 6000 });
        } else if (res.alreadyClaimed && isUserAction && !alreadyNotifiedRef.current) {
          alreadyNotifiedRef.current = true;
          const alreadyTitle = lang === 'en' ? '🧭 Daily Bonus Active!' : '🧭 ¡Bono Diario Activo!';
          const alreadyDesc = lang === 'en'
            ? 'You already collected your 10 XPs today for exploring Ride Add-ons. Come back tomorrow!'
            : 'Ya tienes tus 10 XPs de hoy acreditados por explorar Complementos de tu Ride. ¡Vuelve mañana por más!';

          hotToast(alreadyTitle + '\n' + alreadyDesc, {
            icon: '✅',
            duration: 4500,
            style: {
              borderRadius: '16px',
              background: '#1c1917',
              color: '#fff',
              border: '1px solid #78716c'
            }
          });
          sonnerToast.info(alreadyTitle, { description: alreadyDesc, duration: 4500 });
        }
      }
    } catch (e) {
      console.warn('Error awarding Complementos daily XP:', e);
    } finally {
      isCheckingRewardRef.current = false;
    }
  }, [user?.id, lang, updateLocalXp]);

  useEffect(() => {
    // Al cabo de 1.2s en la página, premiar automáticamente si aún no ha reclamado hoy
    const timer = setTimeout(() => {
      checkAndAwardReward(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [checkAndAwardReward]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar si viene provincia en la URL (ej: ?provincia=Guanacaste)
    const searchParams = new URLSearchParams(window.location.search);
    const provParam = searchParams.get('provincia');
    if (provParam) {
      const match = provinces.find(
        p => p.id && (p.id.toLowerCase() === provParam.toLowerCase() || p.label.toLowerCase() === provParam.toLowerCase())
      );
      if (match && match.id) {
        setActiveProvince(match.id);
      }
    }

    // Verificar si viene ancla específica de patrocinador (ej: #sponsor-xyz)
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#sponsor-')) {
        const targetId = hash.replace('#sponsor-', '');
        const targetSponsor = sponsors.find(s => s.id === targetId);
        if (targetSponsor) {
          // Limpiar filtros para garantizar visibilidad de la tarjeta
          setActiveProvince(null);
          setActiveCategory('ALL');
        }

        setHighlightedSponsorId(targetId);

        setTimeout(() => {
          const el = document.getElementById(`sponsor-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);

        const timer = setTimeout(() => {
          setHighlightedSponsorId(null);
        }, 4000);

        return () => clearTimeout(timer);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [sponsors]);

  const provinces = [
    { id: null, label: lang === 'en' ? 'All' : 'Todas' },
    { id: 'SAN JOSE', label: lang === 'en' ? 'San Jose' : 'San José' },
    { id: 'ALAJUELA', label: 'Alajuela' },
    { id: 'CARTAGO', label: 'Cartago' },
    { id: 'HEREDIA', label: 'Heredia' },
    { id: 'GUANACASTE', label: 'Guanacaste' },
    { id: 'PUNTARENAS', label: 'Puntarenas' },
    { id: 'LIMON', label: lang === 'en' ? 'Limon' : 'Limón' },
  ];

  const categories = [
    { id: 'ALL', icon: '🌍', label: lang === 'en' ? 'All' : 'Todos' },
    { id: 'HOSPEDAJE', icon: '🏨', label: lang === 'en' ? 'Lodging' : 'Hospedaje' },
    { id: 'ALIMENTACION', icon: '🍽️', label: lang === 'en' ? 'Food' : 'Alimentación' },
    { id: 'TOURS', icon: '🧭', label: 'Tours' },
    { id: 'TRANSPORTE', icon: '🚗', label: lang === 'en' ? 'Transport' : 'Transporte' },
    { id: 'SOUVENIRS', icon: '🛍️', label: 'Souvenirs' },
    { id: 'NEGOCIOS_EN_LINEA', icon: '💻', label: lang === 'en' ? 'Online Businesses' : 'Negocios en Línea' },
  ];

  // FILTRAR PATROCINADORES
  const filteredSponsors = useMemo(() => {
    return sponsors.filter(sponsor => {
      // Normalizar datos de la BD (ignorar mayúsculas/minúsculas y tildes)
      const cat = sponsor.categoria ? sponsor.categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : '';
      const prov = sponsor.provincia ? sponsor.provincia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : '';

      const isOnlineFilter = activeCategory === 'NEGOCIOS_EN_LINEA' || activeCategory === 'ONLINE';
      const matchCategory = activeCategory === 'ALL' || (
        isOnlineFilter
          ? (sponsor.alcanceNacional === true || cat === 'NEGOCIOS_EN_LINEA' || cat === 'ONLINE' || cat === 'NEGOCIOS EN LINEA')
          : cat === activeCategory
      );
      const matchProvince = !activeProvince || prov === activeProvince;
      return matchCategory && matchProvince;
    });
  }, [activeCategory, activeProvince, sponsors]);

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="bg-emerald-800 text-white py-12 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-md">
            {lang === 'en' ? 'Ride Add-ons' : 'Complementos de tu Ride'}
          </h1>
          <div className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed space-y-1">
            <p>
              {lang === 'en' 
                ? 'Discover local businesses that will make your trip unforgettable.' 
                : 'Descubrí negocios locales que harán de tu viaje algo inolvidable.'}
            </p>
            <p>
              {lang === 'en' 
                ? 'See what postcards are nearby!' 
                : '¡Mirá qué postales tienen cerca!'}
            </p>
          </div>

          {/* Gamification Badge: 10 XP Diarios */}
          <div className="pt-4 flex justify-center">
            <button 
              type="button"
              onClick={() => checkAndAwardReward(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 active:scale-95 border border-emerald-400/50 text-xs sm:text-sm font-bold text-emerald-100 shadow-md backdrop-blur-sm cursor-pointer transition-all"
              title={lang === 'en' ? 'Tap to check your daily explorer XP' : 'Toca para verificar tus XPs diarios de explorador'}
            >
              <span>🧭</span>
              <span>
                {lang === 'en'
                  ? 'Daily Explorer Bonus: +10 XP for discovering local spots'
                  : 'Bono Diario de Explorador: +10 XP por descubrir comercios'}
              </span>
              <span className="bg-amber-400 text-amber-950 text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                +10 XP
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">
                {lang === 'en' ? "Province" : "Provincia"}
              </label>
              <div className="relative">
                <select 
                  value={activeProvince || 'Todas'} 
                  onChange={(e) => setActiveProvince(e.target.value === 'Todas' ? null : e.target.value)}
                  className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-2.5 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {provinces.map((prov) => (
                    <option key={prov.id || 'Todas'} value={prov.id || 'Todas'}>{prov.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
              </div>
            </div>
            
            <div className="flex-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">
                {lang === 'en' ? "Category" : "Categoría"}
              </label>
              <div className="relative">
                <select 
                  value={activeCategory} 
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-2.5 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Patrocinadores */}
        {filteredSponsors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSponsors.map(sponsor => (
              <div
                key={sponsor.id}
                id={`sponsor-${sponsor.id}`}
                className={`transition-all duration-700 rounded-2xl scroll-mt-28 ${
                  highlightedSponsorId === sponsor.id
                    ? 'ring-4 ring-emerald-500 shadow-2xl scale-[1.02] bg-emerald-50/40 p-1'
                    : ''
                }`}
              >
                <SponsorCard 
                  sponsor={sponsor} 
                  lang={lang} 
                  variant="compact" 
                  onCardInteraction={() => checkAndAwardReward(true)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-stone-700 mb-2">
              {lang === 'en' ? 'No sponsors found' : 'No encontramos patrocinadores'}
            </h2>
            <p className="text-stone-500">
              {lang === 'en' 
                ? 'Try changing the province or category filters.' 
                : 'Intenta cambiar los filtros de provincia o categoría.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
