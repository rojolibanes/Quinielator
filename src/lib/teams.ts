export interface TeamInfo {
  id: number;
  logo: string;
}

// Strictly the 20 teams of LaLiga Primera División
export const SPANISH_TEAMS: Record<string, TeamInfo> = {
  'Real Madrid': { id: 541, logo: 'https://media.api-sports.io/football/teams/541.png' },
  'FC Barcelona': { id: 529, logo: 'https://media.api-sports.io/football/teams/529.png' },
  'Atlético de Madrid': { id: 530, logo: 'https://media.api-sports.io/football/teams/530.png' },
  'Athletic Club': { id: 531, logo: 'https://media.api-sports.io/football/teams/531.png' },
  'Real Sociedad': { id: 548, logo: 'https://media.api-sports.io/football/teams/548.png' },
  'Villarreal': { id: 533, logo: 'https://media.api-sports.io/football/teams/533.png' },
  'Real Betis': { id: 543, logo: 'https://media.api-sports.io/football/teams/543.png' },
  'Valencia CF': { id: 532, logo: 'https://media.api-sports.io/football/teams/532.png' },
  'Celta de Vigo': { id: 538, logo: 'https://media.api-sports.io/football/teams/538.png' },
  'Osasuna': { id: 727, logo: 'https://media.api-sports.io/football/teams/727.png' },
  'Sevilla FC': { id: 536, logo: 'https://media.api-sports.io/football/teams/536.png' },
  'Rayo Vallecano': { id: 728, logo: 'https://media.api-sports.io/football/teams/728.png' },
  'Getafe CF': { id: 546, logo: 'https://media.api-sports.io/football/teams/546.png' },
  'UD Las Palmas': { id: 798, logo: 'https://media.api-sports.io/football/teams/798.png' },
  'Deportivo Alavés': { id: 542, logo: 'https://media.api-sports.io/football/teams/542.png' },
  'Girona FC': { id: 547, logo: 'https://media.api-sports.io/football/teams/547.png' },
  'RCD Espanyol': { id: 539, logo: 'https://media.api-sports.io/football/teams/539.png' },
  'RCD Mallorca': { id: 723, logo: 'https://media.api-sports.io/football/teams/723.png' },
  'CD Leganés': { id: 537, logo: 'https://media.api-sports.io/football/teams/537.png' },
  'Real Valladolid': { id: 720, logo: 'https://media.api-sports.io/football/teams/720.png' },
};

export const SPANISH_TEAM_NAMES = Object.keys(SPANISH_TEAMS).sort();

export function getTeamLogo(teamName: string): string {
  if (SPANISH_TEAMS[teamName]) {
    return SPANISH_TEAMS[teamName].logo;
  }
  const matchedKey = Object.keys(SPANISH_TEAMS).find(k => k.toLowerCase().includes(teamName.toLowerCase()));
  if (matchedKey) return SPANISH_TEAMS[matchedKey].logo;
  return '';
}

export function getTeamId(teamName: string): number | null {
  if (SPANISH_TEAMS[teamName]) {
    return SPANISH_TEAMS[teamName].id;
  }
  const matchedKey = Object.keys(SPANISH_TEAMS).find(k => k.toLowerCase().includes(teamName.toLowerCase()));
  if (matchedKey) return SPANISH_TEAMS[matchedKey].id;
  return null;
}
