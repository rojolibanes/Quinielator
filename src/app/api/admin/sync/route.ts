import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { syncFixtures, syncResults } from '@/lib/api-football/sync';

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
  const matchday = body.matchday ? Number(body.matchday) : null;

  try {
    const summary: Record<string, any> = {};

    if (action === 'fixtures' || action === 'all') {
      summary.fixtures = await syncFixtures(matchday);
    }

    if (action === 'results' || action === 'all') {
      summary.results = await syncResults();
    }

    return NextResponse.json({
      message: 'Sincronización completada',
      details: summary,
    });
  } catch (err: any) {
    console.error('Error en admin sync:', err);
    return NextResponse.json({ error: err.message || 'Error en la sincronización' }, { status: 500 });
  }
}
