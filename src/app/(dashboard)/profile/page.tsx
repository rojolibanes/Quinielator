import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';
import type { Profile } from '@/types';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user predictions with finished matches to compute exact % and 1X2 %
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      points_earned,
      predicted_home_score,
      predicted_away_score,
      matches ( home_score, away_score, status )
    `)
    .eq('user_id', user.id);

  const preds = predictions || [];

  const finishedPreds = preds.filter((p: any) =>
    p.matches &&
    p.matches.status === 'finished' &&
    p.matches.home_score !== null &&
    p.matches.away_score !== null
  );

  const totalFinished = finishedPreds.length;

  // Exact score hits
  const exactCount = finishedPreds.filter((p: any) =>
    p.predicted_home_score === p.matches.home_score &&
    p.predicted_away_score === p.matches.away_score
  ).length;

  const exactPct = totalFinished > 0 ? Math.round((exactCount / totalFinished) * 100) : 0;

  // 1X2 hits
  const result1X2Count = finishedPreds.filter((p: any) => {
    const predSign = p.predicted_home_score > p.predicted_away_score ? 'H' : p.predicted_home_score < p.predicted_away_score ? 'A' : 'D';
    const realSign = p.matches.home_score > p.matches.away_score ? 'H' : p.matches.home_score < p.matches.away_score ? 'A' : 'D';
    return predSign === realSign;
  }).length;

  const result1X2Pct = totalFinished > 0 ? Math.round((result1X2Count / totalFinished) * 100) : 0;

  // Total points sum across user's leagues
  const { data: memberships } = await supabase
    .from('league_members')
    .select('total_points')
    .eq('user_id', user.id);

  const totalPoints = (memberships || []).reduce((acc: number, m: any) => acc + (m.total_points || 0), 0);

  return (
    <ProfileClient
      profile={profile as Profile}
      stats={{
        totalPoints,
        exactPct,
        result1X2Pct,
        totalFinished,
      }}
    />
  );
}
