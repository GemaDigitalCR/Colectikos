"use client";

import React, { useState } from 'react';
import { MapPin, Eye, EyeOff } from 'lucide-react';
import AvatarSelector from './AvatarSelector';
import Link from 'next/link';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    favoritePlace: '',
    avatar: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (src: string) => {
    setFormData(prev => ({ ...prev, avatar: src }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data to submit:', formData);
    // TODO: Send data to database / backend API
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800">Crea tu Cuenta</h2>
        <p className="text-base text-gray-500 mt-2">Únete para descubrir y coleccionar lugares increíbles.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* LAYOUT PRINCIPAL DE 2 COLUMNAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* COLUMNA IZQUIERDA: Inputs de texto */}
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">Nombre Completo</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">Alias de Explorador</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Ej. Explorador19"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="mae@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="favoritePlace">Mi lugar favorito de Costa Rica</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600">
                  <MapPin size={18} />
                </div>
                <input
                  id="favoritePlace"
                  name="favoritePlace"
                  type="text"
                  placeholder="Ej. Volcán Arenal o Puerto Viejo"
                  value={formData.favoritePlace}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Avatar Selector */}
          <div className="flex flex-col bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <label className="block text-base font-semibold text-gray-800 mb-4 text-center md:text-left">
              Elige tu Avatar
            </label>
            <div className="flex-grow flex items-center justify-center">
              <AvatarSelector 
                selectedAvatar={formData.avatar} 
                onSelectAvatar={handleAvatarSelect} 
              />
            </div>
          </div>
          
        </div>

        {/* ZONA DE BOTONES: Ocupan ancho completo debajo del grid */}
        <div className="mt-10 max-w-md mx-auto w-full flex flex-col gap-4">
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors duration-200 shadow-sm"
          >
            Registrarse
          </button>

          <Link href="/login" className="w-full text-center py-3.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            ¿Ya tienes cuenta? Inicia Sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
