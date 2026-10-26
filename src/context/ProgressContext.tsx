"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import LevelUpModal from '../components/LevelUpModal';
import StreakCelebrationModal from '../components/StreakCelebrationModal';
import NudgeToast from '../components/NudgeToast';
import OnboardingModal from '../components/OnboardingModal';
import { calcularNivel } from '../utils/gamification';
import { useLugaresData } from './LugaresContext';
import { getAllCommunityRatings } from '../actions/ratings';
import { checkInAndAwardXP, rateAndAwardXP, getUserGamification, recordDailyLogin, toggleBucketListAndAwardXP } from '../actions/gamification';
import { toast as sonnerToast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { updateUserProgressNote, getUserProgress, removeUserProgress, updateUserBucketList } from '../actions/progress';
import { getUserProfile } from '../actions/user';
import { isSameCRDay } from '../lib/dateUtils';
interface ProgressContextType {
  completedPlaces: string[];
  placeDetails: Record<string, { date: string; note: string; isPublic?: boolean }>;
  unlockModes: Record<string, string>;
  handleCheckIn: (id: string) => Promise<number>;
  handleCheckInWithMode: (id: string, mode: string) => Promise<number>;
  updatePlaceDetails: (id: string, date: string, note: string, isPublic?: boolean) => void;
  bucketList: string[];
  toggleBucketList: (id: string) => void;
  communityRatings: Record<string, number>;
  userRatings: Record<string, number>;
  xp: number;
  level: number;
  currentStreak: number;
  estampillas: number;
  hasReceivedBonusToday: boolean;
  hasRefundedTicketToday: boolean;
  handleRate: (id: string, score: number) => Promise<void>;
  userProfile: any;
  showTour: boolean;
  setShowTour: (val: boolean) => void;
  updateLocalXp?: (newXp: number, newLevel: number) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

import { useDictionary } from './DictionaryContext';

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completedPlaces, setCompletedPlaces] = useState<string[]>([]);
  const [placeDetails, setPlaceDetails] = useState<Record<string, { date: string; note: string; isPublic?: boolean }>>({});
  const [unlockModes, setUnlockModes] = useState<Record<string, string>>({});
  const [bucketList, setBucketList] = useState<string[]>([]);
  const [communityRatings, setCommunityRatings] = useState<Record<string, number>>({});
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRankTitle, setNewRankTitle] = useState('');
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [pendingNudge, setPendingNudge] = useState<string | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [estampillas, setEstampillas] = useState(3);
  const [hasReceivedBonusToday, setHasReceivedBonusToday] = useState(false);
  const [hasRefundedTicketToday, setHasRefundedTicketToday] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showTour, setShowTour] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { user, isLoaded: clerkLoaded } = useUser();
  const dbLugares = useLugaresData();
  const dict = useDictionary();
  const hasLoadedRef = useRef(false);

  // Prevención visual de "Ghosting" de datos:
  // Si el usuario cambia o cierra sesión, limpiamos localStorage para que no se muestren datos del usuario anterior.
  useEffect(() => {
    if (typeof window !== 'undefined' && clerkLoaded) {
      const lastUserId = localStorage.getItem('lastClerkUserId');
      if (user?.id) {
        if (lastUserId && lastUserId !== user.id) {
          // El usuario cambió (ej. de iCloud a Hotmail) usando UserButton
          localStorage.removeItem('colectikos_progress');
          localStorage.removeItem('colectikos_place_details');
          localStorage.removeItem('colectikos_bucket_list');
          localStorage.removeItem('colectikos_unlock_modes');
          localStorage.removeItem('colectikos_user_ratings');
          localStorage.removeItem('tico100_progress');
          localStorage.removeItem('tico100_place_details');
          localStorage.removeItem('tico100_bucket_list');
          localStorage.removeItem('tico100_unlock_modes');
          localStorage.removeItem('userProfileData');
          localStorage.removeItem('hasSeenColectikosTour');
          localStorage.removeItem('hasSeenTicos100Tour');
        }
        localStorage.setItem('lastClerkUserId', user.id);
      } else if (!user && lastUserId) {
        // La sesión expiró o se eliminó la cuenta
        localStorage.removeItem('colectikos_progress');
        localStorage.removeItem('colectikos_place_details');
        localStorage.removeItem('colectikos_bucket_list');
        localStorage.removeItem('colectikos_unlock_modes');
        localStorage.removeItem('colectikos_user_ratings');
        localStorage.removeItem('tico100_progress');
        localStorage.removeItem('tico100_place_details');
        localStorage.removeItem('tico100_bucket_list');
        localStorage.removeItem('tico100_unlock_modes');
        localStorage.removeItem('hasSeenColectikosTour');
        localStorage.removeItem('hasSeenTicos100Tour');
        localStorage.removeItem('userProfileData');
        localStorage.removeItem('lastClerkUserId');
        
        // Mostrar notificación al usuario
        setTimeout(() => {
          sonnerToast('Tu sesión ha expirado', {
            description: 'Inicia sesión nuevamente para recuperar tu progreso guardado.',
            duration: 6000,
          });
        }, 500);
        
        // REINICIAR el ref para que si vuelve a iniciar sesión sin refrescar la página, vuelva a cargar los datos
        hasLoadedRef.current = false;
        setUserProfile(null);
      }
    }
  }, [user?.id, clerkLoaded, user]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const saved = localStorage.getItem('userProfileData');
        if (saved) {
          setUserProfile(JSON.parse(saved));
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.error("Error reading updated profile from localStorage", e);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    if (!clerkLoaded) return;
    
    // Si no hay usuario logueado, no cargamos progreso de la DB ni bloqueamos el ref
    if (!user) return;

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadProgress = async () => {
      // 1. Cargar rápido de localStorage (UI instantánea)
      try {
        const saved = localStorage.getItem('colectikos_progress') || localStorage.getItem('tico100_progress');
        if (saved) {
          setCompletedPlaces(JSON.parse(saved));
        }
        const savedDetails = localStorage.getItem('colectikos_place_details') || localStorage.getItem('tico100_place_details');
        if (savedDetails) {
          setPlaceDetails(JSON.parse(savedDetails));
        }
        const savedBucketList = localStorage.getItem('colectikos_bucket_list') || localStorage.getItem('tico100_bucket_list');
        if (savedBucketList) {
          setBucketList(JSON.parse(savedBucketList));
        }
        const savedUnlockModes = localStorage.getItem('colectikos_unlock_modes') || localStorage.getItem('tico100_unlock_modes');
        if (savedUnlockModes) {
          setUnlockModes(JSON.parse(savedUnlockModes));
        }
        const savedUserRatings = localStorage.getItem('colectikos_user_ratings') || localStorage.getItem('tico100_user_ratings');
        if (savedUserRatings) {
          setUserRatings(JSON.parse(savedUserRatings));
        }
      } catch (e) {
        console.error("Error accessing localStorage", e);
      }

      // 2. Sincronizar con la Base de Datos (PostgreSQL) si hay usuario logueado
      const token = localStorage.getItem('token');
      
      let localUsername = user?.username || undefined;
      const profileData = localStorage.getItem('userProfileData');
      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          if (parsed.username) localUsername = parsed.username;
        } catch (e) {}
      }

      try {
        const gamificationData = await getUserGamification(localUsername, user?.id);
        if (gamificationData) {
          setXp(gamificationData.xp);
          setLevel(gamificationData.level);
          setEstampillas(gamificationData.estampillas);
          if (gamificationData.onboardingCompleted === false) {
            setShowOnboarding(true);
          }
          if (gamificationData.fechaBonoTicket) {
            const lastBonus = new Date(gamificationData.fechaBonoTicket);
            const now = new Date();
            if (isSameCRDay(now, lastBonus)) {
              setHasReceivedBonusToday(true);
            }
          }
          if (gamificationData.fechaDevolucionTicket) {
            const lastRefund = new Date(gamificationData.fechaDevolucionTicket);
            const now = new Date();
            if (isSameCRDay(now, lastRefund)) {
              setHasRefundedTicketToday(true);
            }
          }
          if (gamificationData.bucketList) {
            setBucketList(gamificationData.bucketList);
          }
        }
      } catch (e) {
        console.error("Error fetching gamification data", e);
      }

      try {
        const progressRes = await getUserProgress(localUsername, user?.id);
        if (progressRes.success && progressRes.checkins) {
          const dbCompleted: string[] = [];
          const dbDetails: Record<string, { date: string; note: string; isPublic?: boolean }> = {};
          
          progressRes.checkins.forEach((item: any) => {
            dbCompleted.push(item.lugarId);
            if (item.notas || item.fechaCompletado || item.esPublico !== undefined) {
              dbDetails[item.lugarId] = {
                date: item.fechaCompletado ? new Date(item.fechaCompletado).toISOString().split('T')[0] : '',
                note: item.notas || '',
                isPublic: Boolean(item.esPublico)
              };
            }
          });

          setCompletedPlaces(dbCompleted);
          
          setPlaceDetails(prev => {
            const merged: Record<string, { date: string; note: string; isPublic?: boolean }> = { ...prev };
            Object.entries(dbDetails).forEach(([placeId, dbItem]) => {
              const localItem = merged[placeId];
              if (dbItem.note && dbItem.note.trim() !== '') {
                merged[placeId] = dbItem;
              } else if (localItem && localItem.note && localItem.note.trim() !== '') {
                // Preservar la nota local y actualizar fecha si la BD la tiene
                merged[placeId] = {
                  date: dbItem.date || localItem.date || '',
                  note: localItem.note,
                  isPublic: localItem.isPublic ?? dbItem.isPublic ?? false
                };
                // Sincronizar en segundo plano a la BD para no perder el dato
                updateUserProgressNote(placeId, localItem.note, merged[placeId].date, localUsername, user?.id, merged[placeId].isPublic).catch(console.error);
              } else {
                merged[placeId] = dbItem;
              }
            });
            try {
              localStorage.setItem('colectikos_place_details', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });

          if (progressRes.userRatings) {
            const parsedRatings: Record<string, number> = {};
            progressRes.userRatings.forEach((ur: any) => {
              parsedRatings[ur.placeId] = ur.score;
            });
            setUserRatings(prev => ({ ...prev, ...parsedRatings }));
          }
        }
      } catch (e) {
        console.error("Error fetching progress from db", e);
      }

      try {
        const profileRes = await getUserProfile(localUsername, user.id);
        if (profileRes.success && profileRes.user) {
          const dbUser = profileRes.user;
          const hydratedProfile = {
            username: dbUser.username,
            avatarUrl: dbUser.avatarUrl || '',
            gender: dbUser.genero || '',
            ageRange: dbUser.rangoEdad || '',
            location: dbUser.provinciaResidencia || '',
            favoritePlace: dbUser.lugarFavorito || '',
            favoriteCategory: dbUser.tipoLugarPreferido || '',
            travelStyle: dbUser.estiloViaje || '',
            travelCompany: dbUser.companiaHabitual || ''
          };
          console.log("HYDRATING PROFILE IN CONTEXT:", hydratedProfile);
          localStorage.setItem('userProfileData', JSON.stringify(hydratedProfile));
          setUserProfile(hydratedProfile);
          window.dispatchEvent(new Event('profileUpdated'));
        }
      } catch (e) {
        console.error("Error fetching user profile from db", e);
      }
      
      // 3. Obtener calificaciones de la comunidad para todos los lugares de un solo golpe (Lazy Bulk Fetch)
      try {
        const ratings = await getAllCommunityRatings();
        if (ratings) {
          setCommunityRatings(ratings);
        }
      } catch (e) {
        console.error("Error fetching community ratings", e);
      }
      
      // 4. Registrar Ingreso Diario (Daily Login Streak)
      if (token || localUsername) {
        try {
          const rawLoginRes = await recordDailyLogin(localUsername, user?.id);
          const loginRes = rawLoginRes as any;
          if (loginRes?.success) {
            setCurrentStreak(loginRes.currentStreak || 0);
            
            // Trigger Milestone Celebration
            if (loginRes.streakUpdated && [5, 10, 15, 20].includes(loginRes.currentStreak)) {
              setStreakMilestone(loginRes.currentStreak);
              setShowStreakModal(true);
            }
            
            if (loginRes.xpAwarded && loginRes.xpAwarded > 0) {
              if ('newTotalXp' in loginRes && loginRes.newTotalXp !== undefined) {
                setXp(loginRes.newTotalXp);
              }
              if ('newLevel' in loginRes && loginRes.newLevel !== undefined) {
                setLevel(loginRes.newLevel);
              }
              
              sonnerToast.success(`¡Bienvenido de vuelta! Racha de ${loginRes.currentStreak} días 🔥. +${loginRes.xpAwarded} XP ganados`, {
                position: 'top-center',
                duration: 5000,
              });
            }
          }
        } catch (e) {
          console.error("Error al registrar daily login", e);
        }
      }

      setIsLoaded(true);
    };

    loadProgress();
  }, [clerkLoaded, user]);

  useEffect(() => {
    // Guardar en localStorage cuando cambie, solo después de cargar
    if (isLoaded) {
      localStorage.setItem('colectikos_progress', JSON.stringify(completedPlaces));
      localStorage.setItem('colectikos_place_details', JSON.stringify(placeDetails));
      localStorage.setItem('colectikos_bucket_list', JSON.stringify(bucketList));
      localStorage.setItem('colectikos_unlock_modes', JSON.stringify(unlockModes));
      localStorage.setItem('colectikos_user_ratings', JSON.stringify(userRatings));
    }
  }, [completedPlaces, placeDetails, bucketList, unlockModes, userRatings, isLoaded]);

  const toggleBucketList = async (id: string) => {
    const isAdding = !bucketList.includes(id);

    if (isAdding && bucketList.length >= 4) {
      toast.error(dict?.toast?.bucketListLimit || 'Solo puedes tener 4 próximos destinos en tu lista. Desmarca uno para agregar este.', { id: 'bucket-limit' });
      return;
    }

    // Optimistic UI update
    const optimisticList = isAdding 
      ? [...bucketList, id] 
      : bucketList.filter(placeId => placeId !== id);
    setBucketList(optimisticList);

    try {
      let localUsername = user?.username || undefined;
      const profileData = localStorage.getItem('userProfileData');
      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          if (parsed.username) localUsername = parsed.username;
        } catch (e) {}
      }
      if (!localUsername) {
        localUsername = localStorage.getItem('localUsername') || undefined;
      }

      const res = await toggleBucketListAndAwardXP(id, localUsername, user?.id) as any;
      if (res && res.success) {
        if (res.newList) {
          setBucketList(res.newList);
        }
        if (res.xpAwarded && res.xpAwarded > 0) {
          setXp(res.newTotalXp || (xp + res.xpAwarded));
          setLevel(res.newLevel || level);

          const currentPlace = dbLugares.find(l => l.id === id);
          const placeName = currentPlace?.nombre || '';
          
          sonnerToast.success(`¡Próximo destino marcado! +${res.xpAwarded} XP 🚩`, {
            description: placeName 
              ? `Agregaste ${placeName} a tu lista de viaje.`
              : 'Guardado en tu lista de próximos viajes.',
          });
        }
      } else if (res && !res.success && res.error === 'limit_reached') {
        toast.error(dict?.toast?.bucketListLimit || 'Solo puedes tener 4 próximos destinos en tu lista. Desmarca uno para agregar este.', { id: 'bucket-limit' });
        setBucketList(bucketList); // rollback
      }
    } catch (e) {
      console.error("Error saving bucket list to backend", e);
    }
  };

  const handleCheckInWithMode = async (id: string, mode: string) => {
    setUnlockModes(prev => ({ ...prev, [id]: mode }));
    return await handleCheckIn(id, mode);
  };

  const handleRate = async (id: string, score: number) => {
    try {
      let localUsername = user?.username || undefined;
      const profileData = localStorage.getItem('userProfileData');
      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          if (parsed.username) localUsername = parsed.username;
        } catch (e) {}
      }
      if (!localUsername) {
        localUsername = localStorage.getItem('localUsername') || undefined;
      }

      const rawRes = await rateAndAwardXP(id, score, localUsername, user?.id);
      const res = rawRes as any;
      
      if (res.success && 'xpAwarded' in res) {
        setUserRatings(prev => ({ ...prev, [id]: score }));
        if (res.bonusAwarded) {
          setEstampillas(prev => prev + 1);
          setHasReceivedBonusToday(true);
          const bonusMsg = dict?.categories?.ALL === 'All' 
            ? "🎟️ Otico gave you a Bonus Ticket for reviewing today!" 
            : "🎟️ ¡Otico te regaló un Tiquete de Bono por tu reseña de hoy!";
          sonnerToast.success(bonusMsg, { duration: 6000 });
        }

        if (res.xpAwarded && res.xpAwarded > 0) {
          setXp(res.newTotalXp || xp);
          setLevel(res.newLevel || level);
          sonnerToast.success(`¡Calificación registrada! +${res.xpAwarded} XP`, {
            description: `Tu XP total: ${res.newTotalXp} (Nivel ${res.newLevel})`
          });
        } else if (res.limitReached) {
          sonnerToast.info(dict?.gamification?.toastRatingLimit || "¡Qué gran aporte a la comunidad! 🗣️ Ya ganaste todo el XP posible por tus 3 primeras calificaciones de hoy. Podés seguir dejando tus estrellas para recomendar lugares, pero los XP regresarán hasta mañana.", {
            duration: 8000
          });
        } else {
          // Ya lo había calificado hoy (no da puntos) pero fue exitoso
          sonnerToast.success('¡Calificación guardada!', {
            description: 'Las actualizaciones de calificación no otorgan XP extra.'
          });
        }
      } else if (!res.success && 'error' in res) {
        console.error("rateAndAwardXP Error:", res.error);
        sonnerToast.error(`Error: ${res.error}`);
      }
    } catch (error) {
      console.error('Error al calificar lugar:', error);
      sonnerToast.error('No se pudo guardar la calificación.');
    }
  };

  const handleCheckIn = async (id: string, customMode?: string) => {
    const isRemoving = completedPlaces.includes(id);
    const newState = isRemoving 
      ? completedPlaces.filter(placeId => placeId !== id)
      : [...completedPlaces, id];

    if (isRemoving) {
      try {
        let localUsername = user?.username || undefined;
        const profileData = localStorage.getItem('userProfileData');
        if (profileData) {
          try {
            const parsed = JSON.parse(profileData);
            if (parsed.username) localUsername = parsed.username;
          } catch (e) {}
        }
        const res = await removeUserProgress(id, localUsername, user?.id);
        if (res.success) {
          if (res.refundedTicket) {
            setHasRefundedTicketToday(true);
            setEstampillas(e => e + 1);
          }
          if (res.newTotalXp !== undefined) {
            setXp(res.newTotalXp);
          }
          if (res.newLevel !== undefined) {
            setLevel(res.newLevel);
          }
        }
      } catch (e) {
        console.error("Error removing progress", e);
      }
    }

    // Animaciones de recompensa solo cuando se añade un lugar nuevo
    if (!isRemoving) {
      // Remover del bucket list si está presente
      setBucketList(prev => prev.filter(placeId => placeId !== id));

      // Extraer género para textos dinámicos (Tico/Tica)
      let userGender = 'MASCULINO';
      try {
        const profileData = localStorage.getItem('userProfileData');
        if (profileData) {
          const parsed = JSON.parse(profileData);
          if (parsed.gender && parsed.gender.toUpperCase() === 'FEMENINO') {
            userGender = 'FEMENINO';
          }
        }
      } catch (e) {}
      
      const ticoLabel = userGender === 'FEMENINO' ? 'Tica' : 'Tico';

      // Lógica de Primera Postal (Global y por Categoría)
      const currentPlace = dbLugares.find(l => l.id === id);
      
      if (currentPlace) {
        const cat = currentPlace.categoria;
        const placesInCat = dbLugares.filter(l => l.categoria === cat);
        const completedInCat = placesInCat.filter(l => completedPlaces.includes(l.id));

        if (completedPlaces.length === 0) {
          const rawMsg = dict?.toast?.firstGlobal || `¡Felicidades! Has iniciado tu colección en Colectikos. 🎉`;
          toast.success(rawMsg.replace('{tico}', ticoLabel), { icon: '🇨🇷', id: 'first-global' });
        } else if (completedInCat.length === 0) {
          const label = dict?.categories?.[cat] || cat;
          const toastMsg = dict?.toast?.firstCat?.replace('{category}', label) || `¡Primer paso en ${label}! Has iniciado esta categoría. 🌟`;
          toast.success(toastMsg, { icon: '🏆', id: `first-${cat}` });
        }
      }

      // Detectar subida de nivel
      const baseLugares = dbLugares.filter(l => l.categoria !== 'PROVINCIA');
      const totalGlobal = baseLugares.length;
      const oldPercentage = Math.round((baseLugares.filter(l => completedPlaces.includes(l.id)).length / totalGlobal) * 100) || 0;
      const newPercentage = Math.round((baseLugares.filter(l => newState.includes(l.id)).length / totalGlobal) * 100) || 0;
      
      const { titulo: oldTitle } = calcularNivel(oldPercentage, userGender, dict?.levels);
      const { titulo: newTitle } = calcularNivel(newPercentage, userGender, dict?.levels);

      let willShowLevelUp = false;
      if (newTitle !== oldTitle) {
        setNewRankTitle(newTitle);
        setShowLevelUp(true);
        willShowLevelUp = true;
      }

      // Nudge variant logic
      if (currentPlace && currentPlace.grupo_variante) {
        const twin = dbLugares.find(l => l.grupo_variante === currentPlace.grupo_variante && l.id !== currentPlace.id);
        if (twin && !newState.includes(twin.id)) { // only suggest if twin is NOT collected yet
          const twinCategoryLabel = dict?.categories?.[twin.categoria] || twin.categoria;
          let nudgeMsg = dict?.toast?.nudgeVariant || "¡Felicidades! Si hiciste una visita completa, recuerda que también puedes desbloquear la postal de este destino en la categoría {Categoria_Gemela}.";
          nudgeMsg = nudgeMsg.replace("{Categoria_Gemela}", twinCategoryLabel);
          
          if (willShowLevelUp) {
            setPendingNudge(nudgeMsg);
          } else {
            setNudgeMessage(nudgeMsg);
            setShowNudge(true);
          }
        }
      }
      
      // DISPARAR SERVER ACTION XP Y BD
      try {
        let localUsername = user?.username || undefined;
        const profileData = localStorage.getItem('userProfileData');
        if (profileData) {
          try {
            const parsed = JSON.parse(profileData);
            if (parsed.username) localUsername = parsed.username;
          } catch (e) {}
        }

        const modeToSave = customMode || unlockModes[id] || 'CURIOSO';
        const rawRes = await checkInAndAwardXP(id, modeToSave, localUsername, user?.id);
        const res = rawRes as any;
        
        if (res.success && 'xpAwarded' in res) {
          if (res.updatedBucketList) {
            setBucketList(res.updatedBucketList);
          }
          if (res.newTotalXp !== undefined) {
            setXp(res.newTotalXp);
          } else if (res.xpAwarded && res.xpAwarded > 0) {
            setXp(prev => prev + res.xpAwarded);
          }
          if (res.newLevel !== undefined) {
            setLevel(res.newLevel);
          }

          const titleRaw = dict?.toast?.destinationDiscovered || `¡Destino descubierto! +{xp} XP`;
          const descRaw = dict?.toast?.totalXp || `Tu XP total: {total} (Nivel {level})`;
          const finalTitle = titleRaw.replace('{xp}', (res.xpAwarded || 0).toString());
          const finalDesc = descRaw
            .replace('{total}', (res.newTotalXp || xp).toString())
            .replace('{level}', (res.newLevel || level).toString());

          if (res.xpAwarded && res.xpAwarded > 0) {
            sonnerToast.success(finalTitle, {
              description: finalDesc,
            });
          }

          // Bono de Próximo Destino cumplido (+10 XP)
          if (res.bucketListBonus && res.bucketListBonus > 0) {
            setTimeout(() => {
              sonnerToast.success(`¡Bono de Próximo Destino cumplido! +${res.bucketListBonus} XP 🎯`, {
                description: 'Completaste un destino que tenías planificado en tu lista.',
              });
            }, 700);
          } else if (res.limitReached) {
            sonnerToast.info(dict?.gamification?.toastPostcardLimit || "¡Llevala suave y disfruta el paisaje! 🌴 Ya alcanzaste el límite de XP de hoy. A partir de tu cuarta postal ya no sumás XP, pero podés seguir coleccionando y sumando descubrimientos a tu álbum. ¡Mañana recargamos el XP!", {
              duration: 8000
            });
          }
          setCompletedPlaces(newState);
          setEstampillas(prev => prev - 1);
          return res.unlocksToday;
        } else if (!res.success && 'error' in res) {
          if (res.error === 'no_energy') {
            const noEnergyMsg = dict?.categories?.ALL === 'All' 
              ? "Otico is taking a nap. Come back tomorrow to get 3 new stamps." 
              : "Otico está tomando una siesta. Vuelve mañana para recibir 3 estampillas nuevas.";
            sonnerToast.error(noEnergyMsg, { icon: '💤', duration: 5000 });
            return 0; // aborta y no añade al album
          }
          console.error("checkInAndAwardXP Error:", res.error);
          sonnerToast.error(`Error: ${res.error}`);
        }
      } catch (err) {
        console.error("Error llamando a checkInAndAwardXP:", err);
        sonnerToast.error(`Excepción: ${err}`);
      }
    }

    setCompletedPlaces(newState);
    return 0;
  };

  const updatePlaceDetails = async (id: string, date: string, note: string, isPublic?: boolean) => {
    // 1. Actualización optimista inmediata en estado local y en localStorage
    setPlaceDetails(prev => {
      const existing = prev[id];
      const finalIsPublic = isPublic !== undefined ? isPublic : (existing?.isPublic ?? false);
      const updated = {
        ...prev,
        [id]: { date, note, isPublic: finalIsPublic }
      };
      try {
        localStorage.setItem('colectikos_place_details', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Persistencia asíncrona en la Base de Datos
    try {
      let localUsername = user?.username || undefined;
      const profileData = localStorage.getItem('userProfileData');
      if (profileData) {
        try {
          const parsed = JSON.parse(profileData);
          if (parsed.username) localUsername = parsed.username;
        } catch (e) {}
      }
      if (!localUsername) {
        localUsername = localStorage.getItem('localUsername') || undefined;
      }
      
      const finalIsPublic = isPublic !== undefined ? isPublic : (placeDetails[id]?.isPublic ?? false);
      const res = await updateUserProgressNote(id, note, date, localUsername, user?.id, finalIsPublic);

      if (!res.success) {
        console.error('Error al persistir la bitácora en la BD', res.error);
        sonnerToast.error('Aviso: Tu nota se guardó en este dispositivo, pero hubo un detalle sincronizando con la nube.');
      }
    } catch (e) {
      console.error('Error de red al guardar la bitácora', e);
      sonnerToast.error('Aviso: Error de conexión. Tu nota se guardó localmente y se sincronizará al reconectar.');
    }
  };

  const updateLocalXp = (newXp: number, newLevel: number) => {
    setXp(newXp);
    setLevel(newLevel);
  };

  return (
    <ProgressContext.Provider value={{ completedPlaces, placeDetails, unlockModes, bucketList, handleCheckIn, handleCheckInWithMode, updatePlaceDetails, toggleBucketList, communityRatings, userRatings, xp, level, currentStreak, estampillas, hasReceivedBonusToday, hasRefundedTicketToday, handleRate, userProfile, showTour, setShowTour, updateLocalXp }}>
      {children}
      {showOnboarding && <OnboardingModal onCompleted={() => setShowOnboarding(false)} />}
      <LevelUpModal 
        isOpen={showLevelUp} 
        onClose={() => {
          setShowLevelUp(false);
          if (pendingNudge) {
            setTimeout(() => {
              setNudgeMessage(pendingNudge);
              setShowNudge(true);
              setPendingNudge(null);
            }, 500);
          }
        }} 
        newRank={newRankTitle}
      />
      <StreakCelebrationModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streak={streakMilestone}
      />
      <NudgeToast 
        isVisible={showNudge} 
        message={nudgeMessage} 
        onClose={() => setShowNudge(false)} 
      />
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
