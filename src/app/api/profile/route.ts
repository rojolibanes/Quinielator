import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { nickname, avatar_url, favorite_team, tagline } = body;

  if (nickname !== undefined) {
    const trimmed = String(nickname).trim().replace(/\s/g, '');
    if (trimmed.length < 3 || trimmed.length > 20) {
      return NextResponse.json({ error: 'El nombre de usuario debe tener entre 3 y 20 caracteres' }, { status: 400 });
    }
  }

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updates: Record<string, any> = {};
  if (nickname !== undefined) updates.nickname = String(nickname).trim().replace(/\s/g, '');
  if (avatar_url !== undefined) updates.avatar_url = avatar_url ? String(avatar_url).trim() : null;
  if (favorite_team !== undefined) updates.favorite_team = favorite_team ? String(favorite_team).trim() : null;
  if (tagline !== undefined) updates.tagline = tagline ? String(tagline).trim().slice(0, 80) : null;

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ese nombre de usuario ya está ocupado' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err: any) {
    console.error('Error al actualizar el perfil:', err);
    return NextResponse.json({ error: err.message || 'Error al guardar cambios' }, { status: 500 });
  }
}
