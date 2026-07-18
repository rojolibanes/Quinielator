import axios from 'axios';
import type { APIFootballTeamSquad } from '@/types';

const rapidApiKey = process.env.RAPIDAPI_KEY!;
const rapidApiHost = process.env.RAPIDAPI_HOST || 'api-football-v1.p.rapidapi.com';

// League IDs in API-Football
export const LEAGUE_IDS = {
  laliga: 140,        // La Liga Española
  champions: 2,       // UEFA Champions League
  europa_league: 3,   // UEFA Europa League
  copa_rey: 143,      // Copa del Rey
};

export const SEASON = 2024; // 2024-25 season

const apiClient = axios.create({
  baseURL: `https://${rapidApiHost}/v3`,
  headers: {
    'X-RapidAPI-Key': rapidApiKey,
    'X-RapidAPI-Host': rapidApiHost,
  },
});

// ────────────────────────────────────────────────────────────
// Get squad (players) for a team
// ────────────────────────────────────────────────────────────
export async function getTeamSquad(teamId: number): Promise<APIFootballTeamSquad | null> {
  try {
    const response = await apiClient.get('/players/squads', {
      params: { team: teamId },
    });
    return response.data.response?.[0] ?? null;
  } catch (error) {
    console.error('API-Football error fetching squad:', error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// Get fixtures for a specific matchday
// ────────────────────────────────────────────────────────────
export async function getFixturesByMatchday(
  leagueId: number,
  matchday: number,
  season = SEASON
) {
  try {
    const response = await apiClient.get('/fixtures', {
      params: {
        league: leagueId,
        season,
        round: `Regular Season - ${matchday}`,
      },
    });
    return response.data.response ?? [];
  } catch (error) {
    console.error('API-Football error fetching fixtures:', error);
    return [];
  }
}

// ────────────────────────────────────────────────────────────
// Get match statistics and lineups (for scorers/MVP data)
// ────────────────────────────────────────────────────────────
export async function getFixtureDetails(fixtureId: number) {
  try {
    const [stats, events, lineups] = await Promise.all([
      apiClient.get('/fixtures/statistics', { params: { fixture: fixtureId } }),
      apiClient.get('/fixtures/events', { params: { fixture: fixtureId } }),
      apiClient.get('/fixtures/lineups', { params: { fixture: fixtureId } }),
    ]);

    return {
      statistics: stats.data.response ?? [],
      events: events.data.response ?? [],
      lineups: lineups.data.response ?? [],
    };
  } catch (error) {
    console.error('API-Football error fetching fixture details:', error);
    return { statistics: [], events: [], lineups: [] };
  }
}

// ────────────────────────────────────────────────────────────
// Get players for a specific match (for scorer/MVP selection)
// ────────────────────────────────────────────────────────────
export async function getMatchPlayers(homeTeamId: number, awayTeamId: number) {
  try {
    const [homeSquad, awaySquad] = await Promise.all([
      getTeamSquad(homeTeamId),
      getTeamSquad(awayTeamId),
    ]);

    const homePlayers = homeSquad?.players.map(p => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      position: p.position,
      team: 'home' as const,
    })) ?? [];

    const awayPlayers = awaySquad?.players.map(p => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      position: p.position,
      team: 'away' as const,
    })) ?? [];

    return { homePlayers, awayPlayers };
  } catch (error) {
    console.error('Error fetching match players:', error);
    return { homePlayers: [], awayPlayers: [] };
  }
}

// ────────────────────────────────────────────────────────────
// Parse scorers from API-Football events
// ────────────────────────────────────────────────────────────
export function parseScorersFromEvents(events: any[], homeTeamId: number) {
  return events
    .filter((e: any) => e.type === 'Goal' && e.detail !== 'Missed Penalty')
    .map((e: any) => ({
      player_id: e.player.id,
      name: e.player.name,
      team: e.team.id === homeTeamId ? 'home' : 'away',
      photo: e.player.photo || '',
    }));
}
