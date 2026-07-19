import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LeaguesClient from './LeaguesClient';
import type { PointsConfig } from '@/types';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export default async function LeaguesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const isAdmin = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(user.email ?? '');

  // Fetch user's leagues with member count and user points
  const { data: memberships } = await supabase
    .from('league_members')
    .select(`
      total_points,
      leagues (
        id, name, creator_id, is_private, is_official, code_to_join, football_league, points_config
      )
    `)
    .eq('user_id', user.id);

  // Get member counts for each league
  const leagueIds = memberships?.map((m: any) => m.leagues?.id).filter(Boolean) ?? [];
  const { data: memberCounts } = await supabase
    .from('league_members')
    .select('league_id')
    .in('league_id', leagueIds);

  const countMap = (memberCounts ?? []).reduce((acc: Record<string, number>, row: any) => {
    acc[row.league_id] = (acc[row.league_id] || 0) + 1;
    return acc;
  }, {});

  const userLeagues = (memberships ?? [])
    .filter((m: any) => m.leagues)
    .map((m: any) => ({
      league: {
        id: m.leagues.id,
        name: m.leagues.name,
        creator_id: m.leagues.creator_id,
        is_private: m.leagues.is_private,
        is_official: m.leagues.is_official,
        code_to_join: m.leagues.code_to_join,
        football_league: m.leagues.football_league,
        points_config: m.leagues.points_config as PointsConfig,
      },
      total_points: m.total_points,
      member_count: countMap[m.leagues.id] || 1,
    }));

  return <LeaguesClient userId={user.id} isAdmin={isAdmin} userLeagues={userLeagues} />;
}
