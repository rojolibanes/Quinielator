import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LeaderboardClient from './LeaderboardClient';
import type { League, LeaderboardEntry } from '@/types';

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user's leagues
  const { data: memberships } = await supabase
    .from('league_members')
    .select('leagues(*)')
    .eq('user_id', user.id);

  const leagues = (memberships ?? []).map((m: any) => m.leagues).filter(Boolean) as League[];

  // Get official league as default
  const defaultLeague = leagues.find(l => l.is_official) ?? leagues[0] ?? null;

  let leaderboard: LeaderboardEntry[] = [];
  if (defaultLeague) {
    const { data } = await supabase
      .from('league_members')
      .select('user_id, total_points, profiles(nickname, avatar_url)')
      .eq('league_id', defaultLeague.id)
      .order('total_points', { ascending: false });

    leaderboard = (data ?? []).map((row: any, i: number) => ({
      rank: i + 1,
      user_id: row.user_id,
      nickname: row.profiles?.nickname ?? 'Anónimo',
      avatar_url: row.profiles?.avatar_url ?? null,
      total_points: row.total_points,
    }));
  }

  return (
    <LeaderboardClient
      leagues={leagues}
      initialLeague={defaultLeague}
      initialLeaderboard={leaderboard}
      currentUserId={user.id}
    />
  );
}
