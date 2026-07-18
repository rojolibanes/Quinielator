import { NextRequest, NextResponse } from 'next/server';
import { syncFixtures, syncResults } from '@/lib/api-football/sync';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && secretParam !== cronSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const action = searchParams.get('action') || 'all';
  const matchdayParam = searchParams.get('matchday');
  const matchday = matchdayParam ? parseInt(matchdayParam) : null;

  try {
    const summary: Record<string, any> = {};

    if (action === 'fixtures' || action === 'all') {
      summary.fixtures = await syncFixtures(matchday);
    }

    if (action === 'results' || action === 'all') {
      summary.results = await syncResults();
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error: any) {
    console.error('Error en sync-football cron:', error);
    return NextResponse.json({ error: error.message || 'Error en la sincronización' }, { status: 500 });
  }
}
