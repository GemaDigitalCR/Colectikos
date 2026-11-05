"use server";

import prisma from '../lib/prisma';
import { ensureDbUser } from './gamification';
import { sendPushToUser, sendPushToSubscription } from '../lib/pushNotifications';

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  localUsername?: string;
  fallbackClerkId?: string;
}

/**
 * Registra o actualiza una suscripción Web Push vinculándola al usuario actual.
 */
export async function savePushSubscription(input: PushSubscriptionInput) {
  try {
    if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
      return { success: false, error: 'Datos de suscripción incompletos' };
    }

    const dbUser = await ensureDbUser(input.localUsername, input.fallbackClerkId);
    const userId = dbUser?.id || null;

    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      update: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent || null,
      },
    });

    return { success: true, id: saved.id, userId };
  } catch (error: any) {
    console.error('Error guardando suscripción push:', error);
    return { success: false, error: error.message || 'Error guardando suscripción' };
  }
}

/**
 * Elimina una suscripción push cuando el usuario apaga el interruptor.
 */
export async function removePushSubscription(endpoint: string) {
  try {
    if (!endpoint) return { success: false, error: 'Endpoint no proporcionado' };

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error eliminando suscripción push:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Consulta si un endpoint ya está registrado y activo en la base de datos.
 */
export async function getPushSubscriptionStatus(endpoint: string) {
  try {
    if (!endpoint) return { isSubscribed: false };
    const found = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });
    return { isSubscribed: !!found };
  } catch (error) {
    return { isSubscribed: false };
  }
}

/**
 * Envía una notificación push de prueba al usuario actual.
 */
export async function sendTestPushNotification(localUsername?: string, fallbackClerkId?: string) {
  try {
    const dbUser = await ensureDbUser(localUsername, fallbackClerkId);
    if (!dbUser) {
      return { success: false, error: 'Usuario no encontrado en la base de datos' };
    }

    const res = await sendPushToUser(dbUser.id, {
      title: '🎮 ¡Mini-juegos de Comunidad!',
      body: 'Recuerda ganar más XPs en los mini-juegos de Comunidad. ¡Crucetiko, Sopitika y Parejitikas te esperan!',
      url: '/es/community',
    });

    if (!res.success) {
      return { 
        success: false, 
        error: typeof res.error === 'string' 
          ? res.error 
          : (res as any).reason || 'No se encontraron suscripciones activas registradas para este usuario' 
      };
    }

    return { success: true, sentCount: res.sentCount };
  } catch (error: any) {
    console.error('Error enviando notificación push de prueba:', error);
    return { 
      success: false, 
      error: error?.message ? String(error.message) : 'Error inesperado enviando notificación de prueba' 
    };
  }
}

