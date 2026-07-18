import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { league_id, match_id, predicted_home_score, predicted_away_score, predicted_scorers, predicted_mvp } = body;

  if (!league_id || !match_id || predicted_home_score === undefined || predicted_away_score === undefined) {
    return NextResponse.json({ error: 'Faltan datos obligatorios para la predicción.' }, { status: 400 });
  }

  // Check match deadline using admin client
  const { data: match, error: matchError } = await supabaseAdmin
    .from('matches')
    .select('status, match_date')
    .eq('id', match_id)
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: 'Partido no encontrado.' }, { status: 404 });
  }

  if (match.status !== 'pending' || new Date(match.match_date) < new Date()) {
    return NextResponse.json({ error: 'El plazo para guardar predicciones para este partido ha finalizado.' }, { status: 400 });
  }

  // Upsert prediction using admin client to guarantee session permissions
  const { data: prediction, error: predError } = await supabaseAdmin
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        league_id,
        match_id,
        predicted_home_score: Number(predicted_home_score),
        predicted_away_score: Number(predicted_away_score),
        predicted_scorers: predicted_scorers || [],
        predicted_mvp: predicted_mvp || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,league_id,match_id' }
    )
    .select()
    .single();

  if (predError) {
    return NextResponse.json({ error: predError.message }, { status: 500 });
  }

  return NextResponse.json({ prediction });
}
