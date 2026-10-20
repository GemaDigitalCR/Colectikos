"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldAlert, 
  Search, 
  EyeOff, 
  Eye, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  PawPrint, 
  Calendar, 
  User, 
  RefreshCw, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { 
  getReviewsForAdminDashboard, 
  toggleReviewVisibilityAdmin, 
  editReviewTextAdmin, 
  deleteReviewNoteAdmin, 
  AdminReviewEntry 
} from '../../../../actions/moderation';
import toast, { Toaster } from 'react-hot-toast';

interface AdminResenasProps {
  params: Promise<{ lang: string }>;
}

export default function AdminResenasPage({ params }: AdminResenasProps) {
  const [lang, setLang] = useState('es');
  const [reviews, setReviews] = useState<AdminReviewEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalPublic: 0, totalPrivate: 0, totalWithNotes: 0 });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'private'>('all');

  // Modal de edición / censura
  const [editingReview, setEditingReview] = useState<AdminReviewEntry | null>(null);
  const [editText, setEditText] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    params.then(p => setLang(p.lang || 'es'));
  }, [params]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getReviewsForAdminDashboard({
        search: debouncedSearch,
        status: statusFilter,
        limit: 100,
      });

      if (res.success) {
        setReviews(res.reviews);
        setTotalCount(res.totalCount);
        setStats(res.stats);
      } else {
        toast.error(res.error || 'Error cargando reseñas');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de red al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [debouncedSearch, statusFilter]);

  // Acción: Despublicar / Republicar
  const handleToggleVisibility = async (review: AdminReviewEntry) => {
    const newStatus = !review.esPublico;
    const actionName = newStatus ? 'publicar en la comunidad' : 'despublicar y censurar del muro';

    if (!confirm(`¿Estás seguro de que deseas ${actionName} esta reseña?`)) return;

    // Actualización optimista
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, esPublico: newStatus } : r));
    setStats(prev => ({
      ...prev,
      totalPublic: newStatus ? prev.totalPublic + 1 : prev.totalPublic - 1,
      totalPrivate: newStatus ? prev.totalPrivate - 1 : prev.totalPrivate + 1,
    }));

    const res = await toggleReviewVisibilityAdmin(review.id, newStatus);
    if (res.success) {
      toast.success(newStatus ? 'Reseña aprobada y visible en el Muro' : '🚫 Reseña despublicada. Ya NO es visible para la comunidad.');
    } else {
      toast.error(res.error || 'No se pudo actualizar el estado');
      loadReviews(); // Revertir en caso de error
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (review: AdminReviewEntry) => {
    setEditingReview(review);
    setEditText(review.notas);
  };

  // Guardar edición de texto
  const handleSaveEdit = async () => {
    if (!editingReview) return;
    if (editText.trim() === '') {
      toast.error('El texto no puede quedar vacío. Si deseas eliminar la nota, usa el botón de borrar.');
      return;
    }

    startTransition(async () => {
      const res = await editReviewTextAdmin(editingReview.id, editText.trim());
      if (res.success) {
        toast.success('Texto de la reseña actualizado correctamente');
        setReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, notas: editText.trim() } : r));
        setEditingReview(null);
      } else {
        toast.error(res.error || 'Error al guardar cambios');
      }
    });
  };

  // Acción: Borrar nota
  const handleDeleteNote = async (review: AdminReviewEntry) => {
    if (!confirm(`¿Estás seguro de ELIMINAR permanentemente la nota del usuario @${review.username}? Esta acción no se puede deshacer.`)) {
      return;
    }

    // Actualización optimista
    setReviews(prev => prev.filter(r => r.id !== review.id));

    const res = await deleteReviewNoteAdmin(review.id);
    if (res.success) {
      toast.success('Nota eliminada permanentemente');
      loadReviews();
    } else {
      toast.error(res.error || 'Error al eliminar nota');
      loadReviews();
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <Toaster position="bottom-right" />

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <ShieldAlert size={20} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Panel de Control Administrativo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Moderación de Reseñas y Contenido
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Revisá, censurá o despublicá notas de la comunidad que no cumplan con las normas de Colectikos.
          </p>
        </div>

        <button 
          onClick={loadReviews}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Estadísticas de Moderación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total de Notas</p>
            <h3 className="text-2xl font-black text-stone-800 mt-1">{stats.totalWithNotes}</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">Escritas por exploradores</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
            📝
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Públicas en el Muro</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.totalPublic}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">Visibles para todos los usuarios</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg">
            🌐
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Privadas / Ocultas</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{stats.totalPrivate}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">Solo para el autor o despublicadas</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg">
            🔒
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuario, email, destino o texto..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filtro de estado */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-full sm:w-auto text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex-1 sm:flex-none ${
              statusFilter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Todas ({stats.totalWithNotes})
          </button>
          <button
            onClick={() => setStatusFilter('public')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex-1 sm:flex-none flex items-center justify-center gap-1 ${
              statusFilter === 'public' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>🌐 Públicas</span>
            <span>({stats.totalPublic})</span>
          </button>
          <button
            onClick={() => setStatusFilter('private')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex-1 sm:flex-none flex items-center justify-center gap-1 ${
              statusFilter === 'private' ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>🔒 Privadas</span>
            <span>({stats.totalPrivate})</span>
          </button>
        </div>
      </div>

      {/* Lista de Reseñas */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200/90 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400 space-y-3">
            <RefreshCw size={24} className="animate-spin mx-auto text-stone-400" />
            <p className="text-sm font-semibold">Cargando registro de reseñas...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <p className="text-4xl">📭</p>
            <h4 className="font-bold text-stone-700">No hay reseñas con los filtros seleccionados</h4>
            <p className="text-xs text-stone-400">Probá buscando con otro término o limpiando los filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {reviews.map((rev) => (
              <div 
                key={rev.id}
                className={`p-5 transition-colors ${
                  rev.esPublico ? 'hover:bg-emerald-50/20' : 'bg-stone-50/40 hover:bg-stone-100/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Columna Izquierda: Autor y Destino */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {rev.avatarUrl ? (
                        <img 
                          src={rev.avatarUrl} 
                          alt={rev.username} 
                          className="w-10 h-10 rounded-full object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center uppercase">
                          {rev.username.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">@{rev.username}</span>
                          <span className="text-xs text-stone-400">({rev.name})</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">
                            Nivel {rev.userLevel}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 truncate">{rev.email}</p>
                      </div>
                    </div>

                    {/* Destino */}
                    <div className="flex items-center gap-2.5 p-2 bg-stone-100/70 rounded-xl border border-stone-200/60 max-w-md">
                      {rev.lugarImagenUrl ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-stone-200">
                          <Image src={rev.lugarImagenUrl} alt={rev.lugarNombre} fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-sm flex items-center justify-center shrink-0">
                          🇨🇷
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-stone-800 truncate">{rev.lugarNombre}</h4>
                        <p className="text-[10px] text-stone-400 truncate flex items-center gap-1">
                          <MapPin size={10} /> {rev.lugarUbicacion} • <span className="font-bold text-emerald-700">{rev.lugarCategoria}</span>
                        </p>
                      </div>
                    </div>

                    {/* Texto de la reseña */}
                    <div className="p-3 bg-white rounded-xl border border-stone-200 text-sm text-stone-800 font-serif italic shadow-inner relative pl-4 border-l-4 border-l-emerald-500">
                      "{rev.notas}"
                    </div>

                    {/* Metadatos */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400">
                      {rev.fechaCompletado && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(rev.fechaCompletado).toLocaleDateString()}
                        </span>
                      )}
                      {rev.ratingScore ? (
                        <span className="flex items-center gap-1">
                          <PawPrint size={12} className="text-emerald-500 fill-emerald-500" /> {rev.ratingScore}/4 patitas
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Columna Derecha: Estado y Botones de Acción de Moderación */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    
                    {/* Badge de visibilidad */}
                    {rev.esPublico ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                        <CheckCircle2 size={13} />
                        <span>Pública en Muro</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                        <EyeOff size={13} />
                        <span>Privada / Oculta</span>
                      </span>
                    )}

                    {/* Grupo de Acciones */}
                    <div className="flex items-center gap-2">
                      {/* Despublicar / Republicar */}
                      <button
                        onClick={() => handleToggleVisibility(rev)}
                        title={rev.esPublico ? "Despublicar y censurar del muro público" : "Hacer pública esta reseña"}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          rev.esPublico 
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {rev.esPublico ? (
                          <>
                            <EyeOff size={15} />
                            <span className="hidden sm:inline">Despublicar</span>
                          </>
                        ) : (
                          <>
                            <Eye size={15} />
                            <span className="hidden sm:inline">Publicar</span>
                          </>
                        )}
                      </button>

                      {/* Editar / Censurar palabras */}
                      <button
                        onClick={() => handleOpenEdit(rev)}
                        title="Modificar texto o censurar palabras"
                        className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Borrar completamente */}
                      <button
                        onClick={() => handleDeleteNote(rev)}
                        title="Eliminar la nota permanentemente"
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {rev.esPublico && (
                      <Link 
                        href={`/${lang}/community/muro`}
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        target="_blank"
                      >
                        <span>Ver en Muro de Exploradores</span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edición / Censura */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Edit3 size={18} />
                </span>
                <h3 className="text-lg font-bold text-stone-900">
                  Moderar / Censurar Texto
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
              Modificá o eliminá palabras indebidas en la reseña de <strong>@{editingReview.username}</strong> sobre <strong>{editingReview.lugarNombre}</strong>:
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
                onClick={handleSaveEdit}
                disabled={isPending}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
