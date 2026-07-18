'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import type { Match, MVPPlayer } from '@/types';

interface MVPSelectorProps {
  match: Match;
  selected: MVPPlayer | null;
  onChange: (mvp: MVPPlayer | null) => void;
  disabled?: boolean;
}

interface Player {
  id: number;
  name: string;
  photo: string;
  position: string;
  team: 'home' | 'away';
}

export default function MVPSelector({ match, selected, onChange, disabled }: MVPSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/players?home=${encodeURIComponent(match.home_team)}&away=${encodeURIComponent(match.away_team)}&matchId=${match.id}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [match.id, match.home_team, match.away_team]);

  const homePlayers = players.filter(p => p.team === 'home');
  const awayPlayers = players.filter(p => p.team === 'away');

  const handleSelectChange = (value: string) => {
    if (disabled) return;
    if (!value) {
      onChange(null);
      return;
    }

    const found = players.find(p => String(p.id) === String(value));
    if (found) {
      onChange({
        player_id: found.id,
        name: found.name,
        photo: found.photo,
        team: found.team,
      });
    }
  };

  const selectedValue = selected ? String(selected.player_id) : '';

  return (
    <div className="space-y-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
      <div className="flex items-center gap-2">
        <Star size={14} className="text-amber-400" />
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          MVP del partido *
        </h4>
        {selected && (
          <span className="text-xs text-amber-400 font-medium ml-auto flex items-center gap-1">
            ⭐ {selected.name} ({selected.team === 'home' ? match.home_team : match.away_team})
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
          <Loader2 size={12} className="animate-spin" />
          Cargando candidatos...
        </div>
      )}

      {!loading && (
        <select
          value={selectedValue}
          onChange={e => handleSelectChange(e.target.value)}
          disabled={disabled}
          className="input-field text-xs py-2 bg-slate-800/80 border-slate-700 focus:border-amber-400">
          <option value="">-- Seleccionar MVP del partido --</option>
          {homePlayers.length > 0 && (
            <optgroup label={`🏠 ${match.home_team}`}>
              {homePlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.position ? `(${p.position})` : ''}
                </option>
              ))}
            </optgroup>
          )}
          {awayPlayers.length > 0 && (
            <optgroup label={`✈️ ${match.away_team}`}>
              {awayPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.position ? `(${p.position})` : ''}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      )}
    </div>
  );
}
