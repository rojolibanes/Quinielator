import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'api-football-v1.p.rapidapi.com';

const LA_LIGA_ID = 140; // La Liga Española
const SEASON = 2024;

export async function GET(request: NextRequest) {
  // 1. Verify CRON_SECRET if configured
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

    // Action A: Sync Fixtures (Calendario y partidos)
    if (action === 'fixtures' || action === 'all') {
      const fixturesResult = await syncFixtures(matchday);
      summary.fixtures = fixturesResult;
    }

    // Action B: Sync Results & Recalculate Points
    if (action === 'results' || action === 'all') {
      const resultsSummary = await syncResults();
      summary.results = resultsSummary;
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

async function syncFixtures(specificMatchday: number | null) {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your-rapidapi-key') {
    return { status: 'skipped', reason: 'RAPIDAPI_KEY no configurada' };
  }

  // If matchday specified, sync that one. Otherwise default to round 1 or recent.
  const roundString = specificMatchday ? `Regular Season - ${specificMatchday}` : undefined;
  const url = new URL(`https://${RAPIDAPI_HOST}/v3/fixtures`);
  url.searchParams.append('league', String(LA_LIGA_ID));
  url.searchParams.append('season', String(SEASON));
  if (roundString) {
    url.searchParams.append('round', roundString);
  } else {
    url.searchParams.append('next', '10'); // Next 10 matches by default
  }

  const res = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  });

  const json = await res.json();
  const apiFixtures = json.response || [];

  let syncedCount = 0;

  for (const item of apiFixtures) {
    const homeTeam = item.teams?.home?.name;
    const awayTeam = item.teams?.away?.name;
    const homeLogo = item.teams?.home?.logo;
    const awayLogo = item.teams?.away?.logo;
    const date = item.fixture?.date;
    const statusShort = item.fixture?.status?.short; // NS, 1H, 2H, FT, etc.
    const roundName = item.league?.round || '';
    const matchdayMatch = roundName.match(/\d+/);
    const matchday = matchdayMatch ? parseInt(matchdayMatch[0]) : 1;

    let status = 'pending';
    if (['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(statusShort)) status = 'live';
    if (['FT', 'AET', 'PEN'].includes(statusShort)) status = 'finished';

    if (!homeTeam || !awayTeam || !date) continue;

    // Check if match exists in Supabase
    const { data: existing } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('home_team', homeTeam)
      .eq('away_team', awayTeam)
      .eq('matchday', matchday)
      .maybeSingle();

    if (existing) {
      // Update
      await supabaseAdmin
        .from('matches')
        .update({
          match_date: date,
          home_team_logo: homeLogo,
          away_team_logo: awayLogo,
          status,
        })
        .eq('id', existing.id);
    } else {
      // Insert
      await supabaseAdmin.from('matches').insert({
        home_team: homeTeam,
        away_team: awayTeam,
        home_team_logo: homeLogo,
        away_team_logo: awayLogo,
        matchday,
        match_date: date,
        football_league: 'laliga',
        status,
      });
    }
    syncedCount++;
  }

  return { status: 'success', syncedCount, matchesFound: apiFixtures.length };
}

async function syncResults() {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your-rapidapi-key') {
    return { status: 'skipped', reason: 'RAPIDAPI_KEY no configurada' };
  }

  // Get pending or live matches from Supabase
  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .in('status', ['pending', 'live']);

  if (!matches || matches.length === 0) {
    return { status: 'success', updated: 0, message: 'No hay partidos pendientes' };
  }

  let updatedCount = 0;

  for (const match of matches) {
    // Check if match date is close to now or past
    const matchDate = new Date(match.match_date).getTime();
    const now = Date.now();
    // Only check if match started or is within 15 minutes of starting
    if (now < matchDate - 15 * 60 * 1000) continue;

    // Fetch live/recent status from API-Football for this fixture by teams
    const url = new URL(`https://${RAPIDAPI_HOST}/v3/fixtures`);
    url.searchParams.append('league', String(LA_LIGA_ID));
    url.searchParams.append('season', String(SEASON));
    url.searchParams.append('date', match.match_date.split('T')[0]);

    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    const json = await res.json();
    const fixtures = json.response || [];

    const matchedFixture = fixtures.find((f: any) =>
      f.teams?.home?.name?.toLowerCase().includes(match.home_team.toLowerCase()) ||
      f.teams?.away?.name?.toLowerCase().includes(match.away_team.toLowerCase())
    );

    if (matchedFixture) {
      const statusShort = matchedFixture.fixture?.status?.short;
      const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);

      if (isFinished) {
        const homeScore = matchedFixture.goals?.home ?? 0;
        const awayScore = matchedFixture.goals?.away ?? 0;

        // Fetch events for scorers
        const eventsRes = await fetch(`https://${RAPIDAPI_HOST}/v3/fixtures/events?fixture=${matchedFixture.fixture.id}`, {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          },
        });
        const eventsJson = await eventsRes.json();
        const events = eventsJson.response || [];

        const scorers = events
          .filter((e: any) => e.type === 'Goal' && e.detail !== 'Missed Penalty')
          .map((e: any) => ({
            player_id: e.player.id,
            name: e.player.name,
            team: e.team.name === matchedFixture.teams.home.name ? 'home' : 'away',
            photo: e.player.photo || '',
          }));

        // Update match in Supabase
        await supabaseAdmin
          .from('matches')
          .update({
            home_score: homeScore,
            away_score: awayScore,
            scorers,
            status: 'finished',
          })
          .eq('id', match.id);

        // Recalculate points for predictions
        await supabaseAdmin.rpc('recalculate_match_points', { p_match_id: match.id });

        updatedCount++;
      }
    }
  }

  return { status: 'success', updated: updatedCount };
}
