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

  // Get user predictions statistics
  const { data: predictions } = await supabase
    .from('predictions')
    .select('points_earned, predicted_home_score, predicted_away_score, match_id')
    .eq('user_id', user.id);

  const preds = predictions || [];
  const totalPredictions = preds.length;
  const totalPoints = preds.reduce((acc, p) => acc + (p.points_earned || 0), 0);
  const exactScores = preds.filter(p => (p.points_earned || 0) >= 20).length;

  return (
    <ProfileClient
      profile={profile as Profile}
      stats={{
        totalPredictions,
        totalPoints,
        exactScores,
      }}
    />
  );
}
