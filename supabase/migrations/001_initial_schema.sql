-- ============================================================
-- QUINIELATOR - Supabase Schema (PostgreSQL)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- LEAGUES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  code_to_join TEXT UNIQUE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT FALSE NOT NULL,
  is_official BOOLEAN DEFAULT FALSE NOT NULL,
  points_config JSONB NOT NULL DEFAULT '{
    "exact_score": 20,
    "result_1x2": 10,
    "scorer_per_goal": 1,
    "individual_goals": 2,
    "mvp": 3
  }'::jsonb,
  football_league TEXT DEFAULT 'laliga' NOT NULL,
  season INTEGER DEFAULT 2025 NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-generate join code for private leagues
CREATE OR REPLACE FUNCTION public.generate_league_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_private = TRUE AND NEW.code_to_join IS NULL THEN
    NEW.code_to_join := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_league_insert
  BEFORE INSERT ON public.leagues
  FOR EACH ROW EXECUTE PROCEDURE public.generate_league_code();

-- Create the official league on first run
INSERT INTO public.leagues (name, is_official, is_private, football_league, points_config)
VALUES (
  'Liga Oficial Quinielator',
  TRUE,
  FALSE,
  'laliga',
  '{"exact_score": 20, "result_1x2": 10, "scorer_per_goal": 1, "individual_goals": 2, "mvp": 3}'::jsonb
)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- LEAGUE_MEMBERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.league_members (
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0 NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (league_id, user_id)
);

-- ────────────────────────────────────────────────────────────
-- MATCHES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  football_league TEXT NOT NULL DEFAULT 'laliga',
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  matchday INTEGER NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  home_score INTEGER CHECK (home_score >= 0),
  away_score INTEGER CHECK (away_score >= 0),
  scorers JSONB DEFAULT '[]'::jsonb NOT NULL,
  -- Format: [{"player_id": 123, "name": "Benzema", "team": "home", "photo": "url"}]
  mvp JSONB,
  -- Format: {"player_id": 123, "name": "Benzema", "photo": "url", "team": "home"}
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'live', 'finished')),
  api_fixture_id INTEGER UNIQUE,  -- API-Football fixture ID for sync
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for quick matchday lookups
CREATE INDEX IF NOT EXISTS idx_matches_matchday ON public.matches(football_league, matchday);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- ────────────────────────────────────────────────────────────
-- PREDICTIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER NOT NULL CHECK (predicted_home_score >= 0),
  predicted_away_score INTEGER NOT NULL CHECK (predicted_away_score >= 0),
  predicted_scorers JSONB DEFAULT '[]'::jsonb NOT NULL,
  predicted_mvp JSONB,
  points_earned INTEGER DEFAULT 0 NOT NULL,
  calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, league_id, match_id)
);

-- Prevent predictions after match starts
CREATE OR REPLACE FUNCTION public.check_prediction_deadline()
RETURNS TRIGGER AS $$
DECLARE
  v_match_status TEXT;
  v_match_date TIMESTAMPTZ;
BEGIN
  SELECT m.status, m.match_date INTO v_match_status, v_match_date
  FROM public.matches m WHERE m.id = NEW.match_id;

  IF v_match_status IN ('live', 'finished') THEN
    RAISE EXCEPTION 'Cannot submit prediction: match has already started or finished';
  END IF;

  IF v_match_date < NOW() THEN
    RAISE EXCEPTION 'Cannot submit prediction: deadline has passed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_prediction_insert
  BEFORE INSERT ON public.predictions
  FOR EACH ROW EXECUTE PROCEDURE public.check_prediction_deadline();

-- ────────────────────────────────────────────────────────────
-- SCORE CALCULATION FUNCTION
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calculate_prediction_points(
  p_prediction_id UUID
) RETURNS INTEGER AS $$
DECLARE
  pred RECORD;
  match RECORD;
  config JSONB;
  points INTEGER := 0;
  is_exact BOOLEAN;
  pred_result CHAR(1);
  real_result CHAR(1);
  is_1x2 BOOLEAN;
  real_scorer_ids JSONB;
  pred_scorer_id TEXT;
  scorer_hits INTEGER := 0;
BEGIN
  -- Fetch prediction and match data
  SELECT p.*, l.points_config
  INTO pred
  FROM public.predictions p
  JOIN public.leagues l ON l.id = p.league_id
  WHERE p.id = p_prediction_id;

  SELECT * INTO match FROM public.matches WHERE id = pred.match_id;

  IF match.status != 'finished' THEN
    RETURN 0;
  END IF;

  config := pred.points_config;

  -- 1. Check exact score
  is_exact := (pred.predicted_home_score = match.home_score AND
               pred.predicted_away_score = match.away_score);

  -- 2. Check 1X2 result
  pred_result := CASE
    WHEN pred.predicted_home_score > pred.predicted_away_score THEN 'H'
    WHEN pred.predicted_home_score < pred.predicted_away_score THEN 'A'
    ELSE 'D'
  END;
  real_result := CASE
    WHEN match.home_score > match.away_score THEN 'H'
    WHEN match.home_score < match.away_score THEN 'A'
    ELSE 'D'
  END;
  is_1x2 := (pred_result = real_result);

  -- Award points
  IF is_exact THEN
    points := points + (config->>'exact_score')::INTEGER;
  ELSIF is_1x2 THEN
    points := points + (config->>'result_1x2')::INTEGER;
  ELSE
    -- Individual goals bonus (only if neither exact nor 1x2)
    IF pred.predicted_home_score = match.home_score THEN
      points := points + (config->>'individual_goals')::INTEGER;
    END IF;
    IF pred.predicted_away_score = match.away_score THEN
      points := points + (config->>'individual_goals')::INTEGER;
    END IF;
  END IF;

  -- 3. Scorers: count how many predicted scorers are in actual scorers
  SELECT jsonb_agg(s->>'player_id')
  INTO real_scorer_ids
  FROM jsonb_array_elements(match.scorers) AS s;

  FOR pred_scorer_id IN
    SELECT s->>'player_id' FROM jsonb_array_elements(pred.predicted_scorers) AS s
  LOOP
    IF real_scorer_ids @> to_jsonb(pred_scorer_id) THEN
      scorer_hits := scorer_hits + 1;
    END IF;
  END LOOP;
  points := points + (scorer_hits * (config->>'scorer_per_goal')::INTEGER);

  -- 4. MVP
  IF pred.predicted_mvp IS NOT NULL AND match.mvp IS NOT NULL THEN
    IF (pred.predicted_mvp->>'player_id') = (match.mvp->>'player_id') THEN
      points := points + (config->>'mvp')::INTEGER;
    END IF;
  END IF;

  -- Update the prediction record
  UPDATE public.predictions
  SET points_earned = points, calculated_at = NOW()
  WHERE id = p_prediction_id;

  RETURN points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- RECALCULATE ALL PREDICTIONS FOR A MATCH
-- Called by admin after entering match results
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recalculate_match_points(
  p_match_id UUID
) RETURNS VOID AS $$
DECLARE
  pred RECORD;
BEGIN
  -- 1. Calculate points for each prediction of this match
  FOR pred IN
    SELECT id, user_id, league_id FROM public.predictions
    WHERE match_id = p_match_id
  LOOP
    PERFORM public.calculate_prediction_points(pred.id);
  END LOOP;

  -- 2. Recalculate total_points for affected league members (sum of ALL predictions in that league)
  UPDATE public.league_members lm
  SET total_points = COALESCE((
    SELECT SUM(p.points_earned)
    FROM public.predictions p
    WHERE p.league_id = lm.league_id AND p.user_id = lm.user_id
  ), 0)
  WHERE (lm.league_id, lm.user_id) IN (
    SELECT DISTINCT league_id, user_id FROM public.predictions WHERE match_id = p_match_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────

-- Profiles: users can read all, only update their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Leagues: public leagues are viewable by all; private only by members
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public leagues are viewable" ON public.leagues FOR SELECT
  USING (is_private = FALSE OR is_official = TRUE OR
         EXISTS(SELECT 1 FROM public.league_members WHERE league_id = id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create leagues" ON public.leagues FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "League creators can update their leagues" ON public.leagues FOR UPDATE
  USING (auth.uid() = creator_id);

-- League Members
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "League members are viewable by league members" ON public.league_members FOR SELECT USING (TRUE);
CREATE POLICY "Users can join leagues" ON public.league_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches: everyone can view
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (TRUE);

-- Predictions: users can view all predictions in leagues they belong to, edit their own
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view predictions in their leagues" ON public.predictions FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.league_members WHERE league_id = predictions.league_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert their own predictions" ON public.predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own predictions" ON public.predictions FOR UPDATE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- LEADERBOARD VIEW
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  lm.league_id,
  lm.user_id,
  p.nickname,
  p.avatar_url,
  lm.total_points,
  ROW_NUMBER() OVER (PARTITION BY lm.league_id ORDER BY lm.total_points DESC) AS rank
FROM public.league_members lm
JOIN public.profiles p ON p.id = lm.user_id
ORDER BY lm.league_id, rank;
