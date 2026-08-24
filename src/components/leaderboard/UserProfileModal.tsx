'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, TrendingUp, Lock, Loader2, Sparkles, Star } from 'lucide-react';
import { getTeamLogo } from '@/lib/teams';

interface UserProfileModalProps {
  userId: string;
  leagueId: string;
  leagueName: string;
  matchday: 'global' | number;
  onClose: () => void;
}

const getRank = (avg: number) => {
  if (avg >= 12) return { title: 'Leyenda de Quinielator', icon: '👑', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  if (avg >= 8) return { title: 'Maestro de LaLiga', icon: '🥇', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  if (avg >= 4) return { title: 'Táctico Experto', icon: '🥈', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
  return { title: 'Aspirante Quinielero', icon: '🥉', badge: 'bg-slate-700/60 text-slate-300 border-slate-600' };
};

export default function UserProfileModal({
  userId,
  leagueId,
  leagueName,
  matchday,
  onClose,
}: UserProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/leaderboard/user-details?user_id=${userId}&league_id=${leagueId}&matchday=${matchday}`
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Error al cargar los datos del usuario');
        } else {
          setUserData(json);
        }
      } catch {
        setError('Error de red al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, leagueId, matchday]);

  const rank = userData?.profile?.all_time_avg_points !== undefined
    ? getRank(userData.profile.all_time_avg_points)
    : null;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-b from-slate-800/60 to-slate-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg overflow-hidden">
                {userData?.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userData.profile.avatar_url} alt={userData.profile.nickname} className="w-full h-full object-cover" />
                ) : (
                  userData?.profile?.nickname?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-white truncate">{userData?.profile?.nickname || 'Participante'}</h3>
                  {rank && (
                    <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${rank.badge}`}>
                      <span>{rank.icon}</span> {rank.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 italic truncate">
                  {userData?.profile?.tagline ? `"${userData.profile.tagline}"` : 'Sin lema quinielero'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0 ml-2">
              <X size={20} />
            </button>
          </div>

          {/* Compact Global Stats Ribbon */}
          {userData?.profile?.all_time_stats && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-4 gap-1 text-center bg-slate-950/40 p-2 rounded-xl border border-slate-800">
              <div>
                <p className="text-xs sm:text-sm font-black text-white">{userData.profile.all_time_stats.total_predictions}</p>
                <p className="text-[10px] text-slate-400 font-medium">Predicciones</p>
              </div>
              <div className="border-l border-slate-800">
                <p className="text-xs sm:text-sm font-black text-purple-400">{userData.profile.all_time_stats.avg_points}</p>
                <p className="text-[10px] text-slate-400 font-medium">Media pts</p>
              </div>
              <div className="border-l border-slate-800">
                <p className="text-xs sm:text-sm font-black text-amber-400">{userData.profile.all_time_stats.exact_pct}%</p>
                <p className="text-[10px] text-slate-400 font-medium">% Plenos</p>
              </div>
              <div className="border-l border-slate-800">
                <p className="text-xs sm:text-sm font-black text-blue-400">{userData.profile.all_time_stats.result_1x2_pct}%</p>
                <p className="text-[10px] text-slate-400 font-medium">% 1X2</p>
              </div>
            </div>
          )}
        </div>

        {/* League & Matchday Scope Banner */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span className="truncate mr-2">Liga: <strong className="text-white">{leagueName}</strong></span>
          <span className="flex-shrink-0">Vista: <strong className="text-emerald-400">{matchday === 'global' ? 'Global' : `Jornada ${matchday}`}</strong></span>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-emerald-400" />
              <p className="text-sm">Cargando pronósticos...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-rose-400 text-sm">{error}</div>
          ) : (
            <>
              {/* Quick Summary Pill Row for Current Selection */}
              <div className="grid grid-cols-2 gap-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50 text-center">
                <div>
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1 font-medium">
                    <Trophy size={12} className="text-amber-400" /> Puntos en esta vista
                  </p>
                  <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
                    {userData.selection_stats.total_points} <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>
                <div className="border-l border-slate-700/60">
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1 font-medium">
                    <TrendingUp size={12} className="text-purple-400" /> Media en esta vista
                  </p>
                  <p className="text-base sm:text-lg font-black text-purple-400 mt-0.5">
                    {userData.selection_stats.avg_points} <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>
              </div>

              {/* Predictions List */}
              <div className="space-y-2.5 pb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Partidos jugados ({userData.predictions.length})
                </p>

                {userData.predictions.length === 0 ? (
                  <div className="glass-card p-6 text-center text-slate-500 text-sm">
                    No hay partidos finalizados para esta selección.
                  </div>
                ) : (
                  userData.predictions.map((p: any) => {
                    const match = p.match;
                    const homeLogo = getTeamLogo(match.home_team);
                    const awayLogo = getTeamLogo(match.away_team);
                    const isFinished = match.status === 'finished';

                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                        {/* Match Title & Points pill */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Jornada {match.matchday}</span>
                          {isFinished ? (
                            <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                              p.points_earned > 0
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              +{p.points_earned ?? 0} pts
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                              En juego
                            </span>
                          )}
                        </div>

                        {/* Teams & Score Box (Wraps team names onto 2 lines, avoids clipping) */}
                        <div className="flex items-center justify-between gap-1.5 py-1">
                          {/* Home Team */}
                          <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
                            <span className="text-[11px] sm:text-xs text-white font-semibold text-right leading-tight break-words line-clamp-2">
                              {match.home_team}
                            </span>
                            {homeLogo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={homeLogo} alt={match.home_team} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                            )}
                          </div>

                          {/* Scores Comparison (Slimmer Central Pill) */}
                          <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-slate-800/90 border border-slate-700 min-w-[62px] flex-shrink-0">
                            <div className="text-xs sm:text-sm font-black text-emerald-400 tracking-wider">
                              {p.predicted_home_score} - {p.predicted_away_score}
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                              {isFinished ? `Real: ${match.home_score}-${match.away_score}` : 'Pronóstico'}
                            </span>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-start gap-1.5 flex-1 min-w-0">
                            {awayLogo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={awayLogo} alt={match.away_team} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                            )}
                            <span className="text-[11px] sm:text-xs text-white font-semibold text-left leading-tight break-words line-clamp-2">
                              {match.away_team}
                            </span>
                          </div>
                        </div>

                        {/* Scorers & MVP */}
                        {(p.predicted_mvp || (p.predicted_scorers && p.predicted_scorers.length > 0)) && (
                          <div className="pt-1.5 border-t border-slate-800/60 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
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
                                <span className="truncate">
                                  {p.predicted_scorers.map((s: any) => s.name.split(' ').pop() || s.name).join(', ')}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Close Button */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
