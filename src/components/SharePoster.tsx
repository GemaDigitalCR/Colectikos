"use client";

import React from 'react';
import { Trophy, Award, Medal, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import StaticProgressMap from './StaticProgressMap';
import { LOGO_BASE64 } from '../data/logoBase64';

const CanvasImage = ({ src, className, size = 512, isContain = false }: { src: string, className?: string, size?: number, isContain?: boolean }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    if (!src || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isContain) {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      } else {
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      }
    };
    img.src = src;
  }, [src, size, isContain]);
  return <canvas ref={canvasRef} width={size} height={size} className={className} />;
};


interface SharePosterProps {
  posterRef: React.RefObject<HTMLDivElement | null>;
  username: string;
  avatarUrl: string | null;
  globalTitle: string;
  completadosGlobal: number;
  totalGlobal: number;
  porcentajeGlobal: number;
  categoryStats: any[];
  progressData: any;
  dict: any;
  playMode?: string;
  currentStreak: number;
  xp: number;
  level: number;
  gender?: string;
}

export default function SharePoster({
  posterRef,
  username,
  avatarUrl,
  globalTitle,
  completadosGlobal,
  totalGlobal,
  porcentajeGlobal,
  categoryStats,
  progressData,
  dict,
  playMode,
  currentStreak,
  xp,
  level,
  gender
}: SharePosterProps) {
  const [base64Avatar, setBase64Avatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    // 1. Fetch Avatar as Base64
    if (avatarUrl) {
      if (avatarUrl.startsWith('data:')) {
        setBase64Avatar(avatarUrl);
      } else {
        const fetchUrl = avatarUrl.startsWith('/') ? `${window.location.origin}${avatarUrl}` : avatarUrl;
        fetch(fetchUrl)
          .then(res => res.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => setBase64Avatar(reader.result as string);
            reader.readAsDataURL(blob);
          })
          .catch(err => {
            console.error("Avatar fetch error:", err);
            setBase64Avatar(avatarUrl);
          });
      }
    }
  }, [avatarUrl]);

  return (
    <div className="fixed top-0 left-0 w-[1080px] h-[1080px] z-[-50] opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div 
        ref={posterRef}
        className="flex flex-col items-center justify-between overflow-hidden text-white shadow-[inset_0_0_120px_rgba(0,0,0,0.8)] relative"
        style={{ 
          width: '1080px', 
          height: '1080px',
          backgroundColor: '#0f172a',
          backgroundImage: `linear-gradient(135deg, rgba(30,58,138,0.9) 0%, rgba(2,6,23,0.95) 100%)`
        }}
      >
        {/* HEADER */}
        <div className="z-10 grid w-full grid-cols-3 items-center px-16 pt-8">
          
          {/* LEFT: Avatar and User Info */}
          <div className="flex items-center gap-5 justify-self-start">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-emerald-500 shadow-2xl bg-stone-800 flex-shrink-0 flex items-center justify-center">
              {base64Avatar || avatarUrl ? (
                <img 
                  src={base64Avatar || (avatarUrl?.startsWith('/') && typeof window !== 'undefined' ? `${window.location.origin}${avatarUrl}` : avatarUrl!)}
                  className="h-full w-full object-cover"
                  alt="Avatar"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">{username}</h1>
              <p className="mt-2 text-2xl font-medium text-emerald-400">{globalTitle}</p>
            </div>
          </div>

          <div className="justify-self-center ml-16 translate-y-8">
            <div className="flex items-center justify-center h-40 w-40">
              <img 
                src={LOGO_BASE64}
                className="h-full w-full object-contain"
                alt="Colectikos Logo"
              />
            </div>
          </div>

          {/* RIGHT: Collection Title */}
          <div className="text-right justify-self-end flex flex-col items-end gap-1">
            <h2 className="text-3xl font-black text-white leading-none tracking-tight">
              {dict?.profile?.posterTitleLine1 || 'Mi Pasaporte'}
            </h2>
            <h2 className="text-3xl font-black text-white leading-none tracking-tight">
              {dict?.profile?.posterTitleLine2 || 'Colectikos'}
            </h2>
          </div>
        </div>

        {/* STAT BAR (Gamification) */}
        <div className="z-10 w-full px-16 mt-10 mb-1">
          <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-xl py-2 px-3 w-full border border-white/5 shadow-lg">
            <div className="flex flex-col items-center flex-1">
              <span className="text-xl">🔥</span> 
              <div className="text-xs text-stone-300 font-semibold uppercase tracking-wider mt-1">
                {dict?.profile?.streak || (dict?.categories?.ALL === 'All' ? 'Streak' : 'Racha')}
              </div> 
              <div className="text-xl font-bold text-white">{currentStreak}</div>
            </div>
            
            <div className="w-px h-10 bg-white/10 mx-2"></div>
            
            <div className="flex flex-col items-center flex-1">
              <span className="text-xl">⭐</span> 
              <div className="text-xs text-stone-300 font-semibold uppercase tracking-wider mt-1">
                {dict?.profile?.level || (dict?.categories?.ALL === 'All' ? 'Level' : 'Nivel')}
              </div> 
              <div className="text-xl font-bold text-white">{level}</div>
            </div>

            <div className="w-px h-10 bg-white/10 mx-2"></div>
            
            <div className="flex flex-col items-center flex-1">
              <span className="text-xl">✨</span> 
              <div className="text-xs text-stone-300 font-semibold uppercase tracking-wider mt-1">XP</div> 
              <div className="text-xl font-bold text-white">{xp}</div>
            </div>

            <div className="w-px h-10 bg-white/10 mx-2"></div>
            
            <Link 
              href={`/${dict?.categories?.ALL === 'All' ? 'en' : 'es'}/nuestra-app?tab=instrucciones`} 
              className="flex flex-col items-center justify-center px-2 text-white/50 hover:text-white hover:opacity-100 transition-all cursor-pointer"
              title={dict?.categories?.ALL === 'All' ? "How do streaks and levels work?" : "¿Cómo funcionan las rachas y niveles?"}
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>

      {/* GLOBAL PROGRESS */}
      <div className="z-10 mt-4 w-full px-16">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-2xl font-bold">{dict?.profile?.totalProgress || 'Progreso Total'}</span>
        </div>
        <div className="flex items-center justify-between w-full">
          <div className="text-5xl font-black text-emerald-400">
            {gender?.toLowerCase() === 'femenino' || gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'mujer' 
              ? (dict?.gamification?.passportTica ? dict.gamification.passportTica.replace('{level}', porcentajeGlobal.toString()) : `Sos Tica${porcentajeGlobal}`)
              : (dict?.gamification?.passportTico ? dict.gamification.passportTico.replace('{level}', porcentajeGlobal.toString()) : `Sos Tico${porcentajeGlobal}`)
            }
          </div>
          <p className="text-xl font-medium text-stone-400">
            {dict?.profile?.placesConquered 
              ? dict.profile.placesConquered.replace('{completed}', completadosGlobal.toString()).replace('{total}', totalGlobal.toString())
              : `${completadosGlobal} de ${totalGlobal} lugares conquistados`
            }
          </p>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT: CATEGORIES & MAP */}
      <div className="z-10 mt-6 flex w-full flex-1 gap-12 px-16 pb-8">
        
        {/* LEFT: Categories Grid */}
        <div className="flex w-5/12 flex-col justify-center">
          <div className="grid grid-cols-1 gap-2">
            {categoryStats.map((stat, idx) => {
              let Icon = Medal;
              let iconColor = "text-stone-400";
              let badgeColor = "bg-stone-800 border-stone-700";
              
              if (stat.percentage >= 75) {
                Icon = Trophy;
                iconColor = "text-yellow-400";
                badgeColor = "bg-yellow-900/40 border-yellow-700";
              } else if (stat.percentage >= 50) {
                Icon = Award;
                iconColor = "text-slate-300";
                badgeColor = "bg-slate-800 border-slate-600";
              } else if (stat.percentage >= 25) {
                Icon = Medal;
                iconColor = "text-orange-400";
                badgeColor = "bg-orange-950/40 border-orange-800";
              }

              return (
                <div key={idx} className={`flex items-center justify-between rounded-xl border px-5 py-1.5 backdrop-blur-sm ${badgeColor}`}>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-stone-900/50 p-2 shadow-inner">
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wider text-stone-300">{stat.label}</p>
                  </div>
                  <p className="text-xl font-black text-white">{stat.percentage}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Mini Map */}
        <div className="flex w-7/12 items-center justify-center rounded-3xl bg-stone-900/50 p-4 shadow-2xl border border-stone-800 backdrop-blur-sm overflow-hidden">
          <div className="h-full w-full flex items-center justify-center">
            <StaticProgressMap progressData={progressData} hideProvinceNames={true} dict={dict} />
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
