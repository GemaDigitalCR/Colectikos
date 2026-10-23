"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, ExternalLink, Image as ImageIcon, MapPin, Phone, Mail, Building2, Check, Compass } from 'lucide-react';
import SponsorForm from '../../../../components/SponsorForm';
import { deleteSponsor } from '../../../../actions/sponsors';
import { resolveLugarImageUrl } from '../../../../utils/postcardImages';

interface SponsorsAdminClientProps {
  initialSponsors: any[];
  availableLugares?: any[];
  lang: string;
}

export default function SponsorsAdminClient({ initialSponsors, availableLugares = [], lang }: SponsorsAdminClientProps) {
  const [sponsors, setSponsors] = useState<any[]>(initialSponsors);
  const [editingSponsor, setEditingSponsor] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingSponsor(null);
    setIsCreating(true);
  };

  const handleEdit = (sponsor: any) => {
    setEditingSponsor(sponsor);
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el patrocinador "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteSponsor(id);
      if (res.success) {
        setSponsors((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(res.error || 'Error al eliminar el patrocinador');
      }
    } catch (e: any) {
      alert(e?.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = (savedSponsor: any) => {
    setSponsors((prev) => {
      const exists = prev.some((s) => s.id === savedSponsor.id);
      if (exists) {
        return prev.map((s) => (s.id === savedSponsor.id ? savedSponsor : s));
      }
      return [savedSponsor, ...prev];
    });
    setIsCreating(false);
    setEditingSponsor(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              Vercel Blob Storage
            </span>
            <span className="px-3 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-full">
              {sponsors.length} Patrocinadores
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Administración de Patrocinadores
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Gestiona los comercios pautados, sube sus 3 fotos a Vercel Blob y configura su alcance nacional.
          </p>
        </div>

        <div>
          {!isCreating ? (
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-98"
            >
              <Plus size={20} />
              <span>Nuevo Patrocinador</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingSponsor(null);
              }}
              className="px-6 py-3 border border-stone-300 bg-white text-stone-700 font-bold rounded-2xl hover:bg-stone-50 transition-colors"
            >
              Volver a la lista
            </button>
          )}
        </div>
      </div>

      {/* Formulario (Modo Crear o Editar) */}
      {isCreating ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-stone-900">
              {editingSponsor ? `Editando: ${editingSponsor.nombre}` : 'Registrar Nuevo Patrocinador'}
            </h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingSponsor(null);
              }}
              className="text-xs font-bold text-stone-500 hover:text-stone-800"
            >
              ✕ Cerrar Formulario
            </button>
          </div>

          <SponsorForm
            initialData={editingSponsor}
            availableLugares={availableLugares}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsCreating(false);
              setEditingSponsor(null);
            }}
          />
        </div>
      ) : (
        /* Lista de Patrocinadores Registrados */
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Patrocinadores Registrados
          </h2>

          {sponsors.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
              <span className="text-4xl mb-3 block">🏪</span>
              <h3 className="text-lg font-bold text-stone-800 mb-1">No hay patrocinadores registrados</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
                Comienza agregando el primer negocio y subiendo sus 3 imágenes a Vercel Blob.
              </p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm"
              >
                Crear Patrocinador
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map((sponsor) => {
                const img1 = sponsor.imagen1 || sponsor.imagenUrl;
                const img2 = sponsor.imagen2 || sponsor.fotoExtra1;
                const img3 = sponsor.imagen3 || sponsor.fotoExtra2;

                return (
                  <div
                    key={sponsor.id}
                    className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Galería de 3 Fotos: Hero Banner superior y 2 fotos interiores Portrait */}
                    <div className="bg-stone-100 p-2 border-b border-stone-200 space-y-1.5">
                      {/* Foto 1 (Hero Banner Superior) */}
                      <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden bg-stone-950 group shadow-2xs">
                        {img1 ? (
                          <>
                            <Image src={img1} alt="" fill className="object-cover blur-md opacity-35 scale-110 pointer-events-none" unoptimized />
                            <Image src={img1} alt={sponsor.nombre} fill className="object-contain relative z-10 p-1" unoptimized />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                            Sin Hero Banner
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 z-20 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          #1 Hero Banner
                        </span>
                      </div>

                      {/* Fotos 2 y 3 (Interiores en Portrait 2:3) */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-stone-950 shadow-2xs">
                          {img2 ? (
                            <>
                              <Image src={img2} alt="" fill className="object-cover blur-md opacity-35 scale-110 pointer-events-none" unoptimized />
                              <Image src={img2} alt="Foto 2" fill className="object-contain relative z-10 p-1" unoptimized />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                              Sin interior 1
                            </div>
                          )}
                          <span className="absolute bottom-1 left-1 z-20 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            #2 Interior (Portrait)
                          </span>
                        </div>

                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-stone-950 shadow-2xs">
                          {img3 ? (
                            <>
                              <Image src={img3} alt="" fill className="object-cover blur-md opacity-35 scale-110 pointer-events-none" unoptimized />
                              <Image src={img3} alt="Foto 3" fill className="object-contain relative z-10 p-1" unoptimized />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                              Sin interior 2
                            </div>
                          )}
                          <span className="absolute bottom-1 left-1 z-20 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            #3 Interior (Portrait)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            {sponsor.categoria}
                          </span>
                          <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                            {sponsor.provincia}
                          </span>
                          {sponsor.alcanceNacional && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              💬 {lang === 'en' ? 'Check zones & availability' : 'Consultá zonas y disponibilidad'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-black text-stone-900 leading-tight">
                            {sponsor.nombre}
                          </h3>
                          <span className="text-xs font-mono font-bold text-stone-400 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                            {sponsor.id}
                          </span>
                        </div>

                        {sponsor.descripcion && (
                          <p className="text-xs text-stone-500 mt-2 line-clamp-2 italic">
                            "{sponsor.descripcion}"
                          </p>
                        )}

                        <div className="mt-3 space-y-1 text-xs text-stone-600">
                          <p className="flex items-center gap-1.5 truncate">
                            <MapPin size={13} className="text-emerald-600 shrink-0" />
                            <span className="truncate">{sponsor.direccion}</span>
                          </p>
                          {sponsor.telefono && (
                            <p className="flex items-center gap-1.5 truncate">
                              <Phone size={13} className="text-emerald-600 shrink-0" />
                              <span>{sponsor.telefono}</span>
                            </p>
                          )}
                          {sponsor.email && (
                            <p className="flex items-center gap-1.5 truncate">
                              <Mail size={13} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{sponsor.email}</span>
                            </p>
                          )}
                        </div>

                        {/* Cápsulas de Destinos En Ruta */}
                        <div className="pt-2 border-t border-stone-100">
                          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between mb-1.5">
                            <span className="flex items-center gap-1">
                              <Compass size={12} className="text-emerald-600" />
                              Destinos En Ruta
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                              {sponsor.SponsorEnRuta?.length || 0}
                            </span>
                          </div>
                          {sponsor.SponsorEnRuta && sponsor.SponsorEnRuta.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                              {sponsor.SponsorEnRuta.map((rel: any) => {
                                const lugar = rel.Lugar;
                                if (!lugar) return null;
                                return (
                                  <span
                                    key={lugar.id}
                                    className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-2xs hover:bg-emerald-100 transition-colors"
                                    title={lugar.ubicacion || lugar.nombre}
                                  >
                                    {lugar.imagenUrl && (
                                      <img
                                        src={resolveLugarImageUrl(lugar)}
                                        alt=""
                                        className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                      />
                                    )}
                                    <span className="truncate max-w-[120px]">{lugar.nombre}</span>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[11px] text-stone-400 italic">
                              Sin destinos en ruta asignados
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
                        <button
                          onClick={() => handleEdit(sponsor)}
                          className="flex-1 py-2 px-3 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit2 size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          disabled={deletingId === sponsor.id}
                          onClick={() => handleDelete(sponsor.id, sponsor.nombre)}
                          className="py-2 px-3 bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-500 font-bold text-xs rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
