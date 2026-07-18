import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import type { Profile } from '@/types';

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

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar profile={profile as Profile | null} />
      {/* Content with padding for desktop top nav + mobile bottom nav */}
      <main className="md:pt-16 pb-20 md:pb-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
