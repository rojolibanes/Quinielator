'use client';

import { ChevronDown, Globe, Lock, Sparkles, Check } from 'lucide-react';
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
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleSelectLeague = (league: League) => {
    onSelect(league);
    setOpen(false);
  };

  if (!leagues || leagues.length === 0) return null;

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1.5">
        Liga
      </label>
      
      {/* Selector Main Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md"
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          color: 'white',
        }}>
        <div className="flex items-center gap-2.5 truncate">
          {selected?.is_official ? (
            <Sparkles size={16} className="text-emerald-400" />
          ) : selected?.is_private ? (
            <Lock size={15} className="text-emerald-400" />
          ) : (
            <Globe size={15} className="text-emerald-400" />
          )}
          <span className="truncate">{selected?.name ?? 'Seleccionar liga'}</span>
          {selected?.is_official && (
            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              Oficial
            </span>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-2xl animate-fade-in"
          style={{
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            backdropFilter: 'blur(16px)',
          }}>
          <div className="max-h-60 overflow-y-auto py-1">
            {leagues.map(league => {
              const isSelected = selected?.id === league.id;
              return (
                <button
                  key={league.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectLeague(league);
                  }}
                  onClick={() => handleSelectLeague(league)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all text-left hover:bg-slate-800/80 ${
                    isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-200'
                  }`}>
                  <div className="flex items-center gap-2.5 truncate">
                    {league.is_official ? (
                      <Sparkles size={15} className="text-emerald-400" />
                    ) : league.is_private ? (
                      <Lock size={14} className="text-slate-400" />
                    ) : (
                      <Globe size={14} className="text-slate-400" />
                    )}
                    <span className="truncate">{league.name}</span>
                    {league.is_official && (
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        Oficial
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={16} className="text-emerald-400 flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
