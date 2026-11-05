"use client";

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Send, Sparkles, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { checkPushStatus, subscribeToPush, unsubscribeFromPush, registerServiceWorker } from '../lib/pushClient';
import { sendTestPushNotification } from '../actions/pushNotifications';

interface PushNotificationToggleProps {
  isEn?: boolean;
}

function formatToastError(err: any, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof Error || typeof err?.message === 'string') return err.message;
  return fallback;
}

export default function PushNotificationToggle({ isEn = false }: PushNotificationToggleProps) {
  const { user } = useUser();
  const [isSupported, setIsSupported] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }

    // Registrar Service Worker silenciosamente
    registerServiceWorker();

    // Consultar estado de soporte y permisos
    checkPushStatus().then((status) => {
      setIsSupported(status.isSupported);
      setIsSubscribed(status.isSubscribed);
      setPermission(status.permission);
      setIsStandalone(status.isStandalone);
    });
  }, []);

  const handleToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Desuscribirse
        const res = await unsubscribeFromPush();
        if (res.success) {
          setIsSubscribed(false);
          toast.success(isEn ? 'Notifications disabled' : 'Notificaciones desactivadas', { icon: '🔕' });
        } else {
          toast.error(isEn ? 'Could not disable notifications' : 'No se pudo desactivar las notificaciones');
        }
      } else {
        // Suscribirse
        const localUsername = localStorage.getItem('localUsername') || undefined;
        const res = await subscribeToPush({
          localUsername,
          fallbackClerkId: user?.id,
        });

        if (res.success) {
          setIsSubscribed(true);
          setPermission('granted');
          toast.success(
            isEn 
              ? 'Notifications activated! You will receive daily game reminders.' 
              : '¡Notificaciones activadas! Recibirás avisos de tus turnos diarios.',
            { icon: '🔔', duration: 4000 }
          );
        } else {
          if (res.error?.includes('denegado')) {
            setPermission('denied');
            toast.error(
              isEn 
                ? 'Permission denied. You can enable it in your browser settings.' 
                : 'Permiso denegado. Puedes habilitarlo en los ajustes de tu navegador.'
            );
          } else {
            toast.error(formatToastError(res.error, isEn ? 'Could not activate notifications' : 'No se pudo activar las notificaciones'));
          }
        }
      }
    } catch (e: any) {
      toast.error(formatToastError(e, isEn ? 'Error processing request' : 'Error procesando solicitud'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (isSendingTest) return;
    setIsSendingTest(true);

    try {
      // 1. Disparo inmediato en primer plano (para verificar si macOS permite alertas del navegador)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const directNotif = new Notification('🦥 ¡Colectikos en tu Mac!', {
            body: '¡Excelente! Tu navegador y tu Mac tienen los permisos activos.',
            icon: '/icon-192x192.png',
          });
          directNotif.onclick = () => window.focus();
        } catch (err) {
          console.warn('Direct notification error:', err);
        }
      }

      // 2. Disparo a través del Service Worker y servidor Cloud Push
      const localUsername = localStorage.getItem('localUsername') || undefined;
      const res = await sendTestPushNotification(localUsername, user?.id);

      if (res.success) {
        toast.success(
          isEn 
            ? 'Notification sent! Check top-right of screen.' 
            : '¡Notificación enviada! Si no la ves, revisa Ajustes de Mac > Notificaciones.',
          { icon: '📲', duration: 6500 }
        );
      } else {
        toast.error(formatToastError(res.error, isEn ? 'Could not send test' : 'No se pudo enviar la prueba'));
      }
    } catch (e: any) {
      toast.error(formatToastError(e, isEn ? 'Error sending test' : 'Error enviando prueba'));
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-stone-200 p-5 shadow-sm transition-all hover:border-emerald-300">
      <div className="flex items-start justify-between gap-4">
        
        {/* Lado izquierdo: Icono y Textos */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isSubscribed 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
              : 'bg-stone-100 text-stone-500 border border-stone-200'
          }`}>
            {isSubscribed ? <Bell size={22} className="animate-pulse" /> : <BellOff size={22} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-stone-900 text-base leading-tight">
                {isEn ? "Explorer Notifications" : "Notificaciones de Explorador"}
              </h3>
              {isSubscribed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={11} />
                  <span>{isEn ? "ACTIVE" : "ACTIVAS"}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {isEn 
                ? "Get friendly reminders when your 3 daily Crucetiko turns are ready, keep your explorer streak safe, and community alerts."
                : "Recibe avisos cuando tus 3 turnos diarios de Crucetiko estén listos, protege tu racha de explorador y alertas comunitarias."}
            </p>

            {/* Guía para iPhone si no es PWA instalada */}
            {isIOS && !isStandalone && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-800 leading-snug">
                <Smartphone size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>{isEn ? "iPhone Tip: " : "Tip para iPhone: "}</strong>
                  {isEn 
                    ? "In iOS, first add Colectikos to your Home Screen (Share ➔ Add to Home Screen) to enable push notifications."
                    : "En iOS, primero agrega Colectikos a tu pantalla de inicio (Compartir ➔ Agregar a Inicio) para recibir notificaciones."}
                </div>
              </div>
            )}

            {/* Aviso si el permiso fue bloqueado */}
            {permission === 'denied' && (
              <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-[11px] text-rose-700">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span>
                  {isEn 
                    ? "Notifications are blocked in this browser. Please enable them in site settings." 
                    : "Las notificaciones están bloqueadas en este navegador. Habilítalas en los ajustes del sitio."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lado derecho: Toggle Switch */}
        <div className="flex flex-col items-end shrink-0 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={isSubscribed}
            disabled={isLoading || !isSupported}
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isSubscribed ? 'bg-emerald-600' : 'bg-stone-300'
            } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isSubscribed ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      </div>

      {/* Botón de Prueba en Vivo (Visible si está suscrito para que el usuario o admin pruebe) */}
      {isSubscribed && (
        <div className="mt-4 pt-3.5 border-t border-stone-200/80 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] text-stone-500 font-medium">
            {isEn ? "Test your device connection:" : "¿Quieres probar cómo se ve en tu dispositivo?"}
          </span>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSendingTest}
            className="py-1.5 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Send size={13} className={isSendingTest ? 'animate-spin' : ''} />
            <span>{isSendingTest ? (isEn ? "Sending..." : "Enviando...") : (isEn ? "Send test push" : "Enviar notificación de prueba")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

