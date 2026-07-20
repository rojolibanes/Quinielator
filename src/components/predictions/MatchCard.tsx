'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Match, League, Prediction, Scorer, MVPPlayer } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getMaxScorers, calculatePoints } from '@/lib/scoring/calculatePoints';
import ScorerSelector from './ScorerSelector';
import MVPSelector from './MVPSelector';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MatchCardProps {
  match: Match;
  league: League;
  prediction: Prediction | null;
  userId: string;
  onPredictionSaved: (prediction: Prediction) => void;
}

export default function MatchCard({
  match,
  league,
  prediction,
  userId,
  onPredictionSaved,
}: MatchCardProps) {
  const supabase = createClient();
  const [homeScore, setHomeScore] = useState<number | ''>(prediction?.predicted_home_score ?? '');
  const [awayScore, setAwayScore] = useState<number | ''>(prediction?.predicted_away_score ?? '');
  const [selectedScorers, setSelectedScorers] = useState<Scorer[]>(prediction?.predicted_scorers ?? []);
  const [selectedMvp, setSelectedMvp] = useState<MVPPlayer | null>(prediction?.predicted_mvp ?? null);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isPast = new Date(match.match_date) < new Date();
  const isLocked = match.status !== 'pending' || isPast;
  const maxScorers = getMaxScorers(homeScore, awayScore);
  const totalPredictedGoals = (homeScore !== '' ? Number(homeScore) : 0) + (awayScore !== '' ? Number(awayScore) : 0);

  // Track changes
  useEffect(() => {
    const origHome = prediction?.predicted_home_score ?? '';
    const origAway = prediction?.predicted_away_score ?? '';
    setHasChanges(
      homeScore !== origHome ||
      awayScore !== origAway ||
      JSON.stringify(selectedScorers) !== JSON.stringify(prediction?.predicted_scorers ?? []) ||
      JSON.stringify(selectedMvp) !== JSON.stringify(prediction?.predicted_mvp ?? null)
    );
  }, [homeScore, awayScore, selectedScorers, selectedMvp, prediction]);

  // Reset scorers when goal count decreases
  useEffect(() => {
    if (selectedScorers.length > maxScorers) {
      setSelectedScorers(prev => prev.slice(0, maxScorers));
    }
  }, [maxScorers, selectedScorers.length]);

  // Auto expand when score is set
  useEffect(() => {
    if (homeScore !== '' && awayScore !== '') {
      setExpanded(true);
    }
  }, [homeScore, awayScore]);

  const showScorers = league.points_config.enable_scorers !== false;
  const showMvp = league.points_config.enable_mvp !== false;
  const hasSubSelection = showScorers || showMvp;

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') {
      toast.error('Introduce el marcador antes de guardar.');
      return;
    }

    if (showScorers && maxScorers > 0 && selectedScorers.length < maxScorers) {
      toast.error(`Debes indicar todos los goleadores (${selectedScorers.length}/${maxScorers} goles asignados).`);
      setExpanded(true);
      return;
    }

    if (showMvp && !selectedMvp) {
      toast.error('Debes seleccionar el MVP del partido.');
      setExpanded(true);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league_id: league.id,
          match_id: match.id,
          predicted_home_score: Number(homeScore),
          predicted_away_score: Number(awayScore),
          predicted_scorers: selectedScorers,
          predicted_mvp: selectedMvp,
        }),
      });

      const json = await res.json();
      setSaving(false);

      if (!res.ok) {
        toast.error('Error al guardar la predicción: ' + (json.error || 'Error desconocido'));
      } else {
        toast.success('✅ Predicción guardada');
        onPredictionSaved(json.prediction as Prediction);
        setHasChanges(false);
      }
    } catch {
      setSaving(false);
      toast.error('Error de red al guardar la predicción');
    }
  };

  // Points breakdown for finished matches
  const pointsBreakdown = match.status === 'finished' && prediction
    ? calculatePoints(
        {
          predicted_home_score: prediction.predicted_home_score,
          predicted_away_score: prediction.predicted_away_score,
          predicted_scorers: prediction.predicted_scorers,
          predicted_mvp: prediction.predicted_mvp,
        },
        match,
        league.points_config
      )
    : null;

  const matchDate = new Date(match.match_date);

  return (
    <div className={`match-card overflow-hidden ${match.status === 'finished' ? 'opacity-90' : ''}`}>
      {/* Match header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {match.status === 'live' && (
              <span className="badge-live">🔴 En vivo</span>
            )}
            {match.status === 'finished' && (
              <span className="badge-finished">Finalizado</span>
            )}
            {match.status === 'pending' && (
              <span className="badge-pending flex items-center gap-1">
                <Clock size={10} />
                {format(matchDate, "d MMM · HH:mm", { locale: es })}
              </span>
            )}
          </div>
          {pointsBreakdown && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span className="text-emerald-400 font-bold text-sm">{pointsBreakdown.total}</span>
              <span className="text-slate-400 text-xs">pts</span>
            </div>
          )}
          {prediction && !pointsBreakdown && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <CheckCircle size={12} />
              <span>Guardada</span>
            </div>
          )}
        </div>

        {/* Teams + Score row */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Home team */}
          <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
            <span className="font-semibold text-xs sm:text-sm text-white text-right leading-tight truncate">{match.home_team}</span>
            {match.home_team_logo && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={match.home_team_logo} alt={match.home_team} className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>

          {/* Score inputs / result */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {match.status === 'finished' ? (
              /* Real result */
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl"
                style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                <span className="text-xl sm:text-2xl font-black text-white">{match.home_score}</span>
                <span className="text-slate-500 font-light">—</span>
                <span className="text-xl sm:text-2xl font-black text-white">{match.away_score}</span>
              </div>
            ) : (
              /* Prediction inputs */
              <>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={homeScore}
                  onChange={e => setHomeScore(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                  disabled={isLocked}
                  className="score-input"
                  placeholder="–"
                  id={`home-${match.id}`}
                />
                <span className="text-slate-500 text-base sm:text-lg font-light">:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={awayScore}
                  onChange={e => setAwayScore(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                  disabled={isLocked}
                  className="score-input"
                  placeholder="–"
                  id={`away-${match.id}`}
                />
              </>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 flex items-center justify-start gap-1.5 sm:gap-2 min-w-0">
            {match.away_team_logo && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={match.away_team_logo} alt={match.away_team} className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <span className="font-semibold text-xs sm:text-sm text-white leading-tight truncate">{match.away_team}</span>
          </div>
        </div>

        {/* User's prediction result (if match finished) */}
        {match.status === 'finished' && prediction && (
          <div className="mt-3 flex flex-col items-center gap-1.5 text-xs text-slate-400 justify-center border-t border-slate-800/60 pt-2.5">
            <div className="flex items-center gap-2">
              <span>Tu marcador:</span>
              <span className="font-bold text-white text-sm">
                {prediction.predicted_home_score} – {prediction.predicted_away_score}
              </span>
            </div>
            {prediction.predicted_scorers && prediction.predicted_scorers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap justify-center text-[11px]">
                <span className="text-slate-500">⚽ Goleadores:</span>
                <span className="text-emerald-300 font-medium">
                  {prediction.predicted_scorers.map((s, idx) => s.name.split(' ').slice(-1)[0]).join(', ')}
                </span>
              </div>
            )}
            {prediction.predicted_mvp && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500">⭐ MVP:</span>
                <span className="text-amber-300 font-medium">
                  {prediction.predicted_mvp.name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable: Scorers + MVP */}
      {!isLocked && homeScore !== '' && awayScore !== '' && hasSubSelection && (
        <div className="border-t border-slate-700/30">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors">
            <span>
              {showScorers && showMvp ? 'Goleadores y MVP' : showScorers ? 'Goleadores' : 'MVP'}
              <span className="ml-2 text-emerald-400">
                {showScorers && `(${selectedScorers.length}/${maxScorers} goleadores)`}
                {showScorers && showMvp && ' · '}
                {showMvp && (selectedMvp ? '1 MVP' : 'sin MVP')}
              </span>
            </span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-4 animate-fade-in">
              {showScorers && (
                <ScorerSelector
                  match={match}
                  homeScore={homeScore}
                  awayScore={awayScore}
                  selected={selectedScorers}
                  onChange={setSelectedScorers}
                  disabled={isLocked}
                />
              )}
              {showMvp && (
                <MVPSelector
                  match={match}
                  selected={selectedMvp}
                  onChange={setSelectedMvp}
                  disabled={isLocked}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      {!isLocked && (
        <div className="px-4 pb-4">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || homeScore === '' || awayScore === ''}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              hasChanges && homeScore !== '' && awayScore !== ''
                ? 'btn-primary'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}>
            {saving ? 'Guardando...' : hasChanges ? 'Guardar predicción' : 'Predicción guardada ✓'}
          </button>
        </div>
      )}

      {/* Points breakdown for finished matches */}
      {pointsBreakdown && expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/30 pt-3 space-y-1 animate-fade-in">
          <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Desglose de puntos</p>
          {pointsBreakdown.exact_score > 0 && (
            <div className="points-row text-xs">
              <span className="text-slate-400">Marcador exacto 🎯</span>
              <span className="text-emerald-400 font-bold">+{pointsBreakdown.exact_score}</span>
            </div>
          )}
          {pointsBreakdown.result_1x2 > 0 && (
            <div className="points-row text-xs">
              <span className="text-slate-400">Resultado 1X2</span>
              <span className="text-emerald-400 font-bold">+{pointsBreakdown.result_1x2}</span>
            </div>
          )}
          {pointsBreakdown.scorers > 0 && (
            <div className="points-row text-xs">
              <span className="text-slate-400">Goleadores</span>
              <span className="text-emerald-400 font-bold">+{pointsBreakdown.scorers}</span>
            </div>
          )}
          {pointsBreakdown.individual_goals > 0 && (
            <div className="points-row text-xs">
              <span className="text-slate-400">Goles individuales</span>
              <span className="text-emerald-400 font-bold">+{pointsBreakdown.individual_goals}</span>
            </div>
          )}
          {pointsBreakdown.mvp > 0 && (
            <div className="points-row text-xs">
              <span className="text-slate-400">MVP ⭐</span>
              <span className="text-emerald-400 font-bold">+{pointsBreakdown.mvp}</span>
            </div>
          )}
          <div className="points-row text-sm font-bold border-t border-slate-600/40 pt-2 mt-1">
            <span className="text-white">Total</span>
            <span className="text-emerald-400">+{pointsBreakdown.total} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
