import webpush from 'web-push';
import prisma from './prisma';

const DEFAULT_VAPID_PUBLIC_KEY = 'BGkm1u0NLuvbr-A952op62SgBgBdHWOIP1EdWLAyCW7x6UFBFCjdWy-umnaMt1ipxSiXd9OCAsYfmO453DG1lAs';
const DEFAULT_VAPID_PRIVATE_KEY = 's71kbvKI87wCgrKm9XPCdqkuOYerZcJt3I4gYadPAW0';
const DEFAULT_VAPID_SUBJECT = 'mailto:contacto@colectikos.com';

export function getVapidKeys() {
  return {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT,
  };
}

let isVapidInitialized = false;
function ensureVapid() {
  if (isVapidInitialized) return;
  const { publicKey, privateKey, subject } = getVapidKeys();
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidInitialized = true;
  } catch (error) {
    console.warn('Advertencia configurando VAPID en webpush:', error);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Envía una notificación push a una suscripción específica.
 * Si la suscripción expiró o fue desinstalada (410/404), la elimina automáticamente de la BD.
 */
export async function sendPushToSubscription(
  sub: { id?: string; endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
) {
  ensureVapid();

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  const notificationString = JSON.stringify({
    title: payload.title || 'Colectikos',
    body: payload.body || '¡Tenés novedades en tu aventura!',
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
    data: {
      url: payload.url || '/',
      tag: payload.tag || 'general',
    },
  });

  try {
    await webpush.sendNotification(pushSubscription, notificationString);
    return { success: true };
  } catch (err: any) {
    console.warn(`Error enviando notificación push a ${sub.endpoint.slice(0, 30)}...:`, err.statusCode || err.message);

    // 404 o 410 indica que el usuario desinstaló la app o revocó el permiso
    if (err.statusCode === 404 || err.statusCode === 410) {
      if (sub.id) {
        try {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
          console.log(`Suscripción expirada eliminada de BD: ${sub.id}`);
        } catch {}
      } else {
        try {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
        } catch {}
      }
    }
    return { 
      success: false, 
      error: err.message ? String(err.message) : 'Error enviando push', 
      statusCode: err.statusCode 
    };
  }
}

/**
 * Envía una notificación push a todos los dispositivos registrados de un usuario.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
) {
  try {
    if (!prisma.pushSubscription) {
      return { success: false, sentCount: 0, error: 'Tabla de suscripciones no disponible en el cliente de base de datos' };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions || subscriptions.length === 0) {
      return { success: false, sentCount: 0, reason: 'Usuario sin suscripciones push activas en este navegador' };
    }

    const results = await Promise.all(
      subscriptions.map((sub) => sendPushToSubscription(sub, payload))
    );

    const successCount = results.filter((r) => r.success).length;
    
    if (successCount === 0 && results.length > 0) {
      const firstError = results.find(r => r.error)?.error || 'Fallo al entregar la notificación al dispositivo';
      return { success: false, sentCount: 0, error: firstError, total: subscriptions.length };
    }

    return { success: true, sentCount: successCount, total: subscriptions.length };
  } catch (error: any) {
    console.error('Error enviando push a usuario:', error);
    return { 
      success: false, 
      sentCount: 0,
      error: error?.message ? String(error.message) : 'Error inesperado enviando push' 
    };
  }
}

/**
 * Envía una notificación push a TODOS los dispositivos registrados activos en la plataforma.
 */
export async function sendPushToAllSubscribers(payload: PushNotificationPayload) {
  try {
    if (!prisma.pushSubscription) {
      return { success: false, sentCount: 0, error: 'Tabla de suscripciones no disponible' };
    }

    const subscriptions = await prisma.pushSubscription.findMany();
    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, sentCount: 0, total: 0 };
    }

    const results = await Promise.all(
      subscriptions.map((sub) => sendPushToSubscription(sub, payload))
    );

    const successCount = results.filter((r) => r.success).length;
    return { success: true, sentCount: successCount, total: subscriptions.length };
  } catch (error: any) {
    console.error('Error enviando push masivo:', error);
    return { success: false, error: error?.message ? String(error.message) : 'Error inesperado' };
  }
}

/**
 * Envía un recordatorio de racha inteligente (7:00 PM CR) ÚNICAMENTE a los exploradores
 * que tengan racha activa y que NO hayan ingresado hoy.
 */
export async function sendStreakReminderToAtRiskUsers() {
  try {
    if (!prisma.user || !prisma.pushSubscription) {
      return { success: false, contactedCount: 0, error: 'Modelos no disponibles' };
    }

    const todayCR = new Date();
    const users = await prisma.user.findMany({
      where: {
        currentStreak: { gt: 0 },
        pushSubscriptions: { some: {} },
      },
      include: {
        pushSubscriptions: true,
      },
    });

    let contactedCount = 0;

    for (const user of users) {
      // Si el usuario ya inició sesión hoy en horario de CR, su racha está segura
      if (user.lastLoginDate) {
        const lastLogin = new Date(user.lastLoginDate);
        const crToday = new Date(todayCR.getTime() - 6 * 60 * 60 * 1000);
        const crLogin = new Date(lastLogin.getTime() - 6 * 60 * 60 * 1000);
        const isSameDay = 
          crToday.getUTCFullYear() === crLogin.getUTCFullYear() &&
          crToday.getUTCMonth() === crLogin.getUTCMonth() &&
          crToday.getUTCDate() === crLogin.getUTCDate();
        
        if (isSameDay) continue;
      }

      const streakDays = user.currentStreak;
      const payload: PushNotificationPayload = {
        title: '🔥 ¡Protegé tu racha de explorador!',
        body: streakDays > 1 
          ? `Llevás una racha de ${streakDays} días. ¡Entrá a Colectikos antes de medianoche para no perderla!`
          : `¡Mantené tu racha activa en Colectikos hoy y ganá tus estampillas!`,
        url: '/es/',
        tag: 'streak-protection',
      };

      await Promise.all(
        user.pushSubscriptions.map((sub) => sendPushToSubscription(sub, payload))
      );
      contactedCount++;
    }

    return { success: true, contactedCount, evaluatedCandidates: users.length };
  } catch (error: any) {
    console.error('Error enviando recordatorios de racha:', error);
    return { success: false, error: error?.message ? String(error.message) : 'Error inesperado' };
  }
}

