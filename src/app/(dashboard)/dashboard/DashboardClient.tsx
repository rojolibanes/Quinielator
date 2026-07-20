'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Filter, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Match, League, Prediction, Profile } from '@/types';
import MatchCard from '@/components/predictions/MatchCard';
import LeagueSelector from '@/components/predictions/LeagueSelector';
import MatchdaySelector from '@/components/predictions/MatchdaySelector';

interface DashboardClientProps {
  profile: Profile;
  officialLeague: League | null;
}

export default function DashboardClient({ profile, officialLeague }: DashboardClientProps) {
  const supabase = createClient();
  const [selectedLeague, setSelectedLeague] = useState<League | null>(officialLeague);
  const [userLeagues, setUserLeagues] = useState<League[]>(officialLeague ? [officialLeague] : []);
  const [matchday, setMatchday] = useState(1);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);

  // Load user's leagues
  useEffect(() => {
    const loadLeagues = async () => {
      const { data } = await supabase
        .from('league_members')
        .select('league_id, leagues(*)')
        .eq('user_id', profile.id);

      if (data) {
        const leagues = data.map((lm: any) => lm.leagues).filter(Boolean) as League[];
        // Include official league at top if not already
        const allLeagues = officialLeague
          ? [officialLeague, ...leagues.filter(l => l.id !== officialLeague.id)]
          : leagues;
        setUserLeagues(allLeagues);
        if (!selectedLeague && allLeagues.length > 0) {
          const first = allLeagues[0];
          setSelectedLeague(first);
          const cfg = first.points_config || {};
          if (cfg.matchday_type === 'single' && cfg.start_matchday) {
            setMatchday(cfg.start_matchday);
          }
        }
      }
    };
    loadLeagues();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const handleLeagueSelect = (league: League) => {
    setSelectedLeague(league);
    const cfg = league.points_config || {};
    if (cfg.matchday_type === 'single' && cfg.start_matchday) {
      setMatchday(cfg.start_matchday);
    } else if (cfg.matchday_type === 'range') {
      const minJ = cfg.start_matchday || 1;
      const maxJ = cfg.end_matchday || 38;
      setMatchday(prev => Math.max(minJ, Math.min(maxJ, prev)));
    }
  };

  // Load matches for selected league + matchday
  const loadMatches = useCallback(async () => {
    if (!selectedLeague) return;
    setLoading(true);

    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('football_league', selectedLeague.football_league)
      .eq('matchday', matchday)
      .order('match_date', { ascending: true });

    if (matchData) {
      let finalMatches = matchData as Match[];
      const cfg = selectedLeague.points_config || {};

      // Filter by team if specified for this league
      if (cfg.filter_team) {
        const teamName = cfg.filter_team;
        finalMatches = finalMatches.filter(
          m => m.home_team === teamName || m.away_team === teamName
        );
      }

      setMatches(finalMatches);

      // Load user's predictions for these matches in this league
      if (finalMatches.length > 0) {
        const matchIds = finalMatches.map((m: Match) => m.id);
        const { data: predData } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', profile.id)
          .eq('league_id', selectedLeague.id)
          .in('match_id', matchIds);

        if (predData) {
          const predMap = predData.reduce((acc: Record<string, Prediction>, pred: Prediction) => {
            acc[pred.match_id] = pred;
            return acc;
          }, {});
          setPredictions(predMap);
        }
      } else {
        setPredictions({});
      }
    }

    setLoading(false);
  }, [selectedLeague, matchday, profile.id, supabase]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handlePredictionSaved = (matchId: string, prediction: Prediction) => {
    setPredictions(prev => ({ ...prev, [matchId]: prediction }));
  };

  if (!selectedLeague) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <Calendar size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Aún no perteneces a ninguna liga</h2>
        <p className="text-slate-400 max-w-xs">
          Únete a la liga oficial o crea una liga privada con tus amigos para empezar a predecir.
        </p>
      </div>
    );
  }

  const cfg = selectedLeague.points_config || {};
  const matchdayType = cfg.matchday_type || 'all';
  const minMatchday = matchdayType === 'single' || matchdayType === 'range' ? (cfg.start_matchday || 1) : 1;
  const maxMatchday = matchdayType === 'single' ? (cfg.start_matchday || 1) : matchdayType === 'range' ? (cfg.end_matchday || 38) : 38;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <p className="text-slate-400 text-sm mb-1">Bienvenido, <span className="text-emerald-400 font-semibold">{profile.nickname}</span> 👋</p>
        <h1 className="text-2xl font-bold text-white">Tus Predicciones</h1>
      </div>

      {/* League & Matchday Selectors */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
        <div className="flex-1">
          <LeagueSelector
            leagues={userLeagues}
            selected={selectedLeague}
            onSelect={handleLeagueSelect}
          />
        </div>
        <div className="flex-1">
          <MatchdaySelector
            matchday={matchday}
            onChange={setMatchday}
            min={minMatchday}
            max={maxMatchday}
          />
        </div>
      </div>

      {/* League Filters Banner if active */}
      {(cfg.filter_team || matchdayType !== 'all') && (
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-fade-in">
          <div className="flex items-center gap-2 text-slate-300">
            <Filter size={14} className="text-emerald-400 flex-shrink-0" />
            <span>
              Configuración de esta liga:
              {cfg.filter_team && (
                <span className="text-blue-300 font-semibold ml-1">
                  ⚽ Solo partidos del {cfg.filter_team}
                </span>
              )}
              {matchdayType === 'single' && (
                <span className="text-purple-300 font-semibold ml-1">
                  📅 Limitada a Jornada {cfg.start_matchday}
                </span>
              )}
              {matchdayType === 'range' && (
                <span className="text-amber-300 font-semibold ml-1">
                  📅 Jornadas {cfg.start_matchday} a {cfg.end_matchday}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Matches list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 shimmer h-36" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Sparkles size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No hay partidos para esta jornada o filtro.</p>
          <p className="text-slate-500 text-sm mt-1">
            {cfg.filter_team
              ? `El ${cfg.filter_team} no juega en la Jornada ${matchday}.`
              : 'Selecciona otra jornada o revisa el calendario.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              league={selectedLeague}
              prediction={predictions[match.id] ?? null}
              userId={profile.id}
              onPredictionSaved={prediction => handlePredictionSaved(match.id, prediction)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
