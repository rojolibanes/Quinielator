import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const isAdmin = ADMIN_EMAILS.includes(user.email ?? '') || ADMIN_EMAILS.length === 0;
  return isAdmin ? user : null;
}

// POST /api/admin/matches — create a match
export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json();
  const { home_team, away_team, matchday, match_date, football_league } = body;

  if (!home_team || !away_team || !match_date) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('matches')
    .insert({
      home_team,
      away_team,
      matchday: matchday ?? 1,
      match_date: new Date(match_date).toISOString(),
      football_league: football_league ?? 'laliga',
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ match: data });
}

// PATCH /api/admin/matches — update match result
export async function PATCH(request: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json();
  const { match_id, home_score, away_score, scorers, mvp } = body;

  if (!match_id) return NextResponse.json({ error: 'match_id requerido' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('matches')
    .update({ home_score, away_score, scorers, mvp, status: 'finished' })
    .eq('id', match_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate points for all predictions of this match
  const { error: rpcError } = await supabaseAdmin
    .rpc('recalculate_match_points', { p_match_id: match_id });

  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
