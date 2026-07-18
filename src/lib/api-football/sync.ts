import { createClient } from '@supabase/supabase-js';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'v3.football.api-sports.io';

const LA_LIGA_ID = 140;
// Temporada actual: 2025 = temporada 2025-2026
// La API usa el año de inicio de la temporada (ej: 2025 para 2025/26)
const SEASON = 2025;

function getHeaders(): Record<string, string> {
  if (RAPIDAPI_HOST?.includes('rapidapi')) {
    return {
      'X-RapidAPI-Key': RAPIDAPI_KEY!,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    };
  }
  return {
    'x-apisports-key': RAPIDAPI_KEY!,
  };
}

function getBaseUrl() {
  if (RAPIDAPI_HOST?.includes('rapidapi')) {
    return `https://${RAPIDAPI_HOST}/v3`;
  }
  return `https://${RAPIDAPI_HOST}`;
}

export async function syncFixtures(specificMatchday: number | null) {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your-rapidapi-key') {
    return { status: 'skipped', reason: 'RAPIDAPI_KEY no configurada' };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const url = new URL(`${baseUrl}/fixtures`);
  url.searchParams.append('league', String(LA_LIGA_ID));
  url.searchParams.append('season', String(SEASON));
  if (specificMatchday) {
    // Jornada específica
    url.searchParams.append('round', `Regular Season - ${specificMatchday}`);
  } else {
    // Intentar los próximos 10 partidos; si no hay (pretemporada), coger los últimos 10
    url.searchParams.append('next', '10');
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const text = await res.text();
    console.error('API-Football error response:', res.status, text.slice(0, 200));
    return { status: 'error', reason: `API respondió con status ${res.status}` };
  }

  const json = await res.json();
  const apiFixtures = json.response || [];

  let syncedCount = 0;

  for (const item of apiFixtures) {
    const homeTeam = item.teams?.home?.name;
    const awayTeam = item.teams?.away?.name;
    const homeLogo = item.teams?.home?.logo;
    const awayLogo = item.teams?.away?.logo;
    const date = item.fixture?.date;
    const statusShort = item.fixture?.status?.short;
    const roundName = item.league?.round || '';
    const matchdayMatch = roundName.match(/\d+/);
    const matchday = matchdayMatch ? parseInt(matchdayMatch[0]) : 1;

    let status = 'pending';
    if (['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(statusShort)) status = 'live';
    if (['FT', 'AET', 'PEN'].includes(statusShort)) status = 'finished';

    if (!homeTeam || !awayTeam || !date) continue;

    const { data: existing } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('home_team', homeTeam)
      .eq('away_team', awayTeam)
      .eq('matchday', matchday)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('matches')
        .update({ match_date: date, home_team_logo: homeLogo, away_team_logo: awayLogo, status })
        .eq('id', existing.id);
    } else {
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

export async function syncResults() {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your-rapidapi-key') {
    return { status: 'skipped', reason: 'RAPIDAPI_KEY no configurada' };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .in('status', ['pending', 'live']);

  if (!matches || matches.length === 0) {
    return { status: 'success', updated: 0, message: 'No hay partidos pendientes' };
  }

  let updatedCount = 0;

  for (const match of matches) {
    const matchDate = new Date(match.match_date).getTime();
    const now = Date.now();
    if (now < matchDate - 15 * 60 * 1000) continue;

    const url = new URL(`${baseUrl}/fixtures`);
    url.searchParams.append('league', String(LA_LIGA_ID));
    url.searchParams.append('season', String(SEASON));
    url.searchParams.append('date', match.match_date.split('T')[0]);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) continue;

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

        const eventsRes = await fetch(`${baseUrl}/fixtures/events?fixture=${matchedFixture.fixture.id}`, { headers });
        const eventsJson = eventsRes.ok ? await eventsRes.json() : { response: [] };
        const events = eventsJson.response || [];

        const scorers = events
          .filter((e: any) => e.type === 'Goal' && e.detail !== 'Missed Penalty')
          .map((e: any) => ({
            player_id: e.player.id,
            name: e.player.name,
            team: e.team.name === matchedFixture.teams.home.name ? 'home' : 'away',
            photo: e.player.photo || '',
          }));

        await supabaseAdmin
          .from('matches')
          .update({ home_score: homeScore, away_score: awayScore, scorers, status: 'finished' })
          .eq('id', match.id);

        await supabaseAdmin.rpc('recalculate_match_points', { p_match_id: match.id });
        updatedCount++;
      }
    }
  }

  return { status: 'success', updated: updatedCount };
}
