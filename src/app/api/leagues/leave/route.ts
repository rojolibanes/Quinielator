import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('id');
  const newCreatorId = searchParams.get('new_creator_id');

  if (!leagueId) {
    return NextResponse.json({ error: 'ID de liga requerido' }, { status: 400 });
  }

  // Fetch league to check if user is creator
  const { data: league, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .select('creator_id, is_official')
    .eq('id', leagueId)
    .single();

  if (leagueError || !league) {
    return NextResponse.json({ error: 'Liga no encontrada' }, { status: 404 });
  }

  if (league.is_official) {
    return NextResponse.json({ error: 'No puedes abandonar una liga oficial' }, { status: 400 });
  }

  if (league.creator_id === user.id) {
    // If user is creator, they must either transfer ownership or delete the league.
    // If they provided a new_creator_id, update it.
    if (newCreatorId) {
      // Verify new creator is actually a member
      const { data: member } = await supabaseAdmin
        .from('league_members')
        .select('*')
        .eq('league_id', leagueId)
        .eq('user_id', newCreatorId)
        .single();
        
      if (!member) {
        return NextResponse.json({ error: 'El nuevo administrador propuesto no es miembro de la liga' }, { status: 400 });
      }

      await supabaseAdmin.from('leagues').update({ creator_id: newCreatorId }).eq('id', leagueId);
    } else {
      // If no new creator is provided and they are the creator, they should probably be deleting the league instead,
      // but let's allow it in case they are the ONLY member (handled on client side).
      // If they are the only member, we should delete the league.
      const { count } = await supabaseAdmin
        .from('league_members')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId);
        
      if (count === 1) {
        // Delete the league
        await supabaseAdmin.from('predictions').delete().eq('league_id', leagueId);
        await supabaseAdmin.from('league_members').delete().eq('league_id', leagueId);
        await supabaseAdmin.from('leagues').delete().eq('id', leagueId);
        return NextResponse.json({ success: true, action: 'deleted' });
      } else {
        return NextResponse.json({ error: 'Debes nombrar a un nuevo administrador antes de abandonar la liga' }, { status: 400 });
      }
    }
  }

  // Delete predictions for this user in this league
  await supabaseAdmin.from('predictions').delete().match({ league_id: leagueId, user_id: user.id });
  
  // Remove user from league_members
  const { error: removeError } = await supabaseAdmin.from('league_members').delete().match({ league_id: leagueId, user_id: user.id });

  if (removeError) {
    return NextResponse.json({ error: removeError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, action: 'left' });
}
