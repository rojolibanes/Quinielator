import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('id');

  if (!leagueId) {
    return NextResponse.json({ error: 'ID de liga requerido' }, { status: 400 });
  }

  // Fetch members and their profiles
  const { data: members, error } = await supabaseAdmin
    .from('league_members')
    .select(`
      user_id,
      profiles:user_id (
        id,
        nickname,
        avatar_url,
        email
      )
    `)
    .eq('league_id', leagueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}
