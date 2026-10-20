"use client";

import React, { useState, useEffect } from 'react';
import { 
  Camera, MapPin, User, Users, Backpack, Coffee, Mountain, 
  Award, ChevronRight, ChevronLeft, Map, Tent, Palmtree, ChevronDown, Globe, Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import LevelUpModal from './LevelUpModal';
import AvatarSelector from './AvatarSelector';
import { useDictionary } from '../context/DictionaryContext';
import { useProgress } from '../context/ProgressContext';
import { updateUserProfile } from '../actions/user';
import { useUser } from '@clerk/nextjs';

// Interfaces
export interface FormData {
  avatarType?: string; // Mantengo este por si acaso
  avatarUrl?: string;
  username: string;
  gender: string;
  ageRange: string;
  location: string;
  favoritePlace: string;
  favoriteCategory: string;
  travelStyle: string;
  travelCompany: string;
}

interface ProfileFormProps {
  initialData?: Partial<FormData>;
}

export default function ProfileForm({ initialData = {} }: ProfileFormProps) {
  const dict = useDictionary();
  const formDict = dict?.settingsForm;
  const { xp, level } = useProgress();
  const { user } = useUser();

  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const router = useRouter();
  const [showMedal, setShowMedal] = useState(false);
  const [hasMedal, setHasMedal] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [residenceType, setResidenceType] = useState<'local' | 'visitor'>(
    initialData.location && !['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'].includes(initialData.location) 
      ? 'visitor' 
      : 'local'
  );
  
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('userProfileData');
      if (saved) {
        setHasMedal(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      console.log("ProfileForm -> Received initialData:", initialData);
      setFormData(prev => {
        const nextData = {
          ...prev,
          ...initialData,
          avatarType: initialData.avatarType || prev.avatarType,
          avatarUrl: initialData.avatarUrl || prev.avatarUrl,
          username: initialData.username || prev.username,
          gender: initialData.gender || prev.gender,
          ageRange: initialData.ageRange || prev.ageRange,
          location: initialData.location || prev.location,
          favoritePlace: initialData.favoritePlace || prev.favoritePlace,
          favoriteCategory: initialData.favoriteCategory || prev.favoriteCategory,
          travelStyle: initialData.travelStyle || prev.travelStyle,
          travelCompany: initialData.travelCompany || prev.travelCompany
        };
        console.log("ProfileForm -> Updating formData to:", nextData);
        return nextData;
      });
    }
  }, [initialData]);

  
  const [formData, setFormData] = useState<FormData>({
    avatarType: initialData.avatarType || 'default',
    avatarUrl: initialData.avatarUrl || '',
    username: initialData.username || '',
    gender: initialData.gender || '',
    ageRange: initialData.ageRange || '',
    location: initialData.location || '',
    favoritePlace: initialData.favoritePlace || '',
    favoriteCategory: initialData.favoriteCategory || '',
    travelStyle: initialData.travelStyle || '',
    travelCompany: initialData.travelCompany || ''
  });

  const updateForm = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'username') setUsernameError('');
  };

  const handleNext = async () => {
    if (step === 1 && !hasMedal) {
      if (!formData.username.trim()) {
        setUsernameError(formDict?.usernameErrorEmpty || 'Falta el Nombre de Coleccionista.');
        return;
      }
      // Ya no verificamos disponibilidad porque Clerk garantiza unicidad y el campo es de solo lectura.
    }
    
    setStep(prev => Math.min(prev + 1, totalSteps));
  };
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));
  const handleFinalSubmit = async () => {
    // Protección extra: asegurar que solo se envíe si estamos en el paso 3
    if (step !== totalSteps) {
      return;
    }
    
    console.log("Enviando datos del perfil:", formData);
    // Guardar en localStorage para persistencia local temporal
    localStorage.setItem('userProfileData', JSON.stringify(formData));
    
    // Guardar en Base de Datos (Prisma) usando Server Action
    try {
      const res = await updateUserProfile(formData, formData.username, user?.id);
      if (!res.success) {
        console.warn("Error guardando en BD (Prisma):", res.error);
      }
    } catch (error) {
      console.warn("Error llamando a updateUserProfile, usando fallback de localStorage.", error);
    }

    // Notificar a otros componentes (como Navbar) que el perfil se actualizó
    window.dispatchEvent(new Event('profileUpdated'));

    if (hasMedal) {
      toast.success(formDict?.successMessage || (dict?.lang === 'en' ? 'Thank you for updating your profile. Keep collecting.' : 'Gracias por actualizar tu perfil. Continúa coleccionando.'));
      router.push(`/${dict?.lang === 'en' ? 'en' : 'es'}/profile`);
    } else {
      // Simular guardado y otorgar medalla por primera vez
      setShowMedal(true);
    }
  };

  // Progreso calculado en base al paso actual y campos llenados
  const calculateProgress = () => {
    let filled = 0;
    const fields = Object.values(formData);
    fields.forEach(val => {
      if (val !== '') filled++;
    });
    return Math.round((filled / fields.length) * 100);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Tarjeta Contenedora Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        
        {/* Cabecera y Barra de Progreso */}
        <div className="bg-stone-50 p-6 border-b border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-stone-800 tracking-tight">{formDict?.title || 'Configura tu Perfil'}</h2>
              <p className="text-sm text-stone-500 mt-1">
                {formDict?.subtitle || 'Completa tu perfil para personalizar tu experiencia.'}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {/* Indicador de Nivel XP */}
              <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 shadow-sm">
                <div className="bg-amber-400 text-stone-900 font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {level}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-amber-700 leading-tight">{(dict?.lang === 'en' ? 'Level' : 'Nivel')} {level}</p>
                  <p className="text-amber-600 text-xs font-semibold">{xp} XP</p>
                </div>
              </div>

              {/* Mensaje Motivacional / Medalla */}
              {hasMedal ? (
              <div className="hidden sm:flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                  <Award size={20} />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-emerald-700 leading-tight">{formDict?.medalEarned || 'Medalla Obtenida'}</p>
                  <p className="text-emerald-600 text-xs">{formDict?.identityReady || 'Identidad Lista 🎖️'}</p>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                  <Award size={20} />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-amber-700 leading-tight">{formDict?.medalPending || 'Medalla Pendiente'}</p>
                  <p className="text-amber-600 text-xs">{formDict?.completeToEarn || '¡Completa el perfil para ganarla!'}</p>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          <p className="text-xs font-semibold text-emerald-600 text-right">{calculateProgress()}% {formDict?.completed || 'Completado'}</p>
        </div>

        {/* Contenido del Formulario */}
        <div className="p-6">
          
          {/* PASO 1: Identidad */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-lg font-bold text-stone-700 border-b pb-2">{formDict?.step1 || 'Paso 1: Tu Identidad'}</h3>
              
              {/* Nombre de Coleccionista */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-sm font-semibold text-stone-700">{formDict?.usernameLabel || 'Tu Nombre de Coleccionista'}</label>
                  <span className="text-xs text-amber-600 font-medium">{formDict?.permanentData || 'Dato permanente'}</span>
                </div>
                <input 
                  type="text"
                  placeholder={formDict?.usernamePlaceholder || 'Ej. Coleccionista19'}
                  value={formData.username}
                  onChange={(e) => updateForm('username', e.target.value)}
                  disabled={true}
                  className="w-full p-3 border rounded-xl focus:outline-none transition-shadow bg-stone-100 text-stone-500 cursor-not-allowed border-stone-200"
                />
                {usernameError && <p className="text-sm font-medium text-red-600 mt-1">{usernameError}</p>}
                <p className="text-xs text-stone-500">{formDict?.usernameHelp || 'El Nombre de Coleccionista es tu identidad única en Colectikos y fue asignado durante tu registro. No puede ser modificado.'}</p>
              </div>

              {/* Selección de Avatar */}
              <AvatarSelector
                selectedAvatar={formData.avatarUrl || ''}
                onSelectAvatar={(src) => updateForm('avatarUrl', src)}
              />

              {/* Género (Importante para los títulos) */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-stone-700">{formDict?.genderLabel || 'Género (Para tus títulos Tico/Tica)'}</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateForm('gender', g)}
                      className={`py-3 px-4 rounded-xl border font-medium text-sm transition-all duration-200 ${formData.gender === g ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-400 hover:bg-emerald-50'}`}
                    >
                      {formDict?.genders?.[g as keyof typeof formDict.genders] || g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Demografía */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-lg font-bold text-stone-700 border-b pb-2">{formDict?.step2 || 'Paso 2: Datos Demográficos'}</h3>
              
              {/* Edad */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-stone-700">{formDict?.ageLabel || 'Rango de Edad'}</label>
                <div className="relative">
                  <select 
                    value={formData.ageRange}
                    onChange={(e) => updateForm('ageRange', e.target.value)}
                    className="appearance-none w-full p-3 pr-10 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow text-stone-700 cursor-pointer"
                  >
                    <option value="" disabled>{formDict?.agePlaceholder || 'Selecciona tu edad...'}</option>
                    {[
                      { val: '<18', default: 'Menor de 18 años' },
                      { val: '18-25', default: '18 - 25 años' },
                      { val: '26-35', default: '26 - 35 años' },
                      { val: '36-45', default: '36 - 45 años' },
                      { val: '46-55', default: '46 - 55 años' },
                      { val: '56+', default: '56 años o más' }
                    ].map(age => (
                      <option key={age.val} value={age.val}>
                        {formDict?.ages?.[age.val as keyof typeof formDict.ages] || age.default}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Ubicación / Procedencia */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-stone-700">{formDict?.originLabel || '¿De dónde eres?'}</label>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setResidenceType('local'); updateForm('location', ''); }}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${residenceType === 'local' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-400 hover:bg-emerald-50'}`}
                  >
                    <span>🇨🇷</span> {formDict?.localResident || 'Vivo en Costa Rica'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setResidenceType('visitor'); updateForm('location', ''); }}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${residenceType === 'visitor' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-400 hover:bg-emerald-50'}`}
                  >
                    <span>✈️</span> {formDict?.foreignVisitor || 'Soy Visitante'}
                  </button>
                </div>

                {residenceType === 'local' ? (
                  <div className="relative mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                    <select 
                      value={formData.location}
                      onChange={(e) => updateForm('location', e.target.value)}
                      className="appearance-none w-full pl-11 pr-10 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow text-stone-700 cursor-pointer"
                    >
                      <option value="" disabled>{formDict?.locationPlaceholder || 'Elige tu provincia...'}</option>
                      {['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'].map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                  </div>
                ) : (
                  <div className="relative mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                    <input 
                      type="text"
                      placeholder={formDict?.countryPlaceholder || '¿De qué país nos visitas?'}
                      value={formData.location}
                      onChange={(e) => updateForm('location', e.target.value)}
                      className="w-full pl-11 p-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow text-stone-700"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: Preferencias */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-lg font-bold text-stone-700 border-b pb-2">{formDict?.step3 || 'Paso 3: Tus Preferencias de Viaje'}</h3>

              {/* Lugar Favorito */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-stone-700">{formDict?.favoritePlaceLabel || 'Tu lugar favorito en Costa Rica'}</label>
                <input 
                  type="text"
                  placeholder={formDict?.favoritePlacePlaceholder || 'Ej. Parque Nacional Manuel Antonio'}
                  value={formData.favoritePlace}
                  onChange={(e) => updateForm('favoritePlace', e.target.value)}
                  className="w-full p-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow text-stone-700"
                />
              </div>

              {/* Categoría Favorita */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-stone-700">{formDict?.favoriteCategoryLabel || '¿Qué tipo de lugares prefieres?'}</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'Playas', icon: Palmtree },
                    { id: 'Volcanes', icon: Mountain },
                    { id: 'Ríos', icon: Map },
                    { id: 'Cultura', icon: Coffee }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => updateForm('favoriteCategory', cat.id)}
                      className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 ${formData.favoriteCategory === cat.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-300'}`}
                    >
                      <cat.icon size={24} className="mb-2" />
                      <span className="text-sm font-medium">
                        {formDict?.categories?.[cat.id as keyof typeof formDict.categories] || cat.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo de Viaje */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-stone-700">{formDict?.travelStyleLabel || 'Tu estilo de viaje'}</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'Mochilero', icon: Backpack, desc: 'Aventura ligera' },
                    { id: 'Relax', icon: Coffee, desc: 'Paz y tranquilidad' },
                    { id: 'Aventurero', icon: Tent, desc: 'Naturaleza pura' },
                    { id: 'Familiar', icon: Users, desc: 'Para todas las edades' }
                  ].map(style => {
                    const styleDict = formDict?.travelStyles?.[style.id as keyof typeof formDict.travelStyles];
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => updateForm('travelStyle', style.id)}
                        className={`flex items-center gap-3 p-4 border rounded-xl text-left transition-all duration-200 ${formData.travelStyle === style.id ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-300'}`}
                      >
                        <div className={`p-2 rounded-lg ${formData.travelStyle === style.id ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                          <style.icon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{styleDict?.name || style.id}</p>
                          <p className="text-xs opacity-70">{styleDict?.desc || style.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>



              {/* Compañía Habitual */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-stone-700">{formDict?.companyLabel || 'Compañía habitual'}</label>
                <div className="flex flex-wrap gap-3">
                  {['Solo', 'En Pareja', 'Familia', 'Amigos'].map(comp => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => updateForm('travelCompany', comp)}
                      className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 ${formData.travelCompany === comp ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-400 hover:bg-emerald-50'}`}
                    >
                      {formDict?.companies?.[comp as keyof typeof formDict.companies] || comp}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Navegación Inferior */}
          <div className="mt-10 flex justify-between items-center pt-6 border-t border-stone-200">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => router.push(`/${dict?.lang === 'en' ? 'en' : 'es'}/profile`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              >
                {formDict?.cancel || 'Cancelar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <ChevronLeft size={18} /> {formDict?.back || 'Atrás'}
              </button>
            )}
            
            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isCheckingUsername}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCheckingUsername ? (formDict?.verifying || 'Verificando...') : (formDict?.next || 'Siguiente')} <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {hasMedal ? (formDict?.saveChanges || 'Guardar Cambios') : (formDict?.completeProfile || '¡Completar Perfil!')} {hasMedal ? null : <Award size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <LevelUpModal 
        isOpen={showMedal} 
        onClose={() => {
          setShowMedal(false);
          router.push(`/${dict?.lang === 'en' ? 'en' : 'es'}/profile`);
        }} 
        newRank={formDict?.identityReady || (dict?.lang === 'en' ? 'Identity Ready 🎖️' : 'Identidad Lista 🎖️')} 
      />
    </div>
  );
}
