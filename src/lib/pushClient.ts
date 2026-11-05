import { savePushSubscription, removePushSubscription, getPushSubscriptionStatus } from '../actions/pushNotifications';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registra el Service Worker raíz si no está registrado aún.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (error) {
    console.error('Error registrando Service Worker:', error);
    return null;
  }
}

/**
 * Verifica si el navegador actual soporta Web Push y su estado actual.
 */
export async function checkPushStatus(): Promise<{
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isStandalone: boolean;
}> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return {
      isSupported: false,
      permission: 'unsupported',
      isSubscribed: false,
      isStandalone: false,
    };
  }

  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  const isStandaloneNav = (navigator as any).standalone === true;
  const isStandalone = standaloneMedia || isStandaloneNav;

  const permission = Notification.permission;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return {
      isSupported: true,
      permission,
      isSubscribed: !!sub,
      isStandalone,
    };
  } catch (e) {
    return {
      isSupported: true,
      permission,
      isSubscribed: false,
      isStandalone,
    };
  }
}

/**
 * Suscribe el dispositivo actual a Web Push y guarda el endpoint en el servidor.
 */
export async function subscribeToPush(options?: {
  localUsername?: string;
  fallbackClerkId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, error: 'Web Push no es soportado en este navegador' };
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BGkm1u0NLuvbr-A952op62SgBgBdHWOIP1EdWLAyCW7x6UFBFCjdWy-umnaMt1ipxSiXd9OCAsYfmO453DG1lAs';
    if (!vapidKey) {
      return { success: false, error: 'Clave pública VAPID no encontrada' };
    }

    // 1. Solicitar permiso explícito al usuario
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso denegado por el usuario' };
    }

    // 2. Asegurar que el Service Worker esté activo
    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: 'No se pudo activar el Service Worker' };
    }

    // 3. Suscribir a través del PushManager del navegador
    const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { success: false, error: 'No se generaron las claves push correctamente' };
    }

    // 4. Guardar en BD mediante Server Action
    const res = await savePushSubscription({
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      },
      userAgent: navigator.userAgent,
      localUsername: options?.localUsername,
      fallbackClerkId: options?.fallbackClerkId,
    });

    return res;
  } catch (error: any) {
    console.error('Error suscribiendo a push:', error);
    return { success: false, error: error.message || 'Error en suscripción' };
  }
}

/**
 * Desuscribe el dispositivo actual y lo elimina de la BD.
 */
export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return { success: false };
    }

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await removePushSubscription(endpoint);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error desuscribiendo de push:', error);
    return { success: false, error: error.message };
  }
}

