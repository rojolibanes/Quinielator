'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Users } from 'lucide-react';
import type { Match, League, Prediction, Scorer, MVPPlayer } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getMaxScorers, calculatePoints, isMatchApplicableToLeague } from '@/lib/scoring/calculatePoints';
import ScorerSelector from './ScorerSelector';
import MVPSelector from './MVPSelector';
import MatchCommunityModal from './MatchCommunityModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MatchCardProps {
  match: Match;
  league: League;
  prediction: Prediction | null;
  userId: string;
  onPredictionSaved: (prediction: Prediction) => void;
  userLeagues?: League[];
  onPredictionSavedAll?: (predictions: Prediction[]) => void;
}

export default function MatchCard({
  match,
  league,
  prediction,
  userId,
  onPredictionSaved,
  userLeagues = [],
  onPredictionSavedAll,
}: MatchCardProps) {
  const supabase = createClient();
  const [homeScore, setHomeScore] = useState<number | ''>(prediction?.predicted_home_score ?? '');
  const [awayScore, setAwayScore] = useState<number | ''>(prediction?.predicted_away_score ?? '');
  const [selectedScorers, setSelectedScorers] = useState<Scorer[]>(prediction?.predicted_scorers ?? []);
  const [selectedMvp, setSelectedMvp] = useState<MVPPlayer | null>(prediction?.predicted_mvp ?? null);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

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



  const showScorers = league.points_config.enable_scorers !== false;
  const showMvp = league.points_config.enable_mvp !== false;
  const hasSubSelection = showScorers || showMvp;

  const buildPayload = (targetLeague: League) => ({
    league_id: targetLeague.id,
    match_id: match.id,
    predicted_home_score: Number(homeScore),
    predicted_away_score: Number(awayScore),
    predicted_scorers: targetLeague.points_config?.enable_scorers !== false ? selectedScorers : [],
    predicted_mvp: targetLeague.points_config?.enable_mvp !== false ? selectedMvp : null,
  });

  const validate = () => {
    if (homeScore === '' || awayScore === '') {
      toast.error('Introduce el marcador antes de guardar.');
      return false;
    }
    if (showScorers && maxScorers > 0 && selectedScorers.length < maxScorers) {
      toast.error(`Debes indicar todos los goleadores (${selectedScorers.length}/${maxScorers} goles asignados).`);
      setExpanded(true);
      return false;
    }
    if (showMvp && !selectedMvp) {
      toast.error('Debes seleccionar el MVP del partido.');
      setExpanded(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(league)),
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

  const applicableLeagues = userLeagues.filter(l => isMatchApplicableToLeague(match, l));

  const handleSaveAll = async () => {
    if (!validate()) return;
    if (applicableLeagues.length <= 1) {
      // Only one league applicable, behave like normal save
      return handleSave();
    }
    setSavingAll(true);
    try {
      // Save only for leagues where this match is applicable
      const results = await Promise.allSettled(
        applicableLeagues.map(l =>
          fetch('/api/predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPayload(l)),
          }).then(r => r.json().then(json => ({ ok: r.ok, json, leagueName: l.name })))
        )
      );

      const saved: Prediction[] = [];
      const errors: string[] = [];

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.ok) {
            saved.push(result.value.json.prediction as Prediction);
          } else {
            errors.push(`${result.value.leagueName}: ${result.value.json.error}`);
          }
        }
      });

      if (errors.length > 0) {
        toast.error(`Guardado parcial. Errores en: ${errors.join(', ')}`);
      } else {
        toast.success(`✅ Predicción guardada en ${saved.length} liga${saved.length > 1 ? 's' : ''}`);
      }

      // Notify parent of saves
      const currentLeaguePrediction = saved.find(p => p.league_id === league.id);
      if (currentLeaguePrediction) {
        onPredictionSaved(currentLeaguePrediction);
      }
      if (onPredictionSavedAll && saved.length > 0) {
        onPredictionSavedAll(saved);
      }
      setHasChanges(false);
    } catch {
      toast.error('Error de red al guardar las predicciones');
    } finally {
      setSavingAll(false);
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
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Home team */}
          <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
            <span className="font-semibold text-[11px] sm:text-sm text-white text-right leading-tight break-words">{match.home_team}</span>
            {match.home_team_logo && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={match.home_team_logo} alt={match.home_team} className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>

          {/* Score inputs / result */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {match.status === 'finished' ? (
              /* Real result */
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl"
                style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                <span className="text-lg sm:text-2xl font-black text-white">{match.home_score}</span>
                <span className="text-slate-500 font-light">—</span>
                <span className="text-lg sm:text-2xl font-black text-white">{match.away_score}</span>
              </div>
            ) : (
              /* Prediction inputs */
              <>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={homeScore}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Math.min(9, Math.max(0, parseInt(e.target.value)));
                    setHomeScore(val);
                    if (val !== '') setExpanded(true);
                  }}
                  disabled={isLocked}
                  className="score-input"
                  placeholder="–"
                  id={`home-${match.id}`}
                />
                <span className="text-slate-500 text-sm sm:text-lg font-light">:</span>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={awayScore}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Math.min(9, Math.max(0, parseInt(e.target.value)));
                    setAwayScore(val);
                    if (val !== '') setExpanded(true);
                  }}
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
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={match.away_team_logo} alt={match.away_team} className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <span className="font-semibold text-[11px] sm:text-sm text-white leading-tight break-words">{match.away_team}</span>
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
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-slate-800/30 transition-all border-b border-slate-700/20">
            {expanded ? (
              <span className="text-slate-400 font-medium">Ocultar panel de selección</span>
            ) : (
              <span className="text-xs text-slate-400 text-left leading-relaxed">
                {showMvp && (
                  <span className="mr-3">
                    <span className="text-slate-500 font-medium">MVP:</span>{' '}
                    <span className="text-amber-400/90 font-semibold">
                      {selectedMvp ? (selectedMvp.name.split(' ').pop() || selectedMvp.name) : 'ninguno'}
                    </span>
                  </span>
                )}
                {showScorers && (
                  <span>
                    <span className="text-slate-500 font-medium">Goleadores:</span>{' '}
                    <span className="text-emerald-400/90 font-semibold">
                      {(() => {
                        if (selectedScorers.length === 0) return 'ninguno';
                        const counts = new Map<string, number>();
                        selectedScorers.forEach(s => {
                          const shortName = s.name.split(' ').pop() || s.name;
                          counts.set(shortName, (counts.get(shortName) || 0) + 1);
                        });
                        const parts: string[] = [];
                        counts.forEach((count, name) => {
                          parts.push(count > 1 ? `${name} (${count})` : name);
                        });
                        return parts.join(', ');
                      })()}
                    </span>
                  </span>
                )}
              </span>
            )}
            {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
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

      {/* Save buttons (only shown when there are pending unsaved changes) */}
      {!isLocked && hasChanges && (
        <div className="px-4 pb-4 animate-fade-in space-y-2">
          {/* Save for all compatible leagues button — only shown when user has more than 1 compatible league for this match */}
          {applicableLeagues.length > 1 && (
            <button
              onClick={handleSaveAll}
              disabled={savingAll || saving || homeScore === '' || awayScore === ''}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                homeScore !== '' && awayScore !== ''
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}>
              {savingAll ? 'Guardando en ligas compatibles...' : `🌐 Guardar para mis ligas compatibles (${applicableLeagues.length})`}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || savingAll || homeScore === '' || awayScore === ''}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              homeScore !== '' && awayScore !== ''
                ? 'btn-primary'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}>
            {saving ? 'Guardando...' : applicableLeagues.length > 1 ? `Guardar solo para "${league.name}"` : 'Guardar predicción'}
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

      {/* Community Predictions Button (only visible once the match is started / locked) */}
      {isLocked && (
        <div className="px-4 pb-3.5 pt-1">
          <button
            onClick={() => setShowCommunityModal(true)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-750 border border-slate-700/70 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99]">
            <Users size={14} className="text-emerald-400" />
            <span>Predicciones de la liga</span>
          </button>
        </div>
      )}

      {/* Match Community Predictions Modal */}
      {showCommunityModal && (
        <MatchCommunityModal
          match={match}
          league={league}
          onClose={() => setShowCommunityModal(false)}
        />
      )}
    </div>
  );
}
