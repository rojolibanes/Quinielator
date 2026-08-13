import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Helper to normalize strings for comparison (removes accents, lowercase, removes common words)
function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace('fc', '')
    .replace('cf', '')
    .replace('cd', '')
    .replace('deportivo', '')
    .replace('real', '')
    .replace('athletic club', 'athletic')
    .replace('vallecano', '')
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeTeam = searchParams.get('home') ?? '';
  const awayTeam = searchParams.get('away') ?? '';

  try {
    // Read local players.json
    const filePath = path.join(process.cwd(), 'src', 'data', 'players.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    const allPlayers = data.players || [];

    const homeNorm = normalizeTeamName(homeTeam);
    const awayNorm = normalizeTeamName(awayTeam);

    const homePlayers = [];
    const awayPlayers = [];

    for (const player of allPlayers) {
      const pTeamNorm = normalizeTeamName(player.team);
      if (pTeamNorm && homeNorm.includes(pTeamNorm) || homeNorm === pTeamNorm) {
        homePlayers.push({ ...player, team: 'home' });
      } else if (pTeamNorm && awayNorm.includes(pTeamNorm) || awayNorm === pTeamNorm) {
        awayPlayers.push({ ...player, team: 'away' });
      }
    }
    
    // Fallback logic for Real Madrid / Real Sociedad where "real" is stripped
    // Let's do a more robust fallback just in case
    if (homePlayers.length === 0) {
      const fallback = allPlayers.filter((p: any) => p.team.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0]));
      fallback.forEach((p: any) => homePlayers.push({ ...p, team: 'home' }));
    }
    if (awayPlayers.length === 0) {
      const fallback = allPlayers.filter((p: any) => p.team.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0]));
      fallback.forEach((p: any) => awayPlayers.push({ ...p, team: 'away' }));
    }

    return NextResponse.json({ players: [...homePlayers, ...awayPlayers] });
  } catch (error) {
    console.error('Error reading players.json:', error);
    return NextResponse.json({ players: [] });
  }
}
