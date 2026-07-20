export interface TeamInfo {
  id: number;
  logo: string;
}

// Strictly the 20 teams of LaLiga EA Sports (1ª División) for the 2026/27 season
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
  'Deportivo Alavés': { id: 542, logo: 'https://media.api-sports.io/football/teams/542.png' },
  'RCD Espanyol': { id: 539, logo: 'https://media.api-sports.io/football/teams/539.png' },
  'Racing Santander': { id: 4665, logo: 'https://media.api-sports.io/football/teams/4665.png' },
  'Deportivo de La Coruña': { id: 544, logo: 'https://media.api-sports.io/football/teams/544.png' },
  'Málaga CF': { id: 573, logo: 'https://media.api-sports.io/football/teams/573.png' },
  'Elche CF': { id: 797, logo: 'https://media.api-sports.io/football/teams/797.png' },
  'Levante UD': { id: 545, logo: 'https://media.api-sports.io/football/teams/545.png' },
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
