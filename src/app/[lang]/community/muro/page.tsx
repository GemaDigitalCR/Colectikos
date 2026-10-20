"use client";

import React, { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  PawPrint, 
  Calendar, 
  Filter, 
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  X,
  Compass,
  MessageSquare,
  Award,
  ShieldAlert,
  EyeOff,
  Edit3,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { getPublicReviews, PublicReviewItem } from '../../../../actions/progress';
import { 
  checkIsAdmin, 
  toggleReviewVisibilityAdmin, 
  editReviewTextAdmin, 
  deleteReviewNoteAdmin 
} from '../../../../actions/moderation';
import { useDictionary } from '../../../../context/DictionaryContext';
import toast, { Toaster } from 'react-hot-toast';

interface MuroPageProps {
  params: Promise<{ lang: string }>;
}

export default function MuroExploradoresPage({ params }: MuroPageProps) {
  const dict = useDictionary();
  const [lang, setLang] = useState('es');
  const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Moderación Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingReview, setEditingReview] = useState<PublicReviewItem | null>(null);
  const [editText, setEditText] = useState('');
  const [isPendingAction, setIsPendingAction] = useState(false);

  const LIMIT = 12;

  useEffect(() => {
    params.then(p => setLang(p.lang || 'es'));
    checkIsAdmin().then(setIsAdmin);
  }, [params]);

  const provinces = useMemo(() => [
    { id: 'ALL', label: lang === 'en' ? 'All Provinces' : 'Todas las Provincias' },
    { id: 'SAN JOSE', label: 'San José' },
    { id: 'ALAJUELA', label: 'Alajuela' },
    { id: 'CARTAGO', label: 'Cartago' },
    { id: 'HEREDIA', label: 'Heredia' },
    { id: 'GUANACASTE', label: 'Guanacaste' },
    { id: 'PUNTARENAS', label: 'Puntarenas' },
    { id: 'LIMON', label: 'Limón' },
  ], [lang]);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const reqIdRef = useRef(0);

  const categories = useMemo(() => [
    { id: 'ALL', label: lang === 'en' ? 'All Categories' : 'Todas las Categorías', icon: '🇨🇷' },
    { id: 'PARQUE_NACIONAL', label: lang === 'en' ? 'National Parks' : 'Parques Nacionales', icon: '🌲' },
    { id: 'VOLCAN', label: lang === 'en' ? 'Volcanoes' : 'Volcanes', icon: '🌋' },
    { id: 'PLAYA', label: lang === 'en' ? 'Beaches' : 'Playas', icon: '🏖️' },
    { id: 'RIOS_Y_CATARATAS', label: lang === 'en' ? 'Rivers & Waterfalls' : 'Ríos y Cataratas', icon: '💧' },
    { id: 'LAGUNAS', label: lang === 'en' ? 'Lagoons' : 'Lagunas', icon: '🏞️' },
    { id: 'BOSQUES_RESERVAS', label: lang === 'en' ? 'Forests & Reserves' : 'Bosques y Reservas', icon: '🌳' },
    { id: 'CIUDAD_Y_CULTURA', label: lang === 'en' ? 'City & Culture' : 'Ciudad y Cultura', icon: '🏛️' },
  ], [lang]);

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, { es: string; en: string }> = {
      PARQUE_NACIONAL: { es: 'Parque Nacional', en: 'National Park' },
      VOLCAN: { es: 'Volcán', en: 'Volcano' },
      PLAYA: { es: 'Playa', en: 'Beach' },
      RIOS_Y_CATARATAS: { es: 'Ríos y Cataratas', en: 'Rivers & Waterfalls' },
      LAGUNAS: { es: 'Laguna', en: 'Lagoon' },
      BOSQUES_RESERVAS: { es: 'Bosques y Reservas', en: 'Forests & Reserves' },
      CIUDAD_Y_CULTURA: { es: 'Ciudad y Cultura', en: 'City & Culture' },
      PROVINCIA: { es: 'Provincia', en: 'Province' },
    };
    return map[cat] ? (lang === 'en' ? map[cat].en : map[cat].es) : cat.replace(/_/g, ' ');
  };

  // Debounce solo para el input de texto del buscador
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Carga inmediata ante cualquier cambio de filtro
  useEffect(() => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setReviews([]); // Limpiar inmediatamente las reseñas previas para que no queden datos obsoletos mientras carga

    getPublicReviews({
      search: debouncedSearch,
      provincia: selectedProvince !== 'ALL' ? selectedProvince : undefined,
      categoria: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      sortBy,
      limit: LIMIT,
      offset: 0,
    }).then(res => {
      if (reqId !== reqIdRef.current) return; // Descartar respuestas de peticiones obsoletas
      if (res.success) {
        setReviews(res.reviews);
        setTotalCount(res.totalCount);
        setHasMore(res.hasMore);
        setOffset(LIMIT);
      } else {
        setReviews([]);
        setTotalCount(0);
        setHasMore(false);
      }
    }).catch(err => {
      if (reqId !== reqIdRef.current) return;
      console.error('Error fetching reviews:', err);
      setReviews([]);
      setTotalCount(0);
      setHasMore(false);
    }).finally(() => {
      if (reqId === reqIdRef.current) {
        setLoading(false);
      }
    });
  }, [debouncedSearch, selectedProvince, selectedCategory, sortBy]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const reqId = reqIdRef.current;
    try {
      const res = await getPublicReviews({
        search: debouncedSearch,
        provincia: selectedProvince !== 'ALL' ? selectedProvince : undefined,
        categoria: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        sortBy,
        limit: LIMIT,
        offset,
      });
      if (reqId === reqIdRef.current && res.success) {
        setReviews(prev => [...prev, ...res.reviews]);
        setOffset(prev => prev + LIMIT);
        setTotalCount(res.totalCount);
        setHasMore(res.hasMore);
      }
    } catch (e) {
      console.error('Error loading more reviews:', e);
    } finally {
      if (reqId === reqIdRef.current) {
        setLoadingMore(false);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedProvince('ALL');
    setSelectedCategory('ALL');
    setSortBy('recent');
  };

  // Acciones de Moderación Admin
  const handleAdminUnpublish = async (review: PublicReviewItem) => {
    if (!confirm(`¿Deseas despublicar la reseña de @${review.username}? Será removida inmediatamente del Muro Comunitario.`)) {
      return;
    }

    // Optimista: quitar de la vista pública de inmediato
    setReviews(prev => prev.filter(r => r.id !== review.id));
    setTotalCount(prev => Math.max(0, prev - 1));

    const res = await toggleReviewVisibilityAdmin(review.id, false);
    if (res.success) {
      toast.success('🚫 Reseña despublicada con éxito. Ya no es visible en el Muro.');
    } else {
      toast.error(res.error || 'Error al despublicar reseña');
    }
  };

  const handleAdminOpenEdit = (review: PublicReviewItem) => {
    setEditingReview(review);
    setEditText(review.notas);
  };

  const handleAdminSaveEdit = async () => {
    if (!editingReview) return;
    if (editText.trim() === '') {
      toast.error('El texto no puede quedar vacío. Para eliminarla, usa el botón de borrar.');
      return;
    }

    setIsPendingAction(true);
    try {
      const res = await editReviewTextAdmin(editingReview.id, editText.trim());
      if (res.success) {
        toast.success('Texto de la reseña actualizado correctamente');
        setReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, notas: editText.trim() } : r));
        setEditingReview(null);
      } else {
        toast.error(res.error || 'Error al guardar cambios');
      }
    } finally {
      setIsPendingAction(false);
    }
  };

  const handleAdminDelete = async (review: PublicReviewItem) => {
    if (!confirm(`¿Deseas ELIMINAR permanentemente la nota del explorador @${review.username}?`)) {
      return;
    }

    setReviews(prev => prev.filter(r => r.id !== review.id));
    setTotalCount(prev => Math.max(0, prev - 1));

    const res = await deleteReviewNoteAdmin(review.id);
    if (res.success) {
      toast.success('Nota eliminada permanentemente');
    } else {
      toast.error(res.error || 'Error al eliminar nota');
    }
  };

  const isFiltered = searchQuery !== '' || selectedProvince !== 'ALL' || selectedCategory !== 'ALL' || sortBy !== 'recent';

  return (
    <main 
      className="flex-1 w-full min-h-screen pb-20 relative"
      style={{
        backgroundImage: 'url("/images/Imagenes_Pagina/fondo_pagina.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-500 mb-4">
          <Link href={`/${lang}/community`} className="hover:text-emerald-700 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            <span>{lang === 'en' ? 'Community' : 'Comunidad'}</span>
          </Link>
          <span>/</span>
          <span className="text-emerald-800 font-bold">{lang === 'en' ? 'Explorer Wall' : 'Muro de Exploradores'}</span>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-8 border border-emerald-600/30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-bold uppercase tracking-wider rounded-full mb-3 shadow-sm">
              <Sparkles size={14} className="text-amber-300" />
              <span>{lang === 'en' ? 'Community Logbook' : 'Bitácora Colectika'}</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
              {lang === 'en' ? 'Explorer Wall' : 'Muro de Exploradores'}
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              {lang === 'en'
                ? 'Authentic travel notes, secret spots, and honest reviews shared by Costa Rican adventurers.'
                : 'Consejos auténticos, miradores secretos y recuerdos reales compartidos por exploradores de toda Costa Rica.'}
            </p>

            {isAdmin && (
              <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-stone-900 text-xs font-black rounded-lg uppercase tracking-wider shadow-sm">
                  🛡️ Modo Moderador Activo
                </span>
                <Link 
                  href={`/${lang}/admin/resenas`}
                  className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Panel de Moderación Admin</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Controls & Filter Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-md border border-stone-200/80 mb-8 space-y-4">
          
          {/* Search bar & Sort selector */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'en' ? 'Search by destination, advice, or explorer...' : 'Buscar por destino, tip de viaje o explorador...'}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider hidden sm:inline">
                {lang === 'en' ? 'Sort:' : 'Ordenar:'}
              </span>
              <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSortBy('recent')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortBy === 'recent' 
                      ? 'bg-white text-emerald-800 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {lang === 'en' ? 'Most Recent' : 'Más Recientes'}
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('rating')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortBy === 'rating' 
                      ? 'bg-white text-emerald-800 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {lang === 'en' ? 'Top Rated' : 'Mejor Calificadas'}
                </button>
              </div>
            </div>
          </div>

          {/* Provinces Horizontal Scroll Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <MapPin size={12} /> {lang === 'en' ? 'Filter by Province' : 'Filtrar por Provincia'}
              </span>
              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                >
                  {lang === 'en' ? 'Reset Filters' : 'Limpiar Filtros'}
                </button>
              )}
            </div>
            {/* Mobile Dropdown for Province */}
            <div className="block md:hidden w-full pb-2">
              <div className="relative">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full appearance-none bg-stone-50 text-stone-800 font-bold text-xs py-2.5 pl-8 pr-8 rounded-xl border border-stone-200/90 shadow-2xs focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {provinces.map(prov => (
                    <option key={prov.id} value={prov.id}>
                      📍 {prov.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                  <MapPin size={14} />
                </div>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Desktop Pills for Province */}
            <div className="hidden md:flex gap-1.5 flex-wrap pb-2">
              {provinces.map(prov => {
                const active = selectedProvince === prov.id;
                return (
                  <button
                    key={prov.id}
                    onClick={() => setSelectedProvince(prov.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 border border-stone-200/60'
                    }`}
                  >
                    {prov.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories Filters */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1 mb-1.5">
              <Compass size={12} /> {lang === 'en' ? 'Filter by Category' : 'Filtrar por Categoría'}
            </span>

            {/* Mobile Dropdown for Category */}
            <div className="block md:hidden w-full pb-1">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none bg-stone-50 text-stone-800 font-bold text-xs py-2.5 pl-8 pr-8 rounded-xl border border-stone-200/90 shadow-2xs focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base leading-none">
                  {categories.find(c => c.id === selectedCategory)?.icon || '🌍'}
                </div>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Desktop Pills for Category */}
            <div className="hidden md:flex gap-1.5 flex-wrap pb-1">
              {categories.map(cat => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      active
                        ? 'bg-stone-800 text-white shadow-sm font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80 border border-stone-200/60'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-5 px-1">
          <p className="text-xs sm:text-sm font-semibold text-stone-500">
            {loading ? (
              <span>{lang === 'en' ? 'Searching reviews...' : 'Buscando reseñas...'}</span>
            ) : (
              <span>
                {lang === 'en' ? 'Showing ' : 'Mostrando '}
                <strong className="text-stone-800">{reviews.length}</strong>
                {lang === 'en' ? ` of ${totalCount} public reviews` : ` de ${totalCount} reseñas públicas`}
              </span>
            )}
          </p>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div key={sk} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-full"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                    <div className="h-3 bg-stone-100 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-20 bg-stone-100 rounded-xl"></div>
                <div className="h-16 bg-stone-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State */
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-14 text-center border border-stone-200 shadow-sm max-w-lg mx-auto my-8">
            <div className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-4xl mb-4 border border-emerald-100">
              🦥
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">
              {lang === 'en' ? 'No reviews found' : 'Aún no hay reseñas aquí'}
            </h3>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              {isFiltered
                ? (lang === 'en' 
                    ? 'No reviews match your current filters. Try resetting them or searching for another place.' 
                    : 'No encontramos reseñas con los filtros seleccionados. Probá limpiando los filtros o buscando otro destino.')
                : (lang === 'en'
                    ? 'Be the first explorer to share a tip! Unlock a postcard, open "My Notes", and toggle on "Colectikos Community".'
                    : '¡Sé el primer explorador en compartir un consejo! Desbloqueá una postal, abrí "Mis Notas" y seleccioná "Comunidad Colectikos".')}
            </p>
            {isFiltered ? (
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Clear all filters' : 'Limpiar todos los filtros'}
              </button>
            ) : (
              <Link
                href={`/${lang}`}
                className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition-all"
              >
                {lang === 'en' ? 'Explore album' : 'Explorar álbum'}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((rev) => {
              const isLong = rev.notas.length > 180;
              const isExpanded = Boolean(expandedNotes[rev.id]);
              const displayNote = isLong && !isExpanded ? `${rev.notas.slice(0, 180)}...` : rev.notas;
              const formattedDate = rev.fechaCompletado 
                ? new Date(rev.fechaCompletado).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-CR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : null;

              return (
                <div 
                  key={rev.id} 
                  className="bg-white rounded-2xl p-5 shadow-md border border-stone-200/90 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">

                    {/* Admin Moderation Toolbar */}
                    {isAdmin && (
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-amber-800 flex items-center gap-1 text-[11px]">
                          🛡️ Moderar:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdminUnpublish(rev)}
                            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Despublicar inmediatamente del Muro"
                          >
                            <EyeOff size={13} />
                            <span>Despublicar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminOpenEdit(rev)}
                            className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg font-bold transition-colors cursor-pointer shadow-sm"
                            title="Censurar palabras o modificar texto"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminDelete(rev)}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-bold transition-colors cursor-pointer shadow-sm"
                            title="Eliminar la nota permanentemente"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Header: User Profile */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {rev.avatarUrl ? (
                          <img 
                            src={rev.avatarUrl} 
                            alt={rev.username} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm flex items-center justify-center shadow-sm uppercase">
                            {rev.username.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm leading-tight flex items-center gap-1.5">
                            <span>@{rev.username}</span>
                          </h4>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100">
                            <Award size={10} /> {lang === 'en' ? `Level ${rev.userLevel}` : `Nivel ${rev.userLevel}`}
                          </span>
                        </div>
                      </div>

                      {/* Calificación en patitas */}
                      {rev.ratingScore && rev.ratingScore > 0 ? (
                        <div className="flex items-center gap-0.5 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100" title={`Calificación: ${rev.ratingScore}/4`}>
                          {[1, 2, 3, 4].map(paw => (
                            <PawPrint 
                              key={paw} 
                              size={14} 
                              className={paw <= (rev.ratingScore || 0) ? "text-emerald-500 fill-emerald-500" : "text-stone-200"}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Destination Banner */}
                    <div className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 group-hover:border-emerald-200 transition-colors">
                      {rev.lugarImagenUrl ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-stone-200 border border-stone-100">
                          <Image 
                            src={rev.lugarImagenUrl} 
                            alt={rev.lugarNombre}
                            fill
                            sizes="60px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-emerald-100/50 flex items-center justify-center text-xl shrink-0">
                          🇨🇷
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 block truncate">
                          {getCategoryLabel(rev.lugarCategoria)}
                        </span>
                        <h3 className="font-bold text-stone-800 text-sm leading-snug truncate" title={rev.lugarNombre}>
                          {lang === 'en' && rev.lugarNombreEn ? rev.lugarNombreEn : rev.lugarNombre}
                        </h3>
                        <p className="text-[11px] text-stone-400 flex items-center gap-1 truncate mt-0.5">
                          <MapPin size={10} className="shrink-0 text-cyan-600" />
                          <span className="truncate">{rev.lugarUbicacion}</span>
                        </p>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="pt-1">
                      <p className="text-stone-700 text-sm leading-relaxed italic font-serif relative pl-3 border-l-2 border-emerald-400">
                        "{displayNote}"
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(rev.id)}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-1 cursor-pointer block"
                        >
                          {isExpanded ? (lang === 'en' ? 'Show less' : 'Ver menos') : (lang === 'en' ? 'Read full note' : 'Leer nota completa')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{formattedDate ? `${lang === 'en' ? 'Visited on' : 'Visita:'} ${formattedDate}` : (lang === 'en' ? 'Visited' : 'Visitado')}</span>
                    </span>

                    <Link 
                      href={`/${lang}#lugar-${rev.lugarId}`}
                      className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
                    >
                      <span>{lang === 'en' ? 'View destination' : 'Ver en álbum'}</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && (
          <div className="mt-10 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3.5 bg-white hover:bg-stone-50 text-emerald-700 font-bold rounded-2xl shadow-md border border-stone-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loadingMore 
                ? (lang === 'en' ? 'Loading more reviews...' : 'Cargando más reseñas...') 
                : (lang === 'en' ? `Load More (${totalCount - reviews.length} remaining)` : `Cargar más reseñas (${totalCount - reviews.length} restantes)`)}
            </button>
          </div>
        )}

        {/* Modal de Moderación / Censura de Texto */}
        {editingReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Edit3 size={18} />
                  </span>
                  <h3 className="text-lg font-bold text-stone-900">
                    Moderar / Censurar Reseña
                  </h3>
                </div>
                <button 
                  onClick={() => setEditingReview(null)}
                  className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Modificá o eliminá palabras indebidas en la reseña pública de <strong>@{editingReview.username}</strong>:
              </p>

              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                className="w-full p-3 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-serif leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdminSaveEdit}
                  disabled={isPendingAction}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPendingAction ? 'Guardando...' : 'Guardar y Censurar'}
                </button>
              </div>
            </div>
          </div>
        )}

        <Toaster position="bottom-right" />
      </div>
    </main>
  );
}
