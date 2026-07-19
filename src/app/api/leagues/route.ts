import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export async function POST(request: Request) {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { name, is_private, points_config } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('leagues')
    .insert({
      name: name.trim(),
      creator_id: user.id,
      is_private: is_private ?? true,
      football_league: 'laliga',
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

export async function DELETE(request: Request) {
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

  // Fetch league to verify creator & official status
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, creator_id, is_official')
    .eq('id', leagueId)
    .single();

  if (!league) {
    return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 });
  }

  const isAdmin = ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(user.email ?? '');
  const isCreator = league.creator_id === user.id;

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: 'No tienes permisos para eliminar esta liga' }, { status: 403 });
  }

  // Delete predictions, members, and the league
  await supabaseAdmin.from('predictions').delete().eq('league_id', leagueId);
  await supabaseAdmin.from('league_members').delete().eq('league_id', leagueId);
  const { error } = await supabaseAdmin.from('leagues').delete().eq('id', leagueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Liga eliminada correctamente' });
}
