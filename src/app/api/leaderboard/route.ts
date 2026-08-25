import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isMatchApplicableToLeague } from '@/lib/scoring/calculatePoints';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('league_id');
  const matchday = searchParams.get('matchday');

  if (!leagueId) {
    return NextResponse.json({ error: 'league_id requerido' }, { status: 400 });
  }

  // Fetch league config
  const { data: leagueData, error: leagueError } = await supabase
    .from('leagues')
    .select('id, football_league, points_config')
    .eq('id', leagueId)
    .single();

  if (leagueError || !leagueData) {
    return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 });
  }

  // ── Return list of matchdays with at least 1 finished match applicable to this league ──
  if (matchday === 'available') {
    let matchQuery = supabase
      .from('matches')
      .select('id, matchday, home_team, away_team, status, football_league')
      .eq('status', 'finished')
      .order('matchday', { ascending: true });

    if (leagueData.football_league) {
      matchQuery = matchQuery.eq('football_league', leagueData.football_league);
    }

    const { data: finishedMatches } = await matchQuery;
    const applicableMatches = (finishedMatches ?? []).filter((m: any) =>
      isMatchApplicableToLeague(m, leagueData)
    );

    const matchdays = Array.from(new Set(applicableMatches.map((m: any) => m.matchday as number))).sort((a, b) => a - b);
    return NextResponse.json({ matchdays });
  }

  // ── Return leaderboard for a specific matchday ──
  const matchdayNum = Number(matchday);
  if (!matchday || isNaN(matchdayNum)) {
    return NextResponse.json({ error: 'matchday debe ser un número' }, { status: 400 });
  }

  // Get all finished matches for this matchday applicable to this league
  let matchesQuery = supabase
    .from('matches')
    .select('id, matchday, home_team, away_team, status, football_league')
    .eq('matchday', matchdayNum)
    .eq('status', 'finished');

  if (leagueData.football_league) {
    matchesQuery = matchesQuery.eq('football_league', leagueData.football_league);
  }

  const { data: matches } = await matchesQuery;
  const applicableMatches = (matches ?? []).filter((m: any) =>
    isMatchApplicableToLeague(m, leagueData)
  );

  const matchIds = applicableMatches.map((m: any) => m.id as string);

  if (matchIds.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  // Get predictions for those matches in this league
  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, points_earned, profiles(nickname, avatar_url)')
    .eq('league_id', leagueId)
    .in('match_id', matchIds);

  if (!predictions || predictions.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  // Aggregate points by user
  const userMap = new Map<string, { nickname: string; avatar_url: string | null; total_points: number }>();
  for (const pred of predictions as any[]) {
    const existing = userMap.get(pred.user_id);
    if (existing) {
      existing.total_points += pred.points_earned ?? 0;
    } else {
      userMap.set(pred.user_id, {
        nickname: pred.profiles?.nickname ?? 'Anónimo',
        avatar_url: pred.profiles?.avatar_url ?? null,
        total_points: pred.points_earned ?? 0,
      });
    }
  }

  // Sort descending and assign rank
  const leaderboard = Array.from(userMap.entries())
    .map(([user_id, d]) => ({ user_id, ...d }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return NextResponse.json({ leaderboard });
}
