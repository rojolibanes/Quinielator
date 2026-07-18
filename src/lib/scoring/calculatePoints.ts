import type { Match, Prediction, PointsConfig, ScoreBreakdown } from '@/types';

// ────────────────────────────────────────────────────────────
// CORE SCORING ENGINE
// This mirrors the PostgreSQL function for client-side previews
// ────────────────────────────────────────────────────────────

type MatchResult = 'H' | 'A' | 'D';

function getResult(home: number, away: number): MatchResult {
  if (home > away) return 'H';
  if (away > home) return 'A';
  return 'D';
}

export function calculatePoints(
  prediction: Pick<Prediction, 'predicted_home_score' | 'predicted_away_score' | 'predicted_scorers' | 'predicted_mvp'>,
  match: Pick<Match, 'home_score' | 'away_score' | 'scorers' | 'mvp'>,
  config: PointsConfig
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    total: 0,
    exact_score: 0,
    result_1x2: 0,
    scorers: 0,
    individual_goals: 0,
    mvp: 0,
  };

  if (match.home_score === null || match.away_score === null) {
    return breakdown;
  }

  const predHome = prediction.predicted_home_score;
  const predAway = prediction.predicted_away_score;
  const realHome = match.home_score;
  const realAway = match.away_score;

  const isExact = predHome === realHome && predAway === realAway;
  const predResult = getResult(predHome, predAway);
  const realResult = getResult(realHome, realAway);
  const is1X2 = predResult === realResult;

  // 1. Exact score / 1X2
  if (isExact) {
    breakdown.exact_score = config.exact_score;
  } else if (is1X2) {
    breakdown.result_1x2 = config.result_1x2;
  } else {
    // Individual goals bonus (only if neither exact nor 1x2)
    if (predHome === realHome) {
      breakdown.individual_goals += config.individual_goals;
    }
    if (predAway === realAway) {
      breakdown.individual_goals += config.individual_goals;
    }
  }

  // 2. Scorers (supports multiple goals per player)
  if (config.enable_scorers !== false) {
    const realScorerCounts = new Map<string, number>();
    for (const s of match.scorers || []) {
      const id = String(s.player_id);
      realScorerCounts.set(id, (realScorerCounts.get(id) || 0) + 1);
    }

    const predScorerCounts = new Map<string, number>();
    for (const s of prediction.predicted_scorers || []) {
      const id = String(s.player_id);
      predScorerCounts.set(id, (predScorerCounts.get(id) || 0) + 1);
    }

    let scorerHits = 0;
    predScorerCounts.forEach((predCount, id) => {
      const realCount = realScorerCounts.get(id) || 0;
      scorerHits += Math.min(predCount, realCount);
    });
    breakdown.scorers = scorerHits * config.scorer_per_goal;
  } else {
    breakdown.scorers = 0;
  }

  // 3. MVP
  if (
    config.enable_mvp !== false &&
    prediction.predicted_mvp?.player_id &&
    match.mvp?.player_id &&
    String(prediction.predicted_mvp.player_id) === String(match.mvp.player_id)
  ) {
    breakdown.mvp = config.mvp;
  } else {
    breakdown.mvp = 0;
  }

  breakdown.total =
    breakdown.exact_score +
    breakdown.result_1x2 +
    breakdown.scorers +
    breakdown.individual_goals +
    breakdown.mvp;

  return breakdown;
}

// ────────────────────────────────────────────────────────────
// VALIDATION: Max scorers allowed based on predicted goals
// ────────────────────────────────────────────────────────────
export function getMaxScorers(homeScore: number | '', awayScore: number | ''): number {
  if (homeScore === '' || awayScore === '') return 0;
  return (homeScore as number) + (awayScore as number);
}

// ────────────────────────────────────────────────────────────
// PREVIEW: Show potential points before match ends
// ────────────────────────────────────────────────────────────
export function previewPoints(
  predHome: number,
  predAway: number,
  config: PointsConfig
): { min: number; max: number } {
  const basePoints = Math.max(config.result_1x2, config.individual_goals * 2);
  const maxScorers = predHome + predAway;
  const maxScorerPoints = maxScorers * config.scorer_per_goal;

  return {
    min: 0,
    max: config.exact_score + maxScorerPoints + config.mvp,
  };
}
