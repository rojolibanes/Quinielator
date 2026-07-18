import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const isAdmin = ADMIN_EMAILS.includes(user.email ?? '') || ADMIN_EMAILS.length === 0;
  return isAdmin ? user : null;
}

export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action || 'all';
  const matchday = body.matchday ? Number(body.matchday) : undefined;

  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  const cronUrl = new URL(`${protocol}://${host}/api/cron/sync-football`);
  cronUrl.searchParams.append('action', action);
  if (matchday) {
    cronUrl.searchParams.append('matchday', String(matchday));
  }
  if (process.env.CRON_SECRET) {
    cronUrl.searchParams.append('secret', process.env.CRON_SECRET);
  }

  try {
    const res = await fetch(cronUrl.toString(), { method: 'GET' });
    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: json.error || 'Error procesando la sincronización' }, { status: res.status });
    }

    return NextResponse.json({
      message: 'Sincronización completada',
      details: json.summary,
    });
  } catch (err: any) {
    console.error('Error al llamar sync-football desde admin:', err);
    return NextResponse.json({ error: 'Error al conectar con la API de sincronización' }, { status: 500 });
  }
}
