"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Send, Mail, User, Phone, MessageSquare, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDictionary } from '../../../context/DictionaryContext';

export default function ContactPage() {
  const dict = useDictionary();
  const t = dict?.contact;
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    motivo: t?.reasonGeneral || 'Consulta General',
    comentarios: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t?.successMsg || '¡Mensaje enviado correctamente! Te contactaremos pronto.');
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          motivo: t?.reasonGeneral || 'Consulta General',
          comentarios: ''
        });
      } else {
        toast.error(data.error || t?.errorMsg || 'Hubo un error al enviar el mensaje. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t?.networkError || 'Ocurrió un problema de red al enviar el mensaje.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 w-full bg-stone-50 min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">{t?.title}</h1>
          <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">
            {t?.subtitle}
          </p>
        </div>

        {/* Dos bloques principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          
          {/* Columna Izquierda: Formulario de Contacto */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Mail className="text-emerald-600" /> {t?.formTitle}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-semibold text-stone-700 mb-1">
                  {t?.fullName}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 text-stone-900 font-medium transition-colors"
                    placeholder={t?.fullNamePlaceholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-1">
                    {t?.email}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 text-stone-900 font-medium transition-colors"
                      placeholder={t?.emailPlaceholder}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="telefono" className="block text-sm font-semibold text-stone-700 mb-1">
                    {t?.phone}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 text-stone-900 font-medium transition-colors"
                      placeholder={t?.phonePlaceholder}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="motivo" className="block text-sm font-semibold text-stone-700 mb-1">
                  {t?.reason}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-stone-400" />
                  </div>
                  <select
                    id="motivo"
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-stone-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 appearance-none text-stone-900 font-medium transition-colors"
                  >
                    <option value={t?.reasonGeneral}>{t?.reasonGeneral}</option>
                    <option value={t?.reasonBusiness}>{t?.reasonBusiness}</option>
                    <option value={t?.reasonTech}>{t?.reasonTech}</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="comentarios" className="block text-sm font-semibold text-stone-700 mb-1">
                  {t?.comments}
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-stone-400" />
                  </div>
                  <textarea
                    id="comentarios"
                    name="comentarios"
                    rows={4}
                    value={formData.comentarios}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 text-stone-900 font-medium transition-colors"
                    placeholder={t?.commentsPlaceholder}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-lg font-bold text-white transition-all ${
                  loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                }`}
              >
                <Send className={`h-5 w-5 ${loading ? 'animate-pulse' : ''}`} /> 
                {loading ? t?.submitBtnSending : t?.submitBtn}
              </button>
            </form>
          </div>

          {/* Columna Derecha: Comunidad y Negocios */}
          <div className="flex flex-col gap-6">
            
            {/* Tarjeta Principal de Comunidad */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
              {/* Elemento Decorativo (Mascota Otico) */}
              <div className="absolute -bottom-4 -right-4 opacity-20 pointer-events-none">
                <img 
                  src="/images/Imagenes_Pagina/otico-manitas-banner.PNG" 
                  alt="Otico Mascota" 
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-4 tracking-tight">
                  {t?.communityTitle}
                </h2>
                <p className="text-emerald-100 text-lg mb-8 leading-relaxed">
                  {t?.communityDesc}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="https://facebook.com/Colectikos" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> Facebook
                  </a>
                  <a 
                    href="https://instagram.com/Colectikos" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white font-bold shadow-md transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> Instagram
                  </a>
                </div>
              </div>
            </div>

            {/* Sub-tarjeta B2B */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex items-start gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl flex-shrink-0">
                <Briefcase className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 mb-1">
                  {t?.b2bTitle}
                </h3>
                <p className="text-sm text-stone-600">
                  {t?.b2bDescPart1}<strong className="text-stone-800">{t?.reasonBusiness}</strong>{t?.b2bDescPart2}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
