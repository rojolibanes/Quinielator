'use client';

import { ChevronDown, Globe, Lock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { League } from '@/types';

interface LeagueSelectorProps {
  leagues: League[];
  selected: League | null;
  onSelect: (league: League) => void;
}

export default function LeagueSelector({ leagues, selected, onSelect }: LeagueSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-slate-500 mb-1.5 font-medium">Liga</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          color: 'white',
        }}>
        <div className="flex items-center gap-2">
          {selected?.is_private ? <Lock size={14} className="text-slate-400" /> : <Globe size={14} className="text-emerald-400" />}
          <span>{selected?.name ?? 'Seleccionar liga'}</span>
          {selected?.is_official && (
            <span className="text-xs px-1.5 py-0.5 rounded text-emerald-400"
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              Oficial
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 animate-fade-in"
          style={{
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            backdropFilter: 'blur(16px)',
          }}>
          {leagues.map(league => (
            <button
              key={league.id}
              onClick={() => { onSelect(league); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-slate-800/60 ${
                selected?.id === league.id ? 'text-emerald-400' : 'text-slate-300'
              }`}>
              {league.is_private ? <Lock size={14} className="text-slate-500" /> : <Globe size={14} className="text-emerald-400" />}
              <div className="flex-1 text-left">
                <p className="font-medium">{league.name}</p>
                {league.is_private && (
                  <p className="text-xs text-slate-500">Liga privada</p>
                )}
              </div>
              {selected?.id === league.id && <span className="text-emerald-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
