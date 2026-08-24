'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Loader2, Star, Sparkles, Trophy, Target } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const homeLogo = getTeamLogo(match.home_team);
  const awayLogo = getTeamLogo(match.away_team);
  const isFinished = match.status === 'finished';

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Match Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-b from-slate-800/80 to-slate-900 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 truncate">
              <Users size={14} className="text-emerald-400 flex-shrink-0" />
              <span className="truncate">Predicciones de {league.name}</span>
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0">
              <X size={20} />
            </button>
          </div>

          {/* Teams and real score */}
          <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {/* Home */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {homeLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={homeLogo} alt={match.home_team} className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
              )}
              <span className="text-xs font-bold text-white truncate">{match.home_team}</span>
            </div>

            {/* Score / Status Center */}
            <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 min-w-[64px] flex-shrink-0">
              {isFinished ? (
                <>
                  <div className="text-sm sm:text-base font-black text-white">
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
                <img src={awayLogo} alt={match.away_team} className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3">
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
            <div className="space-y-2.5 pb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Participantes ({predictions.length})</span>
                {isFinished && <span>Puntos obtenidos</span>}
              </div>

              {predictions.map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl transition-all border space-y-2 ${
                    p.is_me
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}>
                  {/* Row 1: Position + Avatar + Full Nickname + Points Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-500 w-4 text-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white overflow-hidden shadow-sm">
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                        ) : (
                          p.nickname.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className={`text-sm font-bold truncate ${p.is_me ? 'text-emerald-400' : 'text-white'}`}>
                        {p.nickname} {p.is_me && <span className="text-xs text-slate-500 font-normal ml-1">(tú)</span>}
                      </span>
                    </div>

                    {/* Points Pill */}
                    {isFinished ? (
                      <div className={`text-xs font-black px-2.5 py-1 rounded-lg flex-shrink-0 text-center ${
                        p.points_earned > 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-500 border border-slate-700/60'
                      }`}>
                        +{p.points_earned ?? 0} pts
                      </div>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex-shrink-0 font-medium">
                        En juego
                      </span>
                    )}
                  </div>

                  {/* Row 2: Predicted score + Scorers + MVP (Compact Bar) */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                    {/* Score Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-bold text-emerald-400">
                      <Target size={12} className="text-slate-400" />
                      <span>{p.predicted_home_score} - {p.predicted_away_score}</span>
                    </div>

                    {/* MVP & Scorers info */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      {p.predicted_mvp && (
                        <span className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400" />
                          <span className="text-slate-300 font-medium">{p.predicted_mvp.name.split(' ').pop()}</span>
                        </span>
                      )}
                      {p.predicted_scorers && p.predicted_scorers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Sparkles size={11} className="text-emerald-400" />
                          <span className="text-slate-300">
                            {p.predicted_scorers.map((s: any) => s.name.split(' ').pop() || s.name).join(', ')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer with Close Button */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
