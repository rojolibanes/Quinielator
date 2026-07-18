export interface TeamInfo {
  id: number;
  logo: string;
}

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
  'Racing Santander': { id: 4665, logo: 'https://media.api-sports.io/football/teams/4665.png' },
  'Real Oviedo': { id: 717, logo: 'https://media.api-sports.io/football/teams/717.png' },
  'Sporting de Gijón': { id: 718, logo: 'https://media.api-sports.io/football/teams/718.png' },
  'Real Zaragoza': { id: 719, logo: 'https://media.api-sports.io/football/teams/719.png' },
  'Levante UD': { id: 545, logo: 'https://media.api-sports.io/football/teams/545.png' },
  'Elche CF': { id: 797, logo: 'https://media.api-sports.io/football/teams/797.png' },
  'Granada CF': { id: 715, logo: 'https://media.api-sports.io/football/teams/715.png' },
  'Cádiz CF': { id: 724, logo: 'https://media.api-sports.io/football/teams/724.png' },
  'UD Almería': { id: 721, logo: 'https://media.api-sports.io/football/teams/721.png' },
  'Deportivo de La Coruña': { id: 544, logo: 'https://media.api-sports.io/football/teams/544.png' },
  'SD Eibar': { id: 535, logo: 'https://media.api-sports.io/football/teams/535.png' },
  'SD Huesca': { id: 722, logo: 'https://media.api-sports.io/football/teams/722.png' },
  'CD Tenerife': { id: 726, logo: 'https://media.api-sports.io/football/teams/726.png' },
  'Albacete Balompié': { id: 716, logo: 'https://media.api-sports.io/football/teams/716.png' },
  'FC Cartagena': { id: 725, logo: 'https://media.api-sports.io/football/teams/725.png' },
  'Burgos CF': { id: 9642, logo: 'https://media.api-sports.io/football/teams/9642.png' },
  'CD Eldense': { id: 15316, logo: 'https://media.api-sports.io/football/teams/15316.png' },
  'Racing de Ferrol': { id: 9645, logo: 'https://media.api-sports.io/football/teams/9645.png' },
  'CD Castellón': { id: 15314, logo: 'https://media.api-sports.io/football/teams/15314.png' },
  'Málaga CF': { id: 535, logo: 'https://media.api-sports.io/football/teams/535.png' },
  'Córdoba CF': { id: 714, logo: 'https://media.api-sports.io/football/teams/714.png' },
  'CD Mirandés': { id: 729, logo: 'https://media.api-sports.io/football/teams/729.png' },
};

export const SPANISH_TEAM_NAMES = Object.keys(SPANISH_TEAMS).sort();

export function getTeamLogo(teamName: string): string {
  if (SPANISH_TEAMS[teamName]) {
    return SPANISH_TEAMS[teamName].logo;
  }
  // Generic fallback if not matched
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
