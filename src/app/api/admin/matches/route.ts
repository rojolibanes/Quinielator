import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getTeamLogo } from '@/lib/teams';

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

function parseMatchDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Si la fecha ya incluye Z o zona horaria, se usa directamente
  if (dateStr.endsWith('Z') || dateStr.includes('+')) {
    return dateStr;
  }
  // Convertir string de datetime-local a objeto Date local y extraer su ISO string
  return new Date(dateStr).toISOString();
}

// POST /api/admin/matches — crear un partido
export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json();
  const { home_team, away_team, matchday, match_date, football_league } = body;

  if (!home_team || !away_team || !match_date) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const homeLogo = body.home_team_logo || getTeamLogo(home_team);
  const awayLogo = body.away_team_logo || getTeamLogo(away_team);
  const formattedDate = parseMatchDate(match_date);

  const { data, error } = await supabaseAdmin
    .from('matches')
    .insert({
      home_team,
      away_team,
      home_team_logo: homeLogo,
      away_team_logo: awayLogo,
      matchday: matchday ?? 1,
      match_date: formattedDate,
      football_league: football_league ?? 'laliga',
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ match: data });
}

// PATCH /api/admin/matches — actualizar resultado o editar detalles del partido (fecha, aplazamiento, etc.)
export async function PATCH(request: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json();
  const {
    match_id,
    home_score,
    away_score,
    scorers,
    mvp,
    status,
    match_date,
    matchday,
    home_team,
    away_team,
  } = body;

  if (!match_id) return NextResponse.json({ error: 'match_id requerido' }, { status: 400 });

  const updates: Record<string, any> = {};

  if (status !== undefined) updates.status = status;
  if (home_score !== undefined) updates.home_score = home_score;
  if (away_score !== undefined) updates.away_score = away_score;
  if (scorers !== undefined) updates.scorers = scorers;
  if (mvp !== undefined) updates.mvp = mvp;

  if (match_date !== undefined) updates.match_date = parseMatchDate(match_date);
  if (matchday !== undefined) updates.matchday = Number(matchday);
  if (home_team !== undefined) {
    updates.home_team = home_team;
    updates.home_team_logo = getTeamLogo(home_team);
  }
  if (away_team !== undefined) {
    updates.away_team = away_team;
    updates.away_team_logo = getTeamLogo(away_team);
  }

  const { data: updatedMatch, error } = await supabaseAdmin
    .from('matches')
    .update(updates)
    .eq('id', match_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Si se ha guardado un resultado finalizado, recalcular puntos
  if (updates.status === 'finished' || (home_score !== undefined && away_score !== undefined)) {
    const { error: rpcError } = await supabaseAdmin
      .rpc('recalculate_match_points', { p_match_id: match_id });
    if (rpcError) console.error('Error recalculando puntos:', rpcError);
  }

  return NextResponse.json({ ok: true, match: updatedMatch });
}
