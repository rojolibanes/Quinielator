import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('match_id');
  const leagueId = searchParams.get('league_id');

  if (!matchId || !leagueId) {
    return NextResponse.json({ error: 'match_id y league_id son requeridos' }, { status: 400 });
  }

  // 1. Fetch match info
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, status, match_date, matchday')
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
  }

  const matchDate = new Date(match.match_date);
  const isStartedOrFinished = match.status !== 'pending' || matchDate <= new Date();

  // If the match has NOT started yet, only allow viewing own prediction
  if (!isStartedOrFinished) {
    return NextResponse.json({
      error: 'Las predicciones de la liga solo son visibles una vez iniciado el partido.',
      is_locked: false,
    }, { status: 403 });
  }

  // 2. Fetch all predictions for this match and league
  const { data: predictions, error: predsError } = await supabase
    .from('predictions')
    .select(`
      id,
      user_id,
      predicted_home_score,
      predicted_away_score,
      predicted_scorers,
      predicted_mvp,
      points_earned,
      profiles (
        nickname,
        avatar_url
      )
    `)
    .eq('match_id', matchId)
    .eq('league_id', leagueId);

  if (predsError) {
    return NextResponse.json({ error: predsError.message }, { status: 500 });
  }

  // 3. Sort by points_earned descending, then by nickname
  const sorted = (predictions || []).sort((a: any, b: any) => {
    const ptsA = a.points_earned ?? -1;
    const ptsB = b.points_earned ?? -1;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const nameA = a.profiles?.nickname ?? '';
    const nameB = b.profiles?.nickname ?? '';
    return nameA.localeCompare(nameB);
  });

  return NextResponse.json({
    match,
    predictions: sorted.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      nickname: p.profiles?.nickname ?? 'Anónimo',
      avatar_url: p.profiles?.avatar_url ?? null,
      predicted_home_score: p.predicted_home_score,
      predicted_away_score: p.predicted_away_score,
      predicted_scorers: p.predicted_scorers,
      predicted_mvp: p.predicted_mvp,
      points_earned: p.points_earned,
      is_me: p.user_id === currentUser.id,
    })),
  });
}
