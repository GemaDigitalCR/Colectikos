import { NextRequest, NextResponse } from 'next/server';
import { sendStreakReminderToAtRiskUsers } from '../../../../lib/pushNotifications';

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

    const res = await sendStreakReminderToAtRiskUsers();

    return NextResponse.json({
      success: true,
      message: 'Recordatorio vespertino de protección de racha ejecutado',
      details: res,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en cron de recordatorio de racha:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

