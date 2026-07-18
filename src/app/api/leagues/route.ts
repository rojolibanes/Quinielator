import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { name, is_private, football_league, points_config } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('leagues')
    .insert({
      name: name.trim(),
      creator_id: user.id,
      is_private: is_private ?? true,
      football_league: football_league ?? 'laliga',
      points_config: points_config,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  await supabaseAdmin
    .from('league_members')
    .insert({ league_id: data.id, user_id: user.id });

  return NextResponse.json({ league: data });
}
