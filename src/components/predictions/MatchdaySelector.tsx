'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MatchdaySelectorProps {
  matchday: number;
  onChange: (matchday: number) => void;
  min?: number;
  max?: number;
}

export default function MatchdaySelector({
  matchday,
  onChange,
  min = 1,
  max = 38,
}: MatchdaySelectorProps) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5 font-medium">Jornada</label>
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
        }}>
        <button
          onClick={() => onChange(Math.max(min, matchday - 1))}
          disabled={matchday <= min}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <span className="text-sm font-semibold text-white">Jornada {matchday}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, matchday + 1))}
          disabled={matchday >= max}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
