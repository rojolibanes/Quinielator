import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('user_id');
  const leagueId = searchParams.get('league_id');
  const matchday = searchParams.get('matchday');

  if (!targetUserId || !leagueId) {
    return NextResponse.json({ error: 'user_id y league_id son requeridos' }, { status: 400 });
  }

  // 1. Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, tagline')
    .eq('id', targetUserId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
  }

  // 2. Fetch all-time stats for this user across finished predictions
  const { data: allFinishedPreds } = await supabase
    .from('predictions')
    .select('points_earned, matches!inner(status)')
    .eq('user_id', targetUserId)
    .eq('matches.status', 'finished');

  const validFinished = allFinishedPreds || [];
  const totalFinished = validFinished.length;
  const avgPoints = totalFinished > 0
    ? Math.round((validFinished.reduce((acc: number, p: any) => acc + (p.points_earned ?? 0), 0) / totalFinished) * 10) / 10
    : 0;

  // 3. Fetch predictions in this specific league
  let query = supabase
    .from('predictions')
    .select(`
      id,
      match_id,
      predicted_home_score,
      predicted_away_score,
      predicted_scorers,
      predicted_mvp,
      points_earned,
      matches!inner (
        id,
        home_team,
        away_team,
        home_score,
        away_score,
        status,
        match_date,
        matchday
      )
    `)
    .eq('user_id', targetUserId)
    .eq('league_id', leagueId);

  if (matchday && matchday !== 'global' && !isNaN(Number(matchday))) {
    query = query.eq('matches.matchday', Number(matchday));
  }

  const { data: predictions, error: predsError } = await query;

  if (predsError) {
    return NextResponse.json({ error: predsError.message }, { status: 500 });
  }

  // Sort by match_date descending
  const sortedPreds = (predictions || []).sort((a: any, b: any) => {
    return new Date(b.matches.match_date).getTime() - new Date(a.matches.match_date).getTime();
  });

  // Only include matches that have already started or finished
  const now = new Date();
  const visiblePreds = sortedPreds
    .filter((p: any) => {
      const matchDate = new Date(p.matches.match_date);
      return p.matches.status !== 'pending' || matchDate <= now;
    })
    .map((p: any) => ({
      id: p.id,
      match_id: p.match_id,
      predicted_home_score: p.predicted_home_score,
      predicted_away_score: p.predicted_away_score,
      predicted_scorers: p.predicted_scorers,
      predicted_mvp: p.predicted_mvp,
      points_earned: p.points_earned,
      match: p.matches,
    }));

  // Calculate points in this specific selection
  const selectionFinished = visiblePreds.filter((p: any) => p.match.status === 'finished');
  const selectionTotalPoints = selectionFinished.reduce((acc: number, p: any) => acc + (p.points_earned ?? 0), 0);
  const selectionAvgPoints = selectionFinished.length > 0
    ? Math.round((selectionTotalPoints / selectionFinished.length) * 10) / 10
    : 0;

  return NextResponse.json({
    profile: {
      ...profile,
      all_time_avg_points: avgPoints,
      total_finished_predictions: totalFinished,
    },
    selection_stats: {
      total_points: selectionTotalPoints,
      avg_points: selectionAvgPoints,
      total_matches: visiblePreds.length,
      finished_matches: selectionFinished.length,
    },
    predictions: visiblePreds,
  });
}
