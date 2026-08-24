'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Trophy, Medal, Crown, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { League, LeaderboardEntry } from '@/types';
import LeagueSelector from '@/components/predictions/LeagueSelector';
import { createClient } from '@/lib/supabase/client';
import UserProfileModal from '@/components/leaderboard/UserProfileModal';

interface LeaderboardClientProps {
  leagues: League[];
  initialLeague: League | null;
  initialLeaderboard: LeaderboardEntry[];
  currentUserId: string;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={18} className="text-amber-400" />;
  if (rank === 2) return <Medal size={18} className="text-slate-300" />;
  if (rank === 3) return <Medal size={18} className="text-amber-700" />;
  return <span className="text-slate-500 font-bold text-sm w-[18px] text-center">{rank}</span>;
}

export default function LeaderboardClient({
  leagues,
  initialLeague,
  initialLeaderboard,
  currentUserId,
}: LeaderboardClientProps) {
  const supabase = createClient();
  const [selectedLeague, setSelectedLeague] = useState<League | null>(initialLeague);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [loading, setLoading] = useState(false);
  const [selectedMatchday, setSelectedMatchday] = useState<'global' | number>('global');
  const [availableMatchdays, setAvailableMatchdays] = useState<number[]>([]);
  const [selectedUserIdForModal, setSelectedUserIdForModal] = useState<string | null>(null);

  // Load matchdays with at least 1 finished match for current league
  const loadAvailableMatchdays = useCallback(async (league: League) => {
    const res = await fetch(`/api/leaderboard?league_id=${league.id}&matchday=available`);
    if (res.ok) {
      const json = await res.json();
      setAvailableMatchdays(json.matchdays ?? []);
    }
  }, []);

  // Load global leaderboard from league_members
  const loadGlobalLeaderboard = useCallback(async (league: League) => {
    setLoading(true);
    const { data } = await supabase
      .from('league_members')
      .select('user_id, total_points, profiles(nickname, avatar_url)')
      .eq('league_id', league.id)
      .gt('total_points', 0)
      .order('total_points', { ascending: false });

    setLeaderboard(
      (data ?? []).map((row: any, i: number) => ({
        rank: i + 1,
        user_id: row.user_id,
        nickname: row.profiles?.nickname ?? 'Anónimo',
        avatar_url: row.profiles?.avatar_url ?? null,
        total_points: row.total_points,
      }))
    );
    setLoading(false);
  }, [supabase]);

  // Load matchday leaderboard from new API
  const loadMatchdayLeaderboard = useCallback(async (league: League, matchday: number) => {
    setLoading(true);
    const res = await fetch(`/api/leaderboard?league_id=${league.id}&matchday=${matchday}`);
    if (res.ok) {
      const json = await res.json();
      setLeaderboard(json.leaderboard ?? []);
    }
    setLoading(false);
  }, []);

  // When league changes, reset to global and reload matchdays
  const handleLeagueChange = (league: League) => {
    setSelectedLeague(league);
    setSelectedMatchday('global');
    loadGlobalLeaderboard(league);
    loadAvailableMatchdays(league);
  };

  // When matchday selector changes
  const handleMatchdaySelect = (matchday: 'global' | number) => {
    setSelectedMatchday(matchday);
    if (!selectedLeague) return;
    if (matchday === 'global') {
      loadGlobalLeaderboard(selectedLeague);
    } else {
      loadMatchdayLeaderboard(selectedLeague, matchday);
    }
  };

  // Load available matchdays on mount
  useEffect(() => {
    if (initialLeague) loadAvailableMatchdays(initialLeague);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topThree = leaderboard.slice(0, 3);

  // Ordered options: Global first, then matchdays descending (latest first)
  const selectorOptions = useMemo<Array<'global' | number>>(() => {
    const sorted = [...availableMatchdays].sort((a, b) => b - a); // descending
    return ['global', ...sorted];
  }, [availableMatchdays]);

  const currentOptionIndex = selectorOptions.indexOf(selectedMatchday);

  const goToPrev = () => {
    const prev = selectorOptions[currentOptionIndex - 1];
    if (prev !== undefined) handleMatchdaySelect(prev);
  };
  const goToNext = () => {
    const next = selectorOptions[currentOptionIndex + 1];
    if (next !== undefined) handleMatchdaySelect(next);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy size={24} className="text-amber-400" />
          Clasificación
        </h1>
        <p className="text-slate-400 text-sm mt-1">Ranking en tiempo real de tu liga</p>
      </div>

      {/* League Selector */}
      <div className="animate-fade-in relative z-30">
        <LeagueSelector leagues={leagues} selected={selectedLeague} onSelect={handleLeagueChange} />
      </div>

      {/* Matchday selector — arrow style */}
      {availableMatchdays.length > 0 && (
        <div className="animate-fade-in">
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
            }}>
            <button
              onClick={goToPrev}
              disabled={currentOptionIndex <= 0}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <span className="text-sm font-semibold text-white">
                {selectedMatchday === 'global' ? 'Clasificación Global' : `Jornada ${selectedMatchday}`}
              </span>
              {selectedMatchday !== 'global' && (
                <p className="text-xs text-slate-500 mt-0.5">Puntos de esta jornada</p>
              )}
            </div>
            <button
              onClick={goToNext}
              disabled={currentOptionIndex >= selectorOptions.length - 1}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass-card p-4 shimmer h-16" />
          ))}
        </div>
      )}

      {!loading && leaderboard.length === 0 && (
        <div className="glass-card p-12 text-center">
          <TrendingUp size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {selectedMatchday === 'global'
              ? 'Esta liga aún no tiene clasificación.'
              : `Nadie tiene predicciones puntuadas en la Jornada ${selectedMatchday}.`}
          </p>
          <p className="text-slate-500 text-sm">¡Las predicciones aún no se han puntuado!</p>
        </div>
      )}

      {/* Podium — Top 3 */}
      {!loading && topThree.length >= 2 && (
        <div className="flex items-end justify-center gap-3 pt-4 animate-fade-in relative z-10">
          {/* 2nd place */}
          {topThree[1] && (
            <div
              onClick={() => setSelectedUserIdForModal(topThree[1].user_id)}
              className="flex flex-col items-center gap-2 flex-1 cursor-pointer group hover:scale-[1.02] transition-transform">
              <Avatar entry={topThree[1]} size="md" isMe={topThree[1].user_id === currentUserId} />
              <p className="text-xs font-semibold text-slate-300 truncate max-w-[80px] text-center group-hover:text-emerald-400 transition-colors">{topThree[1].nickname}</p>
              <p className="text-sm font-bold text-slate-200">{topThree[1].total_points} <span className="text-slate-500 text-xs">pts</span></p>
              <div className="w-full h-16 rounded-t-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, rgba(192,192,192,0.15) 0%, rgba(192,192,192,0.05) 100%)', border: '1px solid rgba(192,192,192,0.2)', borderBottom: 'none' }}>
                <span className="text-2xl font-black text-slate-300">2</span>
              </div>
            </div>
          )}
          {/* 1st place */}
          {topThree[0] && (
            <div
              onClick={() => setSelectedUserIdForModal(topThree[0].user_id)}
              className="flex flex-col items-center gap-2 flex-1 cursor-pointer group hover:scale-[1.02] transition-transform">
              <Crown size={20} className="text-amber-400" />
              <Avatar entry={topThree[0]} size="lg" isMe={topThree[0].user_id === currentUserId} />
              <p className="text-xs font-semibold text-white truncate max-w-[80px] text-center group-hover:text-emerald-400 transition-colors">{topThree[0].nickname}</p>
              <p className="text-base font-black text-emerald-400">{topThree[0].total_points} <span className="text-slate-400 text-xs">pts</span></p>
              <div className="w-full h-24 rounded-t-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(255,165,0,0.05) 100%)', border: '1px solid rgba(255,215,0,0.25)', borderBottom: 'none' }}>
                <span className="text-3xl font-black text-amber-400">1</span>
              </div>
            </div>
          )}
          {/* 3rd place */}
          {topThree[2] && (
            <div
              onClick={() => setSelectedUserIdForModal(topThree[2].user_id)}
              className="flex flex-col items-center gap-2 flex-1 cursor-pointer group hover:scale-[1.02] transition-transform">
              <Avatar entry={topThree[2]} size="md" isMe={topThree[2].user_id === currentUserId} />
              <p className="text-xs font-semibold text-slate-400 truncate max-w-[80px] text-center group-hover:text-emerald-400 transition-colors">{topThree[2].nickname}</p>
              <p className="text-sm font-bold text-slate-300">{topThree[2].total_points} <span className="text-slate-500 text-xs">pts</span></p>
              <div className="w-full h-12 rounded-t-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, rgba(205,127,50,0.15) 0%, rgba(180,100,30,0.05) 100%)', border: '1px solid rgba(205,127,50,0.2)', borderBottom: 'none' }}>
                <span className="text-xl font-black text-amber-700">3</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full table */}
      {!loading && leaderboard.length > 0 && (
        <div className="space-y-2 stagger-children">
          {leaderboard.map((entry) => {
            const isMe = entry.user_id === currentUserId;
            return (
              <div
                key={entry.user_id}
                onClick={() => setSelectedUserIdForModal(entry.user_id)}
                className={`glass-card p-4 flex items-center gap-4 transition-all cursor-pointer hover:border-slate-700 hover:bg-slate-850/80 active:scale-[0.99] ${
                  entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : ''
                } ${isMe ? 'ring-1 ring-emerald-500/30' : ''}`}>
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  <RankIcon rank={entry.rank} />
                </div>
                <Avatar entry={entry} size="sm" isMe={isMe} />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isMe ? 'text-emerald-400' : 'text-white'}`}>
                    {entry.nickname} {isMe && <span className="text-xs text-slate-500">(tú)</span>}
                  </p>
                  <p className="text-[11px] text-slate-500">Toca para ver pronósticos</p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-lg ${isMe ? 'text-emerald-400' : entry.rank <= 3 ? 'text-white' : 'text-slate-300'}`}>
                    {entry.total_points}
                  </p>
                  <p className="text-xs text-slate-500">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Profile & Predictions Modal */}
      {selectedUserIdForModal && selectedLeague && (
        <UserProfileModal
          userId={selectedUserIdForModal}
          leagueId={selectedLeague.id}
          leagueName={selectedLeague.name}
          matchday={selectedMatchday}
          onClose={() => setSelectedUserIdForModal(null)}
        />
      )}
    </div>
  );
}

function Avatar({ entry, size, isMe }: { entry: LeaderboardEntry; size: 'sm' | 'md' | 'lg'; isMe: boolean }) {
  const dims = size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm';
  return (
    <div className={`${dims} rounded-full flex items-center justify-center font-bold ${textSize} flex-shrink-0 ${
      isMe ? 'ring-2 ring-emerald-500/50' : ''
    }`}
      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
      {entry.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.avatar_url} alt={entry.nickname} className="w-full h-full rounded-full object-cover" />
      ) : (
        entry.nickname.charAt(0).toUpperCase()
      )}
    </div>
  );
}

