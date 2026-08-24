'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between relative bg-gradient-to-b from-slate-800/60 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg overflow-hidden">
              {userData?.profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userData.profile.avatar_url} alt={userData.profile.nickname} className="w-full h-full object-cover" />
              ) : (
                userData?.profile?.nickname?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-white">{userData?.profile?.nickname || 'Participante'}</h3>
                {rank && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${rank.badge}`}>
                    <span>{rank.icon}</span> {rank.title}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 italic truncate max-w-[260px]">
                {userData?.profile?.tagline ? `"${userData.profile.tagline}"` : 'Sin lema quinielero'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* League & Matchday Scope Banner */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Liga: <strong className="text-white">{leagueName}</strong></span>
          <span>Vista: <strong className="text-emerald-400">{matchday === 'global' ? 'Global' : `Jornada ${matchday}`}</strong></span>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin text-emerald-400" />
              <p className="text-sm">Cargando pronósticos...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-rose-400 text-sm">{error}</div>
          ) : (
            <>
              {/* Quick Summary Pill Row */}
              <div className="grid grid-cols-2 gap-2 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 text-center">
                <div>
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    <Trophy size={12} className="text-amber-400" /> Puntos {matchday === 'global' ? 'totales' : `J${matchday}`}
                  </p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">
                    {userData.selection_stats.total_points} <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>
                <div className="border-l border-slate-700/60">
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    <TrendingUp size={12} className="text-purple-400" /> Media por partido
                  </p>
                  <p className="text-lg font-black text-purple-400 mt-0.5">
                    {userData.selection_stats.avg_points} <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>
              </div>

              {/* Predictions List */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pronósticos ({userData.predictions.length})
                </p>

                {userData.predictions.length === 0 ? (
                  <div className="glass-card p-6 text-center text-slate-500 text-sm">
                    No hay predicciones registradas para esta jornada.
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
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
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

                        {/* Teams & Score Box */}
                        <div className="flex items-center justify-between gap-2 py-1">
                          {/* Home */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {homeLogo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={homeLogo} alt={match.home_team} className="w-5 h-5 object-contain flex-shrink-0" />
                            )}
                            <span className="text-xs text-white font-medium truncate">{match.home_team}</span>
                          </div>

                          {/* Scores Comparison */}
                          <div className="flex flex-col items-center px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 min-w-[90px]">
                            <div className="text-sm font-black text-emerald-400 tracking-wider">
                              {p.predicted_home_score} - {p.predicted_away_score}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {isFinished ? `Real: ${match.home_score}-${match.away_score}` : 'Pronóstico'}
                            </span>
                          </div>

                          {/* Away */}
                          <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                            <span className="text-xs text-white font-medium truncate">{match.away_team}</span>
                            {awayLogo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={awayLogo} alt={match.away_team} className="w-5 h-5 object-contain flex-shrink-0" />
                            )}
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
    </div>
  );
}
