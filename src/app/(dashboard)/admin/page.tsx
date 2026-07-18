import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';
import type { Match } from '@/types';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check admin access
  const isAdmin = ADMIN_EMAILS.includes(user.email ?? '') || ADMIN_EMAILS.length === 0;
  if (!isAdmin) {
    redirect('/dashboard');
  }

  // Get all matches for admin panel
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false });

  return <AdminClient matches={(matches ?? []) as Match[]} />;
}
