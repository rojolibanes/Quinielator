'use client';

import { useState, useCallback } from 'react';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import type { League, LeaderboardEntry } from '@/types';
import LeagueSelector from '@/components/predictions/LeagueSelector';
import { createClient } from '@/lib/supabase/client';

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

  const loadLeaderboard = useCallback(async (league: League) => {
    setLoading(true);
    const { data } = await supabase
      .from('league_members')
      .select('user_id, total_points, profiles(nickname, avatar_url)')
      .eq('league_id', league.id)
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

  const handleLeagueChange = (league: League) => {
    setSelectedLeague(league);
    loadLeaderboard(league);
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

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
      <div className="animate-fade-in">
        <LeagueSelector leagues={leagues} selected={selectedLeague} onSelect={handleLeagueChange} />
      </div>

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
          <p className="text-slate-400">Esta liga aún no tiene clasificación.</p>
          <p className="text-slate-500 text-sm">¡Las predicciones aún no se han puntuado!</p>
        </div>
      )}

      {/* Podium — Top 3 */}
      {!loading && topThree.length >= 2 && (
        <div className="flex items-end justify-center gap-3 pt-4 animate-fade-in">
          {/* 2nd place */}
          {topThree[1] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar entry={topThree[1]} size="md" isMe={topThree[1].user_id === currentUserId} />
              <p className="text-xs font-semibold text-slate-300 truncate max-w-[80px] text-center">{topThree[1].nickname}</p>
              <p className="text-sm font-bold text-slate-200">{topThree[1].total_points} <span className="text-slate-500 text-xs">pts</span></p>
              <div className="w-full h-16 rounded-t-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, rgba(192,192,192,0.15) 0%, rgba(192,192,192,0.05) 100%)', border: '1px solid rgba(192,192,192,0.2)', borderBottom: 'none' }}>
                <span className="text-2xl font-black text-slate-300">2</span>
              </div>
            </div>
          )}
          {/* 1st place */}
          {topThree[0] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <Crown size={20} className="text-amber-400" />
              <Avatar entry={topThree[0]} size="lg" isMe={topThree[0].user_id === currentUserId} />
              <p className="text-xs font-semibold text-white truncate max-w-[80px] text-center">{topThree[0].nickname}</p>
              <p className="text-base font-black text-emerald-400">{topThree[0].total_points} <span className="text-slate-400 text-xs">pts</span></p>
              <div className="w-full h-24 rounded-t-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(255,165,0,0.05) 100%)', border: '1px solid rgba(255,215,0,0.25)', borderBottom: 'none' }}>
                <span className="text-3xl font-black text-amber-400">1</span>
              </div>
            </div>
          )}
          {/* 3rd place */}
          {topThree[2] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar entry={topThree[2]} size="md" isMe={topThree[2].user_id === currentUserId} />
              <p className="text-xs font-semibold text-slate-400 truncate max-w-[80px] text-center">{topThree[2].nickname}</p>
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
                className={`glass-card p-4 flex items-center gap-4 transition-all ${
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
