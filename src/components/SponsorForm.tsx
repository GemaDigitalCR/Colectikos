"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { UploadCloud, CheckCircle2, AlertCircle, X, Loader2, Sparkles, Image as ImageIcon, Compass, Search, Plus, MapPin } from 'lucide-react';
import { uploadSponsorImage, saveSponsor, SponsorInput } from '../actions/sponsors';

interface ImageSlotState {
  file: File | null;
  preview: string | null;
  existingUrl: string | null;
}

interface SponsorFormProps {
  initialData?: any | null;
  availableLugares?: any[];
  onSuccess?: (sponsor: any) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  { id: 'HOSPEDAJE', label: '🏨 Hospedaje' },
  { id: 'ALIMENTACION', label: '🍽️ Alimentación' },
  { id: 'TOURS', label: '🧭 Tours' },
  { id: 'TRANSPORTE', label: '🚗 Transporte' },
  { id: 'SOUVENIRS', label: '🛍️ Souvenirs' },
  { id: 'NEGOCIOS_EN_LINEA', label: '💻 Negocios en Línea' },
];

const PROVINCES = [
  'SAN JOSE',
  'ALAJUELA',
  'CARTAGO',
  'HEREDIA',
  'GUANACASTE',
  'PUNTARENAS',
  'LIMON',
];

export default function SponsorForm({ initialData, availableLugares = [], onSuccess, onCancel }: SponsorFormProps) {
  // Datos del formulario
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    nombre: initialData?.nombre || '',
    provincia: initialData?.provincia || 'SAN JOSE',
    categoria: initialData?.categoria || 'ALIMENTACION',
    direccion: initialData?.direccion || '',
    telefono: initialData?.telefono || '',
    email: initialData?.email || '',
    sitioWeb: initialData?.sitioWeb || '',
    descripcion: initialData?.descripcion || '',
    latitude: initialData?.latitude?.toString() || '9.9333',
    longitude: initialData?.longitude?.toString() || '-84.0833',
    alcanceNacional: initialData?.alcanceNacional ?? false,
  });

  // Estado de las 3 imágenes
  const [img1, setImg1] = useState<ImageSlotState>({
    file: null,
    preview: null,
    existingUrl: initialData?.imagen1 || initialData?.imagenUrl || null,
  });
  const [img2, setImg2] = useState<ImageSlotState>({
    file: null,
    preview: null,
    existingUrl: initialData?.imagen2 || initialData?.fotoExtra1 || null,
  });
  const [img3, setImg3] = useState<ImageSlotState>({
    file: null,
    preview: null,
    existingUrl: initialData?.imagen3 || initialData?.fotoExtra2 || null,
  });

  // Estados de carga y progreso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Destinos En Ruta (Cápsulas de Destino)
  const [selectedLugarIds, setSelectedLugarIds] = useState<string[]>(() => {
    if (!initialData) return [];
    if (initialData.SponsorEnRuta && Array.isArray(initialData.SponsorEnRuta)) {
      return initialData.SponsorEnRuta.map((rel: any) => rel.lugarId || rel.Lugar?.id).filter(Boolean);
    }
    return [];
  });
  const [destinationSearch, setDestinationSearch] = useState('');
  const [destinationProvinceFilter, setDestinationProvinceFilter] = useState<string>('TODAS');
  const [showAllDestinations, setShowAllDestinations] = useState(false);

  useEffect(() => {
    if (initialData?.SponsorEnRuta && Array.isArray(initialData.SponsorEnRuta)) {
      setSelectedLugarIds(initialData.SponsorEnRuta.map((rel: any) => rel.lugarId || rel.Lugar?.id).filter(Boolean));
    } else if (!initialData) {
      setSelectedLugarIds([]);
    }
  }, [initialData]);

  // Mapa de lugares disponibles para lookup rápido O(1)
  const lugaresMap = useMemo(() => {
    const map = new Map<string, any>();
    availableLugares.forEach((l) => {
      map.set(l.id, l);
    });
    return map;
  }, [availableLugares]);

  // Lista de objetos completos de los destinos seleccionados
  const selectedLugares = useMemo(() => {
    return selectedLugarIds.map((id) => lugaresMap.get(id) || { id, nombre: id, ubicacion: '' }).filter(Boolean);
  }, [selectedLugarIds, lugaresMap]);

  // Destinos para mostrar en el selector (filtrados y excluyendo los ya seleccionados)
  const filteredAvailableLugares = useMemo(() => {
    const query = destinationSearch.trim().toLowerCase();

    return availableLugares.filter((lugar) => {
      if (selectedLugarIds.includes(lugar.id)) return false;

      if (destinationProvinceFilter !== 'TODAS') {
        const ubi = (lugar.ubicacion || '').toUpperCase();
        if (!ubi.includes(destinationProvinceFilter)) return false;
      }

      if (query) {
        const nameMatch = (lugar.nombre || '').toLowerCase().includes(query);
        const nameEnMatch = (lugar.nombre_en || '').toLowerCase().includes(query);
        const catMatch = (lugar.categoria || '').toLowerCase().includes(query);
        const locMatch = (lugar.ubicacion || '').toLowerCase().includes(query);
        return nameMatch || nameEnMatch || catMatch || locMatch;
      }

      return showAllDestinations || destinationProvinceFilter !== 'TODAS';
    });
  }, [availableLugares, selectedLugarIds, destinationSearch, destinationProvinceFilter, showAllDestinations]);

  const handleAddDestination = (lugarId: string) => {
    if (!selectedLugarIds.includes(lugarId)) {
      setSelectedLugarIds((prev) => [...prev, lugarId]);
    }
  };

  const handleRemoveDestination = (lugarId: string) => {
    setSelectedLugarIds((prev) => prev.filter((id) => id !== lugarId));
  };
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);

  // Manejar cambio de archivos y generar preview local
  const handleFileChange = (slot: 1 | 2 | 3, file: File | null) => {
    if (!file) return;

    // Validación básica de imagen
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un formato de imagen válido (JPG, PNG, WebP).');
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (slot === 1) {
      if (img1.preview) URL.revokeObjectURL(img1.preview);
      setImg1({ file, preview: previewUrl, existingUrl: img1.existingUrl });
    } else if (slot === 2) {
      if (img2.preview) URL.revokeObjectURL(img2.preview);
      setImg2({ file, preview: previewUrl, existingUrl: img2.existingUrl });
    } else if (slot === 3) {
      if (img3.preview) URL.revokeObjectURL(img3.preview);
      setImg3({ file, preview: previewUrl, existingUrl: img3.existingUrl });
    }
    setErrorMessage(null);
  };

  // Limpiar archivo seleccionado
  const handleClearSlot = (slot: 1 | 2 | 3) => {
    if (slot === 1) {
      if (img1.preview) URL.revokeObjectURL(img1.preview);
      setImg1({ file: null, preview: null, existingUrl: null });
      if (fileInputRef1.current) fileInputRef1.current.value = '';
    } else if (slot === 2) {
      if (img2.preview) URL.revokeObjectURL(img2.preview);
      setImg2({ file: null, preview: null, existingUrl: null });
      if (fileInputRef2.current) fileInputRef2.current.value = '';
    } else if (slot === 3) {
      if (img3.preview) URL.revokeObjectURL(img3.preview);
      setImg3({ file: null, preview: null, existingUrl: null });
      if (fileInputRef3.current) fileInputRef3.current.value = '';
    }
  };

  // Limpiar URLs creadas en memoria al desmontar
  useEffect(() => {
    return () => {
      if (img1.preview) URL.revokeObjectURL(img1.preview);
      if (img2.preview) URL.revokeObjectURL(img2.preview);
      if (img3.preview) URL.revokeObjectURL(img3.preview);
    };
  }, [img1.preview, img2.preview, img3.preview]);

  // Envío del formulario con subida a Vercel Blob y guardado en Prisma
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.nombre.trim()) {
      setErrorMessage('El nombre del negocio es requerido.');
      return;
    }
    if (!formData.direccion.trim()) {
      setErrorMessage('La dirección es requerida.');
      return;
    }

    setIsSubmitting(true);
    setProgressPercent(10);
    setProgressMessage('Preparando subida de archivos...');

    try {
      let finalUrl1 = img1.existingUrl;
      let finalUrl2 = img2.existingUrl;
      let finalUrl3 = img3.existingUrl;

      // 1. Subida Imagen 1 a Vercel Blob si hay nuevo archivo
      if (img1.file) {
        setProgressPercent(25);
        setProgressMessage('Subiendo Imagen 1 (Portada) a Vercel Blob...');
        const fd1 = new FormData();
        fd1.append('file', img1.file);
        const res1 = await uploadSponsorImage(fd1);
        if (res1.error || !res1.url) {
          throw new Error(`Error en Imagen 1: ${res1.error || 'Fallo desconocido'}`);
        }
        finalUrl1 = res1.url;
      }

      // 2. Subida Imagen 2 a Vercel Blob si hay nuevo archivo
      if (img2.file) {
        setProgressPercent(50);
        setProgressMessage('Subiendo Imagen 2 (Galería 1) a Vercel Blob...');
        const fd2 = new FormData();
        fd2.append('file', img2.file);
        const res2 = await uploadSponsorImage(fd2);
        if (res2.error || !res2.url) {
          throw new Error(`Error en Imagen 2: ${res2.error || 'Fallo desconocido'}`);
        }
        finalUrl2 = res2.url;
      }

      // 3. Subida Imagen 3 a Vercel Blob si hay nuevo archivo
      if (img3.file) {
        setProgressPercent(75);
        setProgressMessage('Subiendo Imagen 3 (Galería 2) a Vercel Blob...');
        const fd3 = new FormData();
        fd3.append('file', img3.file);
        const res3 = await uploadSponsorImage(fd3);
        if (res3.error || !res3.url) {
          throw new Error(`Error en Imagen 3: ${res3.error || 'Fallo desconocido'}`);
        }
        finalUrl3 = res3.url;
      }

      // 4. Guardar referencias en Prisma
      setProgressPercent(90);
      setProgressMessage('Guardando referencias y datos en Prisma...');

      const sponsorPayload: SponsorInput = {
        id: formData.id ? formData.id.trim() : undefined,
        nombre: formData.nombre.trim(),
        provincia: formData.provincia,
        categoria: formData.categoria,
        direccion: formData.direccion.trim(),
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
        sitioWeb: formData.sitioWeb.trim() || undefined,
        descripcion: formData.descripcion.trim(),
        latitude: parseFloat(formData.latitude) || 9.93,
        longitude: parseFloat(formData.longitude) || -84.08,
        alcanceNacional: formData.alcanceNacional,
        imagen1: finalUrl1,
        imagen2: finalUrl2,
        imagen3: finalUrl3,
        destinosEnRutaIds: selectedLugarIds,
      };

      const saveRes = await saveSponsor(sponsorPayload);

      if (!saveRes.success || !saveRes.sponsor) {
        throw new Error(saveRes.error || 'No se pudo guardar el registro en la base de datos.');
      }

      setProgressPercent(100);
      setProgressMessage('¡Patrocinador guardado con éxito!');
      setSuccessMessage(`El negocio "${saveRes.sponsor.nombre}" fue guardado exitosamente.`);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(saveRes.sponsor);
        }, 800);
      }
    } catch (err: any) {
      console.error('Error procesando formulario:', err);
      setErrorMessage(err?.message || 'Ocurrió un error inesperado al procesar las imágenes o guardar en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper para renderizar cada campo de archivo con su vista previa
  const renderImageSlot = (
    slotNumber: 1 | 2 | 3,
    title: string,
    subtitle: string,
    slotState: ImageSlotState,
    inputRef: React.RefObject<HTMLInputElement | null>,
    orientation: 'banner' | 'portrait' = 'banner'
  ) => {
    const currentSrc = slotState.preview || slotState.existingUrl;
    const aspectClass = orientation === 'portrait' ? 'aspect-[2/3] max-h-[380px]' : 'aspect-[16/7] sm:aspect-[21/9] max-h-[260px]';

    return (
      <div className={`flex flex-col bg-stone-50 border border-stone-200 rounded-2xl p-4 transition-all hover:border-emerald-300 ${orientation === 'banner' ? 'w-full' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
              <span>{slotNumber === 1 ? '🌟' : '📸'}</span>
              <span>{title}</span>
            </h4>
            <p className="text-xs text-stone-500">{subtitle}</p>
          </div>
          {currentSrc && (
            <button
              type="button"
              onClick={() => handleClearSlot(slotNumber)}
              disabled={isSubmitting}
              className="text-stone-400 hover:text-red-500 p-1 rounded-lg transition-colors"
              title="Quitar imagen"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Contenedor de Vista Previa o Zona de Carga */}
        <div className={`relative mt-2 ${aspectClass} w-full rounded-xl overflow-hidden bg-stone-950 border border-dashed border-stone-300 flex items-center justify-center group`}>
          {currentSrc ? (
            <>
              {/* Fondo ambiental difuminado para previsualizar sin cortes */}
              <Image
                src={currentSrc}
                alt=""
                fill
                className="object-cover blur-md opacity-35 scale-110 pointer-events-none"
                unoptimized
              />
              {/* Imagen contenida completa */}
              <Image
                src={currentSrc}
                alt={title}
                fill
                className="object-contain relative z-10 p-1"
                unoptimized
              />
              <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-white/95 text-stone-800 text-xs font-bold rounded-lg shadow-md hover:bg-white"
                >
                  Cambiar archivo
                </button>
              </div>
            </>
          ) : (
            <div 
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center p-4 text-center cursor-pointer w-full h-full hover:bg-stone-200/50 transition-colors"
            >
              <UploadCloud className="w-8 h-8 text-stone-400 mb-1 group-hover:text-emerald-600 transition-colors" />
              <span className="text-xs font-semibold text-stone-600">Subir imagen</span>
              <span className="text-[10px] text-stone-400">JPG, PNG o WebP (máx. 10MB)</span>
            </div>
          )}
        </div>

        {/* Input Oculto */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isSubmitting}
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            handleFileChange(slotNumber, file);
          }}
        />

        {/* Indicador de Estado del Slot */}
        <div className="mt-2 text-[11px] font-medium flex items-center justify-between">
          {slotState.file ? (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <CheckCircle2 size={12} />
              Listo para subir a Vercel Blob ({Math.round(slotState.file.size / 1024)} KB)
            </span>
          ) : slotState.existingUrl ? (
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 truncate max-w-full">
              <ImageIcon size={12} />
              URL activa en almacenamiento
            </span>
          ) : (
            <span className="text-stone-400 italic">Sin imagen asignada</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerta de Error */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="text-sm">
            <p className="font-bold">Error</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Alerta de Éxito */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="text-sm">
            <p className="font-bold">¡Operación Exitosa!</p>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {/* Indicador Visual de Progreso Durante el Envío */}
      {isSubmitting && (
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-sm font-bold text-emerald-900">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              {progressMessage}
            </span>
            <span className="text-emerald-700">{progressPercent}%</span>
          </div>
          <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-emerald-700/80 italic">
            Por favor no cierres la ventana mientras procesamos las imágenes en Vercel Blob.
          </p>
        </div>
      )}

      {/* SECCIÓN 1: FOTOS DEL NEGOCIO (VERCEL BLOB) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              Almacenamiento Vercel Blob (3 Imágenes)
            </h3>
            <p className="text-xs text-stone-500">
              Carga directa a la CDN pública de Vercel Blob. Las URLs se vincularán al modelo en Prisma.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 w-fit">
            access: 'public'
          </span>
        </div>

        {/* Los 3 slots para subir imágenes */}
        <div className="space-y-4">
          {/* Campo Superior: Hero Banner (ancho panorámico) */}
          {renderImageSlot(
            1,
            'Imagen 1 (Hero Banner Superior)',
            'Portada principal amplia de la tarjeta (horizontal)',
            img1,
            fileInputRef1,
            'banner'
          )}

          {/* Campos para Fotografías Interiores (Orientación Portrait) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {renderImageSlot(
              2,
              'Imagen 2 (Interior 1 - Portrait)',
              'Fotografía vertical interior (orientación portrait 3:4)',
              img2,
              fileInputRef2,
              'portrait'
            )}
            {renderImageSlot(
              3,
              'Imagen 3 (Interior 2 - Portrait)',
              'Fotografía vertical complementaria (orientación portrait 3:4)',
              img3,
              fileInputRef3,
              'portrait'
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: INFORMACIÓN GENERAL */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
        <h3 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
          <span>🏪</span>
          Información del Patrocinador
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Nombre Comercial *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej. Café & Aventura Monteverde"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Código / ID de Patrocinador
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="Ej. T0003 (Dejar en blanco para autogenerar)"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Categoría *
            </label>
            <select
              disabled={isSubmitting}
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Provincia *
            </label>
            <select
              disabled={isSubmitting}
              value={formData.provincia}
              onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            >
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alcance Nacional Switch / Checkbox */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-bold text-emerald-950 text-sm">
                Alcance Nacional (Fallback para Destinos)
              </p>
              <p className="text-xs text-emerald-800">
                Muestra la insignia <span className="font-semibold">"💬 Consultá zonas y disponibilidad"</span> y permite rellenar espacios en postales sin comercios locales.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              disabled={isSubmitting}
              checked={formData.alcanceNacional}
              onChange={(e) => setFormData({ ...formData, alcanceNacional: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
            Dirección Física / Ubicación *
          </label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder="Ej. 100m norte del Parque Central, La Fortuna"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej. +506 8888-8888"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              disabled={isSubmitting}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contacto@negocio.com"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Sitio Web / Enlace
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              value={formData.sitioWeb}
              onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
              placeholder="https://minegocio.cr"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>
        </div>

        {/* Coordenadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Latitud (GPS)
            </label>
            <input
              type="number"
              step="any"
              disabled={isSubmitting}
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder="9.9333"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Longitud (GPS)
            </label>
            <input
              type="number"
              step="any"
              disabled={isSubmitting}
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder="-84.0833"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
            Descripción del Negocio / Reseña
          </label>
          <textarea
            rows={3}
            disabled={isSubmitting}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Breve reseña atractiva para los exploradores de Colectikos..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
          />
        </div>
      </div>

      {/* SECCIÓN 3: DESTINOS Y PARADAS EN RUTA (CÁPSULAS DE DESTINO) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              <span>Destinos y Paradas En Ruta</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                {selectedLugarIds.length} {selectedLugarIds.length === 1 ? 'destino asignado' : 'destinos asignados'}
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Vincula las postales hacia las cuales este patrocinador es una parada o complemento estratégico. Aparecerá destacado en <strong className="text-stone-700">Complementos de tu Ride</strong> y en los planes de viaje de los exploradores.
            </p>
          </div>
        </div>

        {/* 1. Cápsulas de Destinos Ya Asignados */}
        <div>
          <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-2">
            Cápsulas Asignadas a este Patrocinador
          </label>

          {selectedLugares.length > 0 ? (
            <div className="flex flex-wrap gap-2.5 p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 min-h-[60px]">
              {selectedLugares.map((lugar: any) => (
                <div
                  key={lugar.id}
                  className="group inline-flex items-center gap-2 bg-white pl-1.5 pr-2.5 py-1.5 rounded-2xl border border-emerald-200 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden relative bg-stone-100 shrink-0 border border-stone-200 shadow-2xs">
                    {lugar.imagenUrl ? (
                      <img
                        src={lugar.imagenUrl.includes('/images/Postales_Provincias/') ? lugar.imagenUrl.toLowerCase() : lugar.imagenUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">🏞️</div>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black text-stone-800 leading-tight">
                      {lugar.nombre}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <span>•</span> {lugar.ubicacion || lugar.categoria}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleRemoveDestination(lugar.id)}
                    className="ml-1 p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title={`Remover ${lugar.nombre}`}
                    aria-label={`Remover ${lugar.nombre}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-stone-50/60 rounded-2xl border border-dashed border-stone-300 text-center">
              <p className="text-xs text-stone-500 font-medium">
                🧭 Aún no has asignado ningún destino en ruta. Busca abajo los hitos clave para vincularlos.
              </p>
            </div>
          )}
        </div>

        {/* 2. Buscador y Selector para Añadir Más Destinos */}
        <div className="pt-2 border-t border-stone-100 space-y-3">
          <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block">
            Añadir Destino a la Ruta
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                disabled={isSubmitting}
                value={destinationSearch}
                onChange={(e) => setDestinationSearch(e.target.value)}
                placeholder="Buscar destino por nombre (ej. Arenal, Poás, Manuel Antonio)..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
              />
              {destinationSearch && (
                <button
                  type="button"
                  onClick={() => setDestinationSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              disabled={isSubmitting}
              value={destinationProvinceFilter}
              onChange={(e) => setDestinationProvinceFilter(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="TODAS">Todas las Provincias</option>
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* Resultados de búsqueda */}
          {filteredAvailableLugares.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 scrollbar-thin">
              {filteredAvailableLugares.map((lugar: any) => (
                <button
                  type="button"
                  key={lugar.id}
                  disabled={isSubmitting}
                  onClick={() => handleAddDestination(lugar.id)}
                  className="flex items-center gap-2 p-2 bg-stone-50 hover:bg-emerald-50/80 border border-stone-200/80 hover:border-emerald-300 rounded-xl text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden relative bg-stone-200 shrink-0">
                    {lugar.imagenUrl && (
                      <img
                        src={lugar.imagenUrl.includes('/images/Postales_Provincias/') ? lugar.imagenUrl.toLowerCase() : lugar.imagenUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate group-hover:text-emerald-800">
                      {lugar.nombre}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">
                      {lugar.ubicacion || lugar.categoria}
                    </p>
                  </div>
                  <span className="p-1 rounded-lg bg-white border border-stone-200 text-stone-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors shrink-0">
                    <Plus size={12} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            !showAllDestinations && !destinationSearch && destinationProvinceFilter === 'TODAS' ? (
              <div className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <p className="text-xs text-amber-900 font-medium">
                  💡 Escribe un nombre en el buscador o elige una provincia para ver destinos.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllDestinations(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs whitespace-nowrap"
                >
                  Ver todos los destinos ({availableLugares.length})
                </button>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic text-center py-2">
                No se encontraron destinos disponibles con ese criterio.
              </p>
            )
          )}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 border border-stone-300 text-stone-700 font-bold rounded-2xl hover:bg-stone-50 transition-colors"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-98"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando Vercel Blob...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <span>{initialData ? 'Actualizar Patrocinador' : 'Guardar Patrocinador'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
