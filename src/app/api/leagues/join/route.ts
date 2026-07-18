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
  const { code } = body;

  if (!code?.trim()) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
  }

  // Use admin client to find the league by code (bypasses RLS so private leagues are findable)
  const { data: league, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .select('*')
    .eq('code_to_join', code.trim().toUpperCase())
    .single();

  if (leagueError || !league) {
    return NextResponse.json({ error: 'Código de liga no encontrado. Comprueba que es correcto.' }, { status: 404 });
  }

  // Check if user is already a member
  const { data: existing } = await supabaseAdmin
    .from('league_members')
    .select('user_id')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Ya eres miembro de esta liga.' }, { status: 409 });
  }

  // Join the league
  const { error: joinError } = await supabaseAdmin
    .from('league_members')
    .insert({ league_id: league.id, user_id: user.id });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  return NextResponse.json({ league });
}
