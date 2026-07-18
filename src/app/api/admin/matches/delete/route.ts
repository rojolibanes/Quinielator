import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const isAdmin = ADMIN_EMAILS.includes(user.email ?? '') || ADMIN_EMAILS.length === 0;
  return isAdmin ? user : null;
}

/**
 * Recalcula el total de puntos de todos los usuarios en todas las ligas
 * sumando únicamente las predicciones que aún existen en la base de datos.
 */
async function syncUserTotalPoints(supabaseAdmin: any) {
  const { data: members } = await supabaseAdmin
    .from('league_members')
    .select('league_id, user_id');

  if (!members || members.length === 0) return;

  for (const m of members) {
    const { data: preds } = await supabaseAdmin
      .from('predictions')
      .select('points_earned')
      .eq('league_id', m.league_id)
      .eq('user_id', m.user_id);

    const total = (preds || []).reduce((acc: number, p: any) => acc + (p.points_earned || 0), 0);

    await supabaseAdmin
      .from('league_members')
      .update({ total_points: total })
      .eq('league_id', m.league_id)
      .eq('user_id', m.user_id);
  }
}

export async function DELETE(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { match_id, before_date, status_filter } = body;

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    if (match_id) {
      // 1. Borrar predicciones asociadas a este partido
      await supabaseAdmin
        .from('predictions')
        .delete()
        .eq('match_id', match_id);

      // 2. Borrar el partido
      const { error } = await supabaseAdmin
        .from('matches')
        .delete()
        .eq('id', match_id);

      if (error) throw error;

      // 3. Recalcular la clasificación de todos los usuarios
      await syncUserTotalPoints(supabaseAdmin);

      return NextResponse.json({ success: true, message: 'Partido y puntos eliminados correctamente' });
    }

    if (before_date) {
      // Obtener partidos anteriores a la fecha
      let query = supabaseAdmin.from('matches').select('id').lt('match_date', before_date);
      if (status_filter && status_filter !== 'all') {
        query = supabaseAdmin.from('matches').select('id')
          .lt('match_date', before_date)
          .eq('status', status_filter);
      }
      const { data: matchesToDelete } = await query;
      const matchIds = (matchesToDelete || []).map((m: any) => m.id);

      if (matchIds.length > 0) {
        // 1. Borrar predicciones asociadas
        await supabaseAdmin
          .from('predictions')
          .delete()
          .in('match_id', matchIds);

        // 2. Borrar los partidos
        const { error } = await supabaseAdmin
          .from('matches')
          .delete()
          .in('id', matchIds);

        if (error) throw error;
      }

      // 3. Recalcular la clasificación de todos los usuarios
      await syncUserTotalPoints(supabaseAdmin);

      return NextResponse.json({
        success: true,
        message: `Se han eliminado ${matchIds.length} partidos y se han recalculado todos los puntos`,
        count: matchIds.length,
      });
    }

    if (status_filter === 'all_matches') {
      // 1. Borrar TODAS las predicciones
      await supabaseAdmin.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 2. Borrar TODOS los partidos
      const { error } = await supabaseAdmin.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;

      // 3. Resetear total_points de todos los usuarios a 0
      await supabaseAdmin
        .from('league_members')
        .update({ total_points: 0 })
        .neq('league_id', '00000000-0000-0000-0000-000000000000');

      return NextResponse.json({ success: true, message: 'Todos los partidos y puntos han sido eliminados' });
    }

    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  } catch (err: any) {
    console.error('Error al eliminar partidos:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar' }, { status: 500 });
  }
}
