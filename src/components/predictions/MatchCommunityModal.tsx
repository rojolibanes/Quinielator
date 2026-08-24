'use client';

import { useState, useEffect } from 'react';
import { X, Users, Loader2, Star, Sparkles, Trophy } from 'lucide-react';
import { getTeamLogo } from '@/lib/teams';
import type { Match, League } from '@/types';

interface MatchCommunityModalProps {
  match: Match;
  league: League;
  onClose: () => void;
}

export default function MatchCommunityModal({
  match,
  league,
  onClose,
}: MatchCommunityModalProps) {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const homeLogo = getTeamLogo(match.home_team);
  const awayLogo = getTeamLogo(match.away_team);
  const isFinished = match.status === 'finished';

  useEffect(() => {
    const fetchCommunityPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/predictions/match-community?match_id=${match.id}&league_id=${league.id}`
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Error al cargar las predicciones de la liga');
        } else {
          setPredictions(json.predictions || []);
        }
      } catch {
        setError('Error de red al cargar las predicciones');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityPredictions();
  }, [match.id, league.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Match Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-b from-slate-800/80 to-slate-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-emerald-400" /> Predicciones de {league.name}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Teams and real score */}
          <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {/* Home */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {homeLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={homeLogo} alt={match.home_team} className="w-7 h-7 object-contain flex-shrink-0" />
              )}
              <span className="text-xs font-bold text-white truncate">{match.home_team}</span>
            </div>

            {/* Score / Status Center */}
            <div className="flex flex-col items-center px-3 py-1 rounded-lg bg-slate-800 border border-slate-700/60 min-w-[70px]">
              {isFinished ? (
                <>
                  <div className="text-base font-black text-white">
                    {match.home_score} - {match.away_score}
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">Final</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-300">VS</span>
                  <span className="text-[9px] text-amber-400 font-semibold uppercase">
                    {match.status === 'live' ? 'En vivo' : 'Iniciado'}
                  </span>
                </>
              )}
            </div>

            {/* Away */}
            <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
              <span className="text-xs font-bold text-white truncate">{match.away_team}</span>
              {awayLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={awayLogo} alt={match.away_team} className="w-7 h-7 object-contain flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-emerald-400" />
              <p className="text-sm">Cargando pronósticos de la comunidad...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-rose-400 text-sm">{error}</div>
          ) : predictions.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-400 text-sm">
              Ningún participante de esta liga ha realizado predicción en este partido.
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Participantes ({predictions.length})</span>
                {isFinished && <span>Puntos obtenidos</span>}
              </div>

              {predictions.map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl transition-all border ${
                    p.is_me
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}>
                  <div className="flex items-center justify-between gap-3">
                    {/* User Info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-500 w-4 text-center">
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white overflow-hidden shadow-sm">
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                        ) : (
                          p.nickname.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className={`text-sm font-semibold truncate ${p.is_me ? 'text-emerald-400' : 'text-white'}`}>
                        {p.nickname} {p.is_me && <span className="text-xs text-slate-500 font-normal">(tú)</span>}
                      </span>
                    </div>

                    {/* Predicted Score Pill */}
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-black text-emerald-400 tracking-wider">
                        {p.predicted_home_score} - {p.predicted_away_score}
                      </div>

                      {/* Points pill (if match is finished) */}
                      {isFinished && (
                        <div className={`text-xs font-black px-2.5 py-1 rounded-lg min-w-[54px] text-center ${
                          p.points_earned > 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800/80 text-slate-500 border border-slate-700/60'
                        }`}>
                          +{p.points_earned ?? 0}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scorers & MVP details row */}
                  {(p.predicted_mvp || (p.predicted_scorers && p.predicted_scorers.length > 0)) && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      {p.predicted_mvp && (
                        <span className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400" />
                          <strong className="text-slate-300">MVP:</strong> {p.predicted_mvp.name}
                        </span>
                      )}
                      {p.predicted_scorers && p.predicted_scorers.length > 0 && (
                        <span className="flex items-center gap-1 truncate max-w-full">
                          <Sparkles size={11} className="text-emerald-400" />
                          <strong className="text-slate-300">Goles:</strong>{' '}
                          <span className="truncate text-slate-300">
                            {p.predicted_scorers.map((s: any) => s.name.split(' ').pop() || s.name).join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
