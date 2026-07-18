import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
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

async function syncUserTotalPoints(supabaseAdmin: any) {
  const { data: members } = await supabaseAdmin
    .from('league_members')
    .select('league_id, user_id');

  if (!members || members.length === 0) return;

  for (const m of members) {
    const { data: preds } = await supabaseAdmin
      .from('predictions')
      .select('points_earned')
      .eq('league_id', m.league_id)
      .eq('user_id', m.user_id);

    const total = (preds || []).reduce((acc: number, p: any) => acc + (p.points_earned || 0), 0);

    await supabaseAdmin
      .from('league_members')
      .update({ total_points: total })
      .eq('league_id', m.league_id)
      .eq('user_id', m.user_id);
  }
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

    if (action === 'recalculate_rankings' || action === 'all') {
      const supabaseAdmin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await syncUserTotalPoints(supabaseAdmin);
      summary.rankings = { status: 'success', message: 'Clasificaciones recalculadas' };
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
