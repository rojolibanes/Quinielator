import { NextRequest, NextResponse } from 'next/server';

// Team name to API-Football team ID mapping for La Liga 2024-25
const TEAM_IDS: Record<string, number> = {
  'Real Madrid': 541,
  'FC Barcelona': 529,
  'Atlético de Madrid': 530,
  'Athletic Club': 531,
  'Real Sociedad': 548,
  'Villarreal': 533,
  'Real Betis': 543,
  'Valencia CF': 532,
  'Celta de Vigo': 538,
  'Osasuna': 727,
  'Sevilla FC': 536,
  'Rayo Vallecano': 728,
  'Getafe CF': 546,
  'UD Las Palmas': 798,
  'Deportivo Alavés': 542,
  'Girona FC': 547,
  'RCD Espanyol': 539,
  'RCD Mallorca': 723,
  'CD Leganés': 724,
  'Real Valladolid': 720,
};

// In-memory cache to avoid hitting rate limits (cache for 1 hour)
const cache: Map<string, { data: any; expires: number }> = new Map();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeTeam = searchParams.get('home') ?? '';
  const awayTeam = searchParams.get('away') ?? '';

  const cacheKey = `${homeTeam}|${awayTeam}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const homeId = TEAM_IDS[homeTeam];
  const awayId = TEAM_IDS[awayTeam];

  // If no API key or team IDs not found, return mock players
  if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your-rapidapi-key') {
    const mockData = generateMockPlayers(homeTeam, awayTeam);
    return NextResponse.json(mockData);
  }

  if (!homeId || !awayId) {
    const mockData = generateMockPlayers(homeTeam, awayTeam);
    return NextResponse.json(mockData);
  }

  const host = process.env.RAPIDAPI_HOST || 'v3.football.api-sports.io';
  const apiKey = process.env.RAPIDAPI_KEY!;
  const baseUrl = host.includes('rapidapi') ? `https://${host}/v3` : `https://${host}`;
  const headers: Record<string, string> = host.includes('rapidapi')
    ? { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host }
    : { 'x-apisports-key': apiKey };

  try {
    const [homeRes, awayRes] = await Promise.all([
      fetch(`${baseUrl}/players/squads?team=${homeId}`, { headers }),
      fetch(`${baseUrl}/players/squads?team=${awayId}`, { headers }),
    ]);

    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);

    const homePlayers = (homeData.response?.[0]?.players ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      position: p.position,
      team: 'home',
    }));

    const awayPlayers = (awayData.response?.[0]?.players ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      position: p.position,
      team: 'away',
    }));

    const result = { players: [...homePlayers, ...awayPlayers] };

    // Cache for 1 hour
    cache.set(cacheKey, { data: result, expires: Date.now() + 60 * 60 * 1000 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API-Football error:', error);
    return NextResponse.json(generateMockPlayers(homeTeam, awayTeam));
  }
}

// Generate realistic mock players when API is not configured
function generateMockPlayers(homeTeam: string, awayTeam: string) {
  const MOCK_PLAYERS: Record<string, string[]> = {
    'Real Madrid': ['Vinicius Jr.', 'Bellingham', 'Mbappé', 'Rodrygo', 'Valverde', 'Modric', 'Camavinga', 'Tchouaméni', 'Militão', 'Carvajal', 'Alaba', 'Rüdiger', 'Courtois', 'Lunin'],
    'FC Barcelona': ['Lewandowski', 'Yamal', 'Raphinha', 'Pedri', 'Gavi', 'Dani Olmo', 'De Jong', 'Koundé', 'Cubarsí', 'Balde', 'Iñigo Martínez', 'ter Stegen', 'Flick'],
    'Atlético de Madrid': ['Morata', 'Griezmann', 'Correa', 'De Paul', 'Koke', 'Llorente', 'Witsel', 'Hermoso', 'Giménez', 'Molina', 'Nahuel', 'Oblak'],
    'Athletic Club': ['Williams I.', 'Williams N.', 'Guruzeta', 'Berenguer', 'Prados', 'Vesga', 'Jauregizar', 'De Marcos', 'Dani Vivian', 'Yeray', 'Paredes', 'Simón'],
  };

  const getPlayers = (teamName: string, side: 'home' | 'away') => {
    const names = MOCK_PLAYERS[teamName] ?? [
      'Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5',
      'Jugador 6', 'Jugador 7', 'Jugador 8', 'Jugador 9', 'Jugador 10', 'Jugador 11',
    ];
    return names.map((name, i) => ({
      id: side === 'home' ? i + 1 : i + 100,
      name,
      photo: '',
      position: i === 0 ? 'Goalkeeper' : i < 4 ? 'Defender' : i < 7 ? 'Midfielder' : 'Attacker',
      team: side,
    }));
  };

  return {
    players: [
      ...getPlayers(homeTeam, 'home'),
      ...getPlayers(awayTeam, 'away'),
    ],
  };
}
