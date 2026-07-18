'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Match, Scorer } from '@/types';

interface ScorerSelectorProps {
  match: Match;
  homeScore: number | '';
  awayScore: number | '';
  selected: Scorer[];
  onChange: (scorers: Scorer[]) => void;
  disabled?: boolean;
}

interface Player {
  id: number;
  name: string;
  photo: string;
  position: string;
  team: 'home' | 'away';
}

export default function ScorerSelector({
  match,
  homeScore,
  awayScore,
  selected,
  onChange,
  disabled,
}: ScorerSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numHomeGoals = typeof homeScore === 'number' ? Math.max(0, homeScore) : 0;
  const numAwayGoals = typeof awayScore === 'number' ? Math.max(0, awayScore) : 0;
  const totalGoals = numHomeGoals + numAwayGoals;

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/players?home=${encodeURIComponent(match.home_team)}&away=${encodeURIComponent(match.away_team)}&matchId=${match.id}`);
        if (!res.ok) throw new Error('No se pudieron cargar los jugadores');
        const data = await res.json();
        setPlayers(data.players || []);
      } catch {
        setError('No se pudieron cargar las plantillas automáticamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [match.id, match.home_team, match.away_team]);

  const homePlayers = players.filter(p => p.team === 'home');
  const awayPlayers = players.filter(p => p.team === 'away');

  // Separate selected into home and away arrays based on index
  const homeSelected = selected.filter(s => s.team === 'home');
  const awaySelected = selected.filter(s => s.team === 'away');

  const handleSelectChange = (team: 'home' | 'away', index: number, value: string) => {
    if (disabled) return;

    let updatedScorer: Scorer | null = null;

    if (value === 'own_goal') {
      updatedScorer = {
        player_id: `own_goal_${team}_${index}`,
        name: 'Gol en propia puerta',
        team,
      };
    } else if (value) {
      const teamList = team === 'home' ? homePlayers : awayPlayers;
      const foundPlayer = teamList.find(p => String(p.id) === String(value));
      if (foundPlayer) {
        updatedScorer = {
          player_id: foundPlayer.id,
          name: foundPlayer.name,
          team,
          photo: foundPlayer.photo,
        };
      }
    }

    // Rebuild selected list
    const currentTeamList = team === 'home' ? [...homeSelected] : [...awaySelected];
    
    // Ensure array length matches goal count
    const targetLength = team === 'home' ? numHomeGoals : numAwayGoals;
    while (currentTeamList.length < targetLength) {
      currentTeamList.push({ player_id: '', name: '', team });
    }

    if (updatedScorer) {
      currentTeamList[index] = updatedScorer;
    } else {
      currentTeamList[index] = { player_id: '', name: '', team };
    }

    // Filter out completely empty placeholder entries when updating parent, but preserve order
    const newHome = (team === 'home' ? currentTeamList : homeSelected).slice(0, numHomeGoals);
    const newAway = (team === 'away' ? currentTeamList : awaySelected).slice(0, numAwayGoals);

    const fullList = [...newHome, ...newAway].filter(s => s.player_id !== '');
    onChange(fullList);
  };

  const getScorerValue = (team: 'home' | 'away', index: number) => {
    const list = team === 'home' ? homeSelected : awaySelected;
    const scorer = list[index];
    if (!scorer || !scorer.player_id) return '';
    if (String(scorer.player_id).startsWith('own_goal')) return 'own_goal';
    return String(scorer.player_id);
  };

  if (totalGoals === 0) {
    return (
      <div className="text-center py-2 text-xs text-slate-500 italic">
        (Marcador 0–0: No hay goles que asignar)
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Goleadores del partido ({selected.filter(s => s.player_id).length}/{totalGoals} asignados)
        </h4>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
          <Loader2 size={14} className="animate-spin" />
          Cargando plantillas de {match.home_team} y {match.away_team}...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-amber-400 text-xs py-2 px-3 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Home team goals */}
          {numHomeGoals > 0 && (
            <div className="space-y-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  ⚽ Goles de {match.home_team} ({numHomeGoals})
                </span>
              </div>
              {Array.from({ length: numHomeGoals }).map((_, i) => (
                <div key={`home-${i}`} className="space-y-1">
                  <label className="text-[11px] text-slate-400">Gol {i + 1}</label>
                  <select
                    value={getScorerValue('home', i)}
                    onChange={e => handleSelectChange('home', i, e.target.value)}
                    disabled={disabled}
                    className="input-field text-xs py-2 bg-slate-800/80 border-slate-700 focus:border-emerald-500">
                    <option value="">-- Seleccionar goleador --</option>
                    <option value="own_goal">⚽ Gol en propia puerta</option>
                    {homePlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.position ? `(${p.position})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Away team goals */}
          {numAwayGoals > 0 && (
            <div className="space-y-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  ⚽ Goles de {match.away_team} ({numAwayGoals})
                </span>
              </div>
              {Array.from({ length: numAwayGoals }).map((_, i) => (
                <div key={`away-${i}`} className="space-y-1">
                  <label className="text-[11px] text-slate-400">Gol {i + 1}</label>
                  <select
                    value={getScorerValue('away', i)}
                    onChange={e => handleSelectChange('away', i, e.target.value)}
                    disabled={disabled}
                    className="input-field text-xs py-2 bg-slate-800/80 border-slate-700 focus:border-emerald-500">
                    <option value="">-- Seleccionar goleador --</option>
                    <option value="own_goal">⚽ Gol en propia puerta</option>
                    {awayPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.position ? `(${p.position})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
