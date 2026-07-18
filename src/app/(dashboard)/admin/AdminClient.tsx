'use client';

import { useState } from 'react';
import {
  ShieldCheck, Edit3, CheckCircle, X, Loader2,
  CalendarPlus, Trophy, Users, RefreshCw, Zap, Calendar, Trash2, AlertTriangle
} from 'lucide-react';
import type { Match, Scorer, MVPPlayer, MatchStatus } from '@/types';
import { createClient } from '@/lib/supabase/client';
import ScorerSelector from '@/components/predictions/ScorerSelector';
import MVPSelector from '@/components/predictions/MVPSelector';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminClientProps {
  matches: Match[];
}

import { SPANISH_TEAM_NAMES } from '@/lib/teams';

export default function AdminClient({ matches: initialMatches }: AdminClientProps) {
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [editingDetails, setEditingDetails] = useState<Match | null>(null);
  const [detailsForm, setDetailsForm] = useState({
    home_team: '',
    away_team: '',
    matchday: 1,
    match_date: '',
    status: 'pending' as MatchStatus,
  });
  const [savingDetails, setSavingDetails] = useState(false);

  const startEditDetails = (match: Match) => {
    setEditingDetails(match);
    // Convert UTC/ISO date to local YYYY-MM-DDTHH:mm string for datetime-local input
    const d = new Date(match.match_date);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setDetailsForm({
      home_team: match.home_team,
      away_team: match.away_team,
      matchday: match.matchday,
      match_date: localIso,
      status: match.status,
    });
  };

  const handleSaveDetails = async () => {
    if (!editingDetails) return;
    setSavingDetails(true);

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: editingDetails.id,
          ...detailsForm,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error('Error al modificar partido: ' + json.error);
      } else {
        toast.success('✅ Partido modificado correctamente');
        setMatches(prev => prev.map(m => m.id === editingDetails.id ? (json.match as Match) : m));
        setEditingDetails(null);
      }
    } catch (err: any) {
      toast.error('Error de red: ' + err.message);
    } finally {
      setSavingDetails(false);
    }
  };
  const [activeTab, setActiveTab] = useState<'results' | 'create' | 'sync'>('results');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState<{
    home_score: number;
    away_score: number;
    scorers: Scorer[];
    mvp: MVPPlayer | null;
  }>({ home_score: 0, away_score: 0, scorers: [], mvp: null });
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [beforeDate, setBeforeDate] = useState('2026-08-01');

  // Sync state
  const [syncMatchday, setSyncMatchday] = useState<number>(1);
  const [syncingAction, setSyncingAction] = useState<string | null>(null);

  // New match form
  const [newMatch, setNewMatch] = useState({
    home_team: '',
    away_team: '',
    matchday: 1,
    match_date: '',
    football_league: 'laliga',
  });
  const [creatingMatch, setCreatingMatch] = useState(false);

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar este partido? Esta acción no se puede deshacer.')) return;
    setDeletingMatch(matchId);
    try {
      const res = await fetch('/api/admin/matches/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Error al eliminar');
      } else {
        setMatches(prev => prev.filter(m => m.id !== matchId));
        toast.success('🗑️ Partido eliminado');
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setDeletingMatch(null);
    }
  };

  const handleBulkDelete = async (type: 'before_date' | 'all') => {
    setBulkDeleting(true);
    try {
      const body = type === 'all'
        ? { status_filter: 'all_matches' }
        : { before_date: beforeDate };

      const res = await fetch('/api/admin/matches/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Error al eliminar');
      } else {
        toast.success(`🗑️ ${json.message}`);
        setMatches([]);
        setConfirmDeleteAll(false);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const triggerSync = async (action: 'fixtures' | 'results' | 'all' | 'recalculate_rankings', matchday?: number) => {
    setSyncingAction(action);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, matchday }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Error al ejecutar la sincronización');
      } else {
        toast.success(`✅ ${json.message}`);
        // Refresh matches from Supabase
        const { data: updatedMatches } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: false });
        if (updatedMatches) setMatches(updatedMatches as Match[]);
      }
    } catch (err: any) {
      toast.error('Error al sincronizar: ' + err.message);
    } finally {
      setSyncingAction(null);
    }
  };

  const startEdit = (match: Match) => {
    setEditingMatch(match);
    setEditForm({
      home_score: match.home_score ?? 0,
      away_score: match.away_score ?? 0,
      scorers: match.scorers ?? [],
      mvp: match.mvp,
    });
  };

  const handleSaveResult = async () => {
    if (!editingMatch) return;
    setSaving(true);

    const res = await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: editingMatch.id,
        home_score: editForm.home_score,
        away_score: editForm.away_score,
        scorers: editForm.scorers,
        mvp: editForm.mvp,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error('Error al guardar resultado: ' + json.error);
      setSaving(false);
      return;
    }

    // Update local state
    setMatches(prev => prev.map(m =>
      m.id === editingMatch.id
        ? { ...m, ...editForm, status: 'finished' as const }
        : m
    ));

    toast.success('✅ Resultado guardado y puntos recalculados');
    setEditingMatch(null);
    setSaving(false);
  };

  const handleRecalculate = async (matchId: string) => {
    setRecalculating(matchId);
    const res = await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId }),
    });
    if (!res.ok) {
      toast.error('Error al recalcular puntos');
    } else {
      toast.success('🎯 Puntos recalculados para todos los participantes');
    }
    setRecalculating(null);
  };

  const handleCreateMatch = async () => {
    if (!newMatch.home_team || !newMatch.away_team || !newMatch.match_date) {
      toast.error('Rellena todos los campos obligatorios');
      return;
    }
    if (newMatch.home_team === newMatch.away_team) {
      toast.error('Los equipos deben ser diferentes');
      return;
    }
    setCreatingMatch(true);

    const res = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMatch),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error('Error al crear el partido: ' + json.error);
    } else {
      toast.success(`✅ Partido creado: ${newMatch.home_team} vs ${newMatch.away_team}`);
      setMatches(prev => [json.match as Match, ...prev]);
      setNewMatch({ home_team: '', away_team: '', matchday: 1, match_date: '', football_league: 'laliga' });
      setActiveTab('results');
    }
    setCreatingMatch(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
            <p className="text-slate-400 text-sm">Gestión de partidos, resultados y sincronización API</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in">
        {[
          { label: 'Total partidos', value: matches.length, icon: Trophy, color: 'text-amber-400' },
          { label: 'Pendientes', value: matches.filter(m => m.status === 'pending').length, icon: CalendarPlus, color: 'text-blue-400' },
          { label: 'Finalizados', value: matches.filter(m => m.status === 'finished').length, icon: CheckCircle, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <Icon size={20} className={`${color} mx-auto mb-2`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl animate-fade-in"
        style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
        {[
          { id: 'results', label: 'Resultados', icon: Edit3 },
          { id: 'create', label: 'Crear Partido', icon: CalendarPlus },
          { id: 'sync', label: 'Sincronización API', icon: RefreshCw },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Results ── */}
      {activeTab === 'results' && (
        <div className="space-y-3 stagger-children">
          {matches.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Trophy size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay partidos creados aún.</p>
            </div>
          )}
          {matches.map(match => (
            <div key={match.id} className="glass-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge-${match.status}`}>
                      {match.status === 'pending' ? 'Pendiente' : match.status === 'live' ? 'En vivo' : 'Finalizado'}
                    </span>
                    <span className="text-xs text-slate-500">J{match.matchday}</span>
                  </div>
                  <p className="font-semibold text-white text-sm">
                    {match.home_team} vs {match.away_team}
                  </p>
                  {match.status === 'finished' && (
                    <p className="text-emerald-400 font-bold text-lg mt-1">
                      {match.home_score} — {match.away_score}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {format(new Date(match.match_date), "d MMM yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {match.status === 'finished' && (
                    <button
                      onClick={() => handleRecalculate(match.id)}
                      disabled={recalculating === match.id}
                      className="text-xs px-3 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all border border-emerald-500/20 flex items-center gap-1">
                      {recalculating === match.id ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                      Recalcular
                    </button>
                  )}
                  <button
                    onClick={() => startEditDetails(match)}
                    className="text-xs px-3 py-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all border border-blue-500/20 flex items-center gap-1">
                    <Calendar size={12} />
                    Modificar
                  </button>
                  <button
                    onClick={() => startEdit(match)}
                    className="text-xs px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1">
                    <Edit3 size={12} />
                    {match.status === 'finished' ? 'Editar Marcador' : 'Resultado'}
                  </button>
                  <button
                    onClick={() => handleDeleteMatch(match.id)}
                    disabled={deletingMatch === match.id}
                    className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20 flex items-center gap-1">
                    {deletingMatch === match.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Create Match ── */}
      {activeTab === 'create' && (
        <div className="glass-card p-6 space-y-5 animate-fade-in">
          <h2 className="text-lg font-bold text-white">Crear Nuevo Partido</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Equipo local *</label>
              <select
                value={newMatch.home_team}
                onChange={e => setNewMatch(f => ({ ...f, home_team: e.target.value }))}
                className="input-field">
                <option value="">Seleccionar...</option>
                {SPANISH_TEAM_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Equipo visitante *</label>
              <select
                value={newMatch.away_team}
                onChange={e => setNewMatch(f => ({ ...f, away_team: e.target.value }))}
                className="input-field">
                <option value="">Seleccionar...</option>
                {SPANISH_TEAM_NAMES.filter(t => t !== newMatch.home_team).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Jornada</label>
              <input
                type="number"
                min={1}
                max={38}
                value={newMatch.matchday}
                onChange={e => setNewMatch(f => ({ ...f, matchday: parseInt(e.target.value) || 1 }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Fecha y hora *</label>
              <input
                type="datetime-local"
                value={newMatch.match_date}
                onChange={e => setNewMatch(f => ({ ...f, match_date: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={creatingMatch || !newMatch.home_team || !newMatch.away_team || !newMatch.match_date}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              creatingMatch || !newMatch.home_team || !newMatch.away_team || !newMatch.match_date
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'btn-primary'
            }`}>
            {creatingMatch ? 'Creando...' : '⚽ Crear Partido'}
          </button>
        </div>
      )}

      {/* ── Tab: API Sync ── */}
      {activeTab === 'sync' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <RefreshCw size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Sincronización Automática API-Football</h2>
                <p className="text-xs text-slate-400">Actualiza partidos, resultados y goleadores desde la API de fútbol</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Card 1: Sync Fixtures */}
              <div className="glass-card p-4 space-y-3 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-400" />
                    <span className="font-semibold text-white text-sm">Calendario de Jornada</span>
                  </div>
                  <span className="text-xs text-slate-500">API-Football</span>
                </div>
                <p className="text-xs text-slate-400">
                  Descarga los partidos, escudos y horarios de una jornada específica de LaLiga.
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Jornada:</label>
                  <input
                    type="number"
                    min={1}
                    max={38}
                    value={syncMatchday}
                    onChange={e => setSyncMatchday(parseInt(e.target.value) || 1)}
                    className="w-16 input-field py-1 text-center text-xs"
                  />
                  <button
                    onClick={() => triggerSync('fixtures', syncMatchday)}
                    disabled={syncingAction !== null}
                    className="flex-1 btn-secondary py-1.5 text-xs justify-center gap-1">
                    {syncingAction === 'fixtures' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Sincronizar J{syncMatchday}
                  </button>
                </div>
              </div>

              {/* Card 2: Sync Results */}
              <div className="glass-card p-4 space-y-3 border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" />
                    <span className="font-semibold text-white text-sm">Resultados y Goleadores</span>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">AutoRecalc</span>
                </div>
                <p className="text-xs text-slate-400">
                  Comprueba partidos terminados en directo, descarga goles y recalcula puntos de usuarios.
                </p>
                <button
                  onClick={() => triggerSync('results')}
                  disabled={syncingAction !== null}
                  className="w-full btn-primary py-2 text-xs justify-center gap-1">
                  {syncingAction === 'results' ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  Actualizar Marcadores en Directo
                </button>
              </div>
            </div>

            {/* Complete Sync & Recalculate Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => triggerSync('all')}
                disabled={syncingAction !== null}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                {syncingAction === 'all' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                🔄 Ejecutar Sincronización Completa (Calendario + Resultados)
              </button>

              <button
                onClick={() => triggerSync('recalculate_rankings')}
                disabled={syncingAction !== null}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all flex items-center justify-center gap-2">
                {syncingAction === 'recalculate_rankings' ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                📊 Recalcular Puntos Totales y Clasificación General
              </button>
            </div>
          </div>

          {/* ── Danger Zone: Delete Matches ── */}
          <div className="glass-card p-6 space-y-4 border border-red-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Gestión de Partidos</h2>
                <p className="text-xs text-slate-400">Elimina partidos erróneos o de temporadas anteriores</p>
              </div>
            </div>

            {/* Delete before date */}
            <div className="glass-card p-4 space-y-3 border border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-sm font-semibold text-white">Eliminar partidos anteriores a una fecha</span>
              </div>
              <p className="text-xs text-slate-400">Útil para borrar partidos de temporadas pasadas (ej: temporada 2024-25).</p>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={beforeDate}
                  onChange={e => setBeforeDate(e.target.value)}
                  className="input-field flex-1 py-1.5 text-xs"
                />
                <button
                  onClick={() => handleBulkDelete('before_date')}
                  disabled={bulkDeleting || !beforeDate}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all text-xs font-medium">
                  {bulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Eliminar anteriores a {beforeDate}
                </button>
              </div>
            </div>

            {/* Delete all */}
            <div className="glass-card p-4 space-y-3 border border-red-900/30">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-sm font-semibold text-white">Eliminar TODOS los partidos</span>
              </div>
              <p className="text-xs text-slate-400">⚠️ Borra absolutamente todos los partidos de la base de datos. Esta acción no se puede deshacer.</p>
              {!confirmDeleteAll ? (
                <button
                  onClick={() => setConfirmDeleteAll(true)}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-medium">
                  <Trash2 size={12} />
                  Eliminar todos los partidos
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-400 font-medium">¿Estás seguro? Esta acción es irreversible.</span>
                  <button
                    onClick={() => handleBulkDelete('all')}
                    disabled={bulkDeleting}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-all text-xs font-bold">
                    {bulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Sí, borrar todo
                  </button>
                  <button
                    onClick={() => setConfirmDeleteAll(false)}
                    className="text-xs text-slate-400 hover:text-white transition-colors">
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Result Modal ── */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                Resultado: {editingMatch.home_team} vs {editingMatch.away_team}
              </h2>
              <button onClick={() => setEditingMatch(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">{editingMatch.home_team}</p>
                <input
                  type="number"
                  min={0}
                  value={editForm.home_score}
                  onChange={e => setEditForm(f => ({ ...f, home_score: parseInt(e.target.value) || 0 }))}
                  className="score-input"
                />
              </div>
              <span className="text-slate-500 text-2xl">—</span>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">{editingMatch.away_team}</p>
                <input
                  type="number"
                  min={0}
                  value={editForm.away_score}
                  onChange={e => setEditForm(f => ({ ...f, away_score: parseInt(e.target.value) || 0 }))}
                  className="score-input"
                />
              </div>
            </div>

            {/* Scorers & MVP */}
            <div className="space-y-4 mb-6">
              <ScorerSelector
                match={editingMatch}
                homeScore={editForm.home_score}
                awayScore={editForm.away_score}
                selected={editForm.scorers}
                onChange={scorers => setEditForm(f => ({ ...f, scorers }))}
              />
              <MVPSelector
                match={editingMatch}
                selected={editForm.mvp}
                onChange={mvp => setEditForm(f => ({ ...f, mvp }))}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 btn-secondary py-3 text-sm">
                Cancelar
              </button>
              <button
                onClick={handleSaveResult}
                disabled={saving}
                className="flex-1 btn-primary py-3 text-sm justify-center">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : '✅ Guardar y Recalcular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Match Details Modal (Fecha, Aplazamiento, Equipos) ── */}
      {editingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card w-full max-w-md p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                Modificar Partido / Fecha
              </h2>
              <button onClick={() => setEditingDetails(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Local</label>
                <select
                  value={detailsForm.home_team}
                  onChange={e => setDetailsForm(f => ({ ...f, home_team: e.target.value }))}
                  className="input-field text-xs">
                  {SPANISH_TEAM_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Visitante</label>
                <select
                  value={detailsForm.away_team}
                  onChange={e => setDetailsForm(f => ({ ...f, away_team: e.target.value }))}
                  className="input-field text-xs">
                  {SPANISH_TEAM_NAMES.filter(t => t !== detailsForm.home_team).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Date and Matchday */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Jornada</label>
                <input
                  type="number"
                  min={1}
                  max={38}
                  value={detailsForm.matchday}
                  onChange={e => setDetailsForm(f => ({ ...f, matchday: parseInt(e.target.value) || 1 }))}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Estado</label>
                <select
                  value={detailsForm.status}
                  onChange={e => setDetailsForm(f => ({ ...f, status: e.target.value as MatchStatus }))}
                  className="input-field text-xs">
                  <option value="pending">Pendiente / Aplazado</option>
                  <option value="live">En Vivo 🔴</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>
            </div>

            {/* Date time local */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nueva Fecha y Hora (Hora de España) *</label>
              <input
                type="datetime-local"
                value={detailsForm.match_date}
                onChange={e => setDetailsForm(f => ({ ...f, match_date: e.target.value }))}
                className="input-field text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingDetails(null)}
                className="btn-secondary py-2.5 flex-1 text-xs justify-center">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={savingDetails || !detailsForm.match_date}
                className="btn-primary py-2.5 flex-1 text-xs justify-center">
                {savingDetails ? <Loader2 size={14} className="animate-spin" /> : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

