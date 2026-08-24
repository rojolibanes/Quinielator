import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

  // ── Return list of matchdays with at least 1 finished match ──
  if (matchday === 'available') {
    const { data } = await supabase
      .from('matches')
      .select('matchday')
      .eq('status', 'finished')
      .order('matchday', { ascending: true });

    const matchdays = Array.from(new Set((data ?? []).map((m: any) => m.matchday as number))).sort((a, b) => a - b);
    return NextResponse.json({ matchdays });
  }

  // ── Return leaderboard for a specific matchday ──
  const matchdayNum = Number(matchday);
  if (!matchday || isNaN(matchdayNum)) {
    return NextResponse.json({ error: 'matchday debe ser un número' }, { status: 400 });
  }

  // Get all finished match IDs for this matchday
  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('matchday', matchdayNum)
    .eq('status', 'finished');

  const matchIds = (matches ?? []).map((m: any) => m.id as string);

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
