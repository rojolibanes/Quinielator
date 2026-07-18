'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
          setSelectedLeague(allLeagues[0]);
        }
      }
    };
    loadLeagues();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

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
      setMatches(matchData as Match[]);

      // Load user's predictions for these matches in this league
      if (matchData.length > 0) {
        const matchIds = matchData.map((m: Match) => m.id);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <p className="text-slate-400 text-sm mb-1">Buenas predicciones, <span className="text-emerald-400 font-semibold">{profile.nickname}</span> 👋</p>
        <h1 className="text-2xl font-bold text-white">Dashboard de Predicciones</h1>
      </div>

      {/* League & Matchday Selectors */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
        <div className="flex-1">
          <LeagueSelector
            leagues={userLeagues}
            selected={selectedLeague}
            onSelect={setSelectedLeague}
          />
        </div>
        <div className="flex-1">
          <MatchdaySelector
            matchday={matchday}
            onChange={setMatchday}
          />
        </div>
      </div>



      {/* Match list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="match-card p-6 shimmer h-48" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400">No hay partidos para esta jornada.</p>
          <p className="text-slate-500 text-sm mt-2">El administrador debe añadir los partidos de la jornada {matchday}.</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              league={selectedLeague}
              prediction={predictions[match.id] || null}
              userId={profile.id}
              onPredictionSaved={(pred) => handlePredictionSaved(match.id, pred)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
