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
  const { code, league_id } = body;

  if (!code?.trim() && !league_id) {
    return NextResponse.json({ error: 'Código o ID de liga requerido' }, { status: 400 });
  }

  let league: any;

  if (league_id) {
    // Joining a public league directly by ID
    const { data, error } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', league_id)
      .eq('is_private', false)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Liga pública no encontrada.' }, { status: 404 });
    }
    league = data;
  } else {
    // Joining by invite code (private or public)
    const { data, error } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('code_to_join', code.trim().toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Código de liga no encontrado. Comprueba que es correcto.' }, { status: 404 });
    }
    league = data;
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
