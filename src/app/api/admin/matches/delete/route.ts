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
      // Borrar un partido específico
      const { error } = await supabaseAdmin
        .from('matches')
        .delete()
        .eq('id', match_id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Partido eliminado' });
    }

    if (before_date) {
      // Borrar todos los partidos antes de una fecha
      let query = supabaseAdmin.from('matches').delete().lt('match_date', before_date);
      if (status_filter && status_filter !== 'all') {
        query = supabaseAdmin.from('matches').delete()
          .lt('match_date', before_date)
          .eq('status', status_filter);
      }
      const { error, count } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Partidos eliminados correctamente`, count });
    }

    if (status_filter === 'all_matches') {
      // Borrar TODOS los partidos
      const { error } = await supabaseAdmin.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Todos los partidos eliminados' });
    }

    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  } catch (err: any) {
    console.error('Error al eliminar partidos:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar' }, { status: 500 });
  }
}
