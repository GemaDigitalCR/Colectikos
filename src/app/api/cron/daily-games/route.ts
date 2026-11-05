import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAllSubscribers } from '../../../../lib/pushNotifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');

    // Validación de seguridad si CRON_SECRET está configurado en variables de entorno
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = {
      title: '🎮 ¡Mini-juegos de Comunidad!',
      body: 'Recuerda ganar más XPs en los mini-juegos de Comunidad. ¡Crucetiko, Sopitika y Parejitikas te esperan!',
      url: '/es/community',
      tag: 'daily-community-games',
    };

    const res = await sendPushToAllSubscribers(payload);

    return NextResponse.json({
      success: true,
      message: 'Recordatorio matutino de mini-juegos enviado',
      details: res,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en cron de mini-juegos diarios:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}
