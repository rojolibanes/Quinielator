'use client';

import { Globe, Lock, Sparkles } from 'lucide-react';
import type { League } from '@/types';

interface LeagueSelectorProps {
  leagues: League[];
  selected: League | null;
  onSelect: (league: League) => void;
}

export default function LeagueSelector({ leagues, selected, onSelect }: LeagueSelectorProps) {
  if (!leagues || leagues.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Liga activa
        </label>
        <span className="text-xs text-slate-500">
          {leagues.length} {leagues.length === 1 ? 'liga' : 'ligas'}
        </span>
      </div>

      {/* Chip Tabs for instant 1-tap switching */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
        {leagues.map(league => {
          const isSelected = selected?.id === league.id;
          return (
            <button
              key={league.id}
              onClick={() => onSelect(league)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}>
              {league.is_official ? (
                <Sparkles size={15} className={isSelected ? 'text-emerald-400' : 'text-slate-400'} />
              ) : league.is_private ? (
                <Lock size={14} className={isSelected ? 'text-emerald-400' : 'text-slate-500'} />
              ) : (
                <Globe size={14} className={isSelected ? 'text-emerald-400' : 'text-slate-500'} />
              )}
              <span>{league.name}</span>
              {league.is_official && (
                <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Oficial
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
