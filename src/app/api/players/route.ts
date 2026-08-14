import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function getCoreTeamName(name: string): string {
  if (!name) return '';
  const n = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  if (n.includes('alaves')) return 'alaves';
  if (n.includes('athletic')) return 'athletic';
  if (n.includes('atletico')) return 'atletico';
  if (n.includes('barcelona')) return 'barcelona';
  if (n.includes('betis')) return 'betis';
  if (n.includes('celta')) return 'celta';
  if (n.includes('espanyol') || n.includes('español')) return 'espanyol';
  if (n.includes('getafe')) return 'getafe';
  if (n.includes('girona')) return 'girona';
  if (n.includes('las palmas')) return 'las palmas';
  if (n.includes('leganes')) return 'leganes';
  if (n.includes('mallorca')) return 'mallorca';
  if (n.includes('osasuna')) return 'osasuna';
  if (n.includes('rayo')) return 'rayo';
  if (n.includes('real madrid')) return 'real madrid';
  if (n.includes('real sociedad')) return 'real sociedad';
  if (n.includes('sevilla')) return 'sevilla';
  if (n.includes('valencia')) return 'valencia';
  if (n.includes('valladolid')) return 'valladolid';
  if (n.includes('villarreal')) return 'villarreal';
  
  // Fallback for Segunda Division teams if needed
  if (n.includes('racing')) return 'racing';
  if (n.includes('levante')) return 'levante';
  if (n.includes('malaga')) return 'malaga';
  if (n.includes('elche')) return 'elche';
  if (n.includes('deportivo')) return 'deportivo';
  
  return n.trim();
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

    const homeCore = getCoreTeamName(homeTeam);
    const awayCore = getCoreTeamName(awayTeam);

    const homePlayers = [];
    const awayPlayers = [];

    for (const player of allPlayers) {
      const pTeamCore = getCoreTeamName(player.team);
      if (pTeamCore && pTeamCore === homeCore) {
        homePlayers.push({ ...player, team: 'home' });
      } else if (pTeamCore && pTeamCore === awayCore) {
        awayPlayers.push({ ...player, team: 'away' });
      }
    }

    return NextResponse.json({ players: [...homePlayers, ...awayPlayers] });
  } catch (error) {
    console.error('Error reading players.json:', error);
    return NextResponse.json({ players: [] });
  }
}
