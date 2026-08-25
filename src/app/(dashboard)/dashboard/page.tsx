import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import type { League, Profile } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, officialLeagueRes, latestMatchRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('leagues').select('*').eq('is_official', true).single(),
    supabase.from('matches').select('matchday').order('matchday', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const profile = profileRes.data as Profile;
  const officialLeague = officialLeagueRes.data as League | null;
  const defaultMatchday = latestMatchRes.data?.matchday ?? 1;

  // Auto-join official league if not already a member
  if (officialLeague) {
    await supabase
      .from('league_members')
      .upsert({ league_id: officialLeague.id, user_id: user.id }, { onConflict: 'league_id,user_id' });
  }

  return (
    <DashboardClient
      profile={profile}
      officialLeague={officialLeague}
      defaultMatchday={defaultMatchday}
    />
  );
}
