import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import type { Profile } from '@/types';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isAdmin = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(user.email ?? '');

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar profile={profile as Profile | null} isAdmin={isAdmin} />
      {/* Content with proper top padding for mobile navbar (pt-16) and desktop (md:pt-20) */}
      <main className="pt-16 md:pt-20 pb-24 md:pb-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
