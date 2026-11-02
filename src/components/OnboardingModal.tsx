"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Check, AlertCircle } from 'lucide-react';
import { completeOnboarding } from '../actions/gamification';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

interface OnboardingModalProps {
  onCompleted: () => void;
}

export default function OnboardingModal({ onCompleted }: OnboardingModalProps) {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] === 'en' ? 'en' : 'es';

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'MASCULINO' | 'FEMENINO' | 'NEUTRO'>('MASCULINO');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    title: lang === 'en' ? "Create your collector profile" : "Crea tu perfil de coleccionista",
    subtitle: lang === 'en' 
      ? "You're about to start your collection. How do you want other explorers to know you?" 
      : "Estás a punto de iniciar tu colección. ¿Cómo quieres que te conozcan los demás exploradores?",
    usernameLabel: lang === 'en' ? "Explorer's Nickname" : "Alias de Explorador",
    usernamePlaceholder: lang === 'en' ? "E.g. JuanExplores" : "Ej. JuanExplora",
    usernameHint: lang === 'en' 
      ? "This nickname will be public and appear in community rankings." 
      : "Este alias será público y aparecerá en los rankings de comunidad.",
    genderLabel: lang === 'en' ? "How do you prefer to be called?" : "¿Cómo preferís que te llamen?",
    genderHint: lang === 'en' 
      ? "This will adjust your level titles (e.g. \"Tico Beginner\" vs \"Tica Beginner\")." 
      : "Esto ajustará los títulos de tus niveles (ej. \"Tico Principiante\" vs \"Tica Principiante\").",
    male: lang === 'en' ? "Male" : "Masculino",
    female: lang === 'en' ? "Female" : "Femenino",
    neutral: lang === 'en' ? "Neutral" : "Neutro",
    start: lang === 'en' ? "Start Adventure" : "Comenzar Aventura",
    errEmpty: lang === 'en' ? "Please enter an explorer's nickname." : "Por favor ingresa un alias de explorador.",
    errShort: lang === 'en' ? "Nickname must be at least 3 characters." : "El alias debe tener al menos 3 caracteres.",
    welcome: lang === 'en' ? "Welcome" : "¡Bienvenido/a",
    errSave: lang === 'en' ? "Error saving profile." : "Error al guardar el perfil.",
    errUnexp: lang === 'en' ? "An unexpected error occurred." : "Ocurrió un error inesperado."
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError(t.errEmpty);
      return;
    }
    if (username.length < 3) {
      setError(t.errShort);
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const result = await completeOnboarding(username.trim(), gender);
      if (result.success) {
        toast.success(`${t.welcome}, ${username}!`);
        const profile = localStorage.getItem('userProfileData');
        if (profile) {
          const parsed = JSON.parse(profile);
          parsed.username = username.trim();
          parsed.gender = gender;
          localStorage.setItem('userProfileData', JSON.stringify(parsed));
          window.dispatchEvent(new Event('profileUpdated'));
        } else {
          localStorage.setItem('userProfileData', JSON.stringify({ username: username.trim(), gender }));
          window.dispatchEvent(new Event('profileUpdated'));
        }
        onCompleted();
      } else {
        setError(result.message || t.errSave);
      }
    } catch (e) {
      setError(t.errUnexp);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
        >
          <div className="bg-emerald-600 px-6 py-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/images/Imagenes_Pagina/patron-topografico.png)', backgroundSize: 'cover' }}></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif italic mb-2">{t.title}</h2>
              <p className="text-emerald-50 text-sm sm:text-base">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">{t.usernameLabel}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder={t.usernamePlaceholder}
                    className="w-full pl-4 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-stone-800"
                    maxLength={20}
                  />
                  {username.length >= 3 && !error && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                  )}
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 text-sm text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </motion.p>
                )}
                <p className="mt-2 text-xs text-stone-500">{t.usernameHint}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-3">{t.genderLabel}</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('MASCULINO')}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all ${gender === 'MASCULINO' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 bg-stone-50 text-stone-500 hover:border-emerald-200 hover:bg-emerald-50/50'}`}
                  >
                    <span className="font-bold text-sm">Tico</span>
                    <span className="text-[10px] opacity-70 mt-1">{t.male}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('FEMENINO')}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all ${gender === 'FEMENINO' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 bg-stone-50 text-stone-500 hover:border-emerald-200 hover:bg-emerald-50/50'}`}
                  >
                    <span className="font-bold text-sm">Tica</span>
                    <span className="text-[10px] opacity-70 mt-1">{t.female}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('NEUTRO')}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all ${gender === 'NEUTRO' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-100 bg-stone-50 text-stone-500 hover:border-emerald-200 hover:bg-emerald-50/50'}`}
                  >
                    <span className="font-bold text-sm">Tic@</span>
                    <span className="text-[10px] opacity-70 mt-1">{t.neutral}</span>
                  </button>
                </div>
                <p className="mt-2 text-xs text-stone-500">{t.genderHint}</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || username.length < 3}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    t.start
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
