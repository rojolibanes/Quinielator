// ============================================================
// QUINIELATOR - TypeScript Type Definitions
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ────────────────────────────────────────────────────────────
// Scoring Configuration
// ────────────────────────────────────────────────────────────
export interface PointsConfig {
  exact_score: number;      // Default: 20
  result_1x2: number;       // Default: 10
  scorer_per_goal: number;  // Default: 1 per scorer
  individual_goals: number; // Default: 2
  mvp: number;              // Default: 3
  enable_scorers: boolean;  // Default: true
  enable_mvp: boolean;      // Default: true
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  exact_score: 20,
  result_1x2: 10,
  scorer_per_goal: 1,
  individual_goals: 2,
  mvp: 3,
  enable_scorers: true,
  enable_mvp: true,
};

// ────────────────────────────────────────────────────────────
// Entities
// ────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
}

export type FootballLeague = 'laliga' | 'champions' | 'europa_league' | 'copa_rey';

export interface League {
  id: string;
  name: string;
  code_to_join: string | null;
  creator_id: string | null;
  is_private: boolean;
  is_official: boolean;
  points_config: PointsConfig;
  football_league: FootballLeague;
  created_at: string;
  // Joined fields
  creator?: Profile;
  member_count?: number;
  user_total_points?: number;
}

export interface LeagueMember {
  league_id: string;
  user_id: string;
  total_points: number;
  joined_at: string;
  // Joined fields
  profile?: Profile;
  league?: League;
}

export type MatchStatus = 'pending' | 'live' | 'finished';

export interface Scorer {
  player_id: string | number;
  name: string;
  team: 'home' | 'away';
  photo?: string;
}

export interface MVPPlayer {
  player_id: string | number;
  name: string;
  photo?: string;
  team?: 'home' | 'away';
}

export interface Match {
  id: string;
  football_league: FootballLeague;
  home_team: string;
  away_team: string;
  home_team_logo?: string;
  away_team_logo?: string;
  matchday: number;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  scorers: Scorer[];
  mvp: MVPPlayer | null;
  status: MatchStatus;
  created_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  league_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_scorers: Scorer[];
  predicted_mvp: MVPPlayer | null;
  points_earned: number;
  calculated_at: string | null;
  created_at: string;
  // Joined fields
  match?: Match;
  profile?: Profile;
}

// ────────────────────────────────────────────────────────────
// API-Football Types
// ────────────────────────────────────────────────────────────
export interface APIFootballPlayer {
  id: number;
  name: string;
  photo: string;
  position?: string;
  nationality?: string;
}

export interface APIFootballTeamSquad {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  players: Array<{
    id: number;
    name: string;
    age: number;
    number: number | null;
    position: string;
    photo: string;
  }>;
}

// ────────────────────────────────────────────────────────────
// UI State / Form Types
// ────────────────────────────────────────────────────────────
export interface PredictionFormData {
  match_id: string;
  predicted_home_score: number | '';
  predicted_away_score: number | '';
  predicted_scorers: Scorer[];
  predicted_mvp: MVPPlayer | null;
}

export interface CreateLeagueFormData {
  name: string;
  is_private: boolean;
  football_league: FootballLeague;
  points_config: PointsConfig;
}

export interface MatchResultFormData {
  match_id: string;
  home_score: number;
  away_score: number;
  scorers: Scorer[];
  mvp: MVPPlayer | null;
  status: MatchStatus;
}

// ────────────────────────────────────────────────────────────
// Leaderboard
// ────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  total_points: number;
  predictions_count?: number;
  exact_scores?: number;
}

// ────────────────────────────────────────────────────────────
// Score Calculation Result
// ────────────────────────────────────────────────────────────
export interface ScoreBreakdown {
  total: number;
  exact_score: number;
  result_1x2: number;
  scorers: number;
  individual_goals: number;
  mvp: number;
}
