'use client';

import { useState } from 'react';
import { Plus, Users, Copy, Check, Lock, Globe, ChevronRight, Sparkles, Trash2, Loader2, Calendar, Trophy, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { CreateLeagueFormData, PointsConfig, FootballLeague } from '@/types';
import { DEFAULT_POINTS_CONFIG } from '@/types';
import { SPANISH_TEAM_NAMES, getTeamLogo } from '@/lib/teams';
import toast from 'react-hot-toast';

interface LeaguesClientProps {
  userId: string;
  isAdmin?: boolean;
  userLeagues: Array<{
    league: {
      id: string;
      name: string;
      creator_id?: string | null;
      is_private: boolean;
      is_official: boolean;
      code_to_join: string | null;
      football_league: string;
      points_config: PointsConfig;
    };
    total_points: number;
    member_count: number;
  }>;
}

const SCORING_OPTIONS = [
  { key: 'exact_score', label: 'Marcador exacto', emoji: '🎯', min: 5, max: 50, step: 5 },
  { key: 'result_1x2', label: 'Resultado 1X2', emoji: '✅', min: 1, max: 30, step: 1 },
  { key: 'scorer_per_goal', label: 'Por cada goleador acertado', emoji: '⚽', min: 1, max: 10, step: 1 },
  { key: 'individual_goals', label: 'Goles individuales acertados', emoji: '📊', min: 1, max: 10, step: 1 },
  { key: 'mvp', label: 'MVP del partido', emoji: '⭐', min: 1, max: 15, step: 1 },
] as const;

export default function LeaguesClient({ userId, isAdmin, userLeagues: initialUserLeagues }: LeaguesClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'my' | 'create' | 'join'>('my');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joiningLeague, setJoiningLeague] = useState(false);
  const [userLeagues, setUserLeagues] = useState(initialUserLeagues);
  const [deletingLeagueId, setDeletingLeagueId] = useState<string | null>(null);
  const [leavingLeagueId, setLeavingLeagueId] = useState<string | null>(null);
  
  // Ownership transfer state
  const [transferModal, setTransferModal] = useState<{leagueId: string, leagueName: string, members: any[]} | null>(null);
  const [selectedNewCreator, setSelectedNewCreator] = useState<string>('');

  // Create league form
  const [form, setForm] = useState<CreateLeagueFormData>({
    name: '',
    is_private: true,
    football_league: 'laliga',
    points_config: { ...DEFAULT_POINTS_CONFIG },
  });
  const [creating, setCreating] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Código copiado al portapapeles');
  };

  const handleDeleteLeague = async (leagueId: string, leagueName: string) => {
    if (!window.confirm(`¿Seguro que quieres eliminar la liga "${leagueName}"? Esta acción no se puede deshacer y borrará a todos los participantes y sus puntos.`)) return;

    setDeletingLeagueId(leagueId);
    try {
      const res = await fetch(`/api/leagues?id=${leagueId}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Error al eliminar la liga');
      } else {
        toast.success(`🗑️ Liga "${leagueName}" eliminada`);
        setUserLeagues(prev => prev.filter(l => l.league.id !== leagueId));
        router.refresh();
      }
    } catch {
      toast.error('Error de red al eliminar la liga');
    } finally {
      setDeletingLeagueId(null);
    }
  };

  const executeLeave = async (leagueId: string, leagueName: string, newCreatorId?: string) => {
    setLeavingLeagueId(leagueId);
    try {
      const url = newCreatorId 
        ? `/api/leagues/leave?id=${leagueId}&new_creator_id=${newCreatorId}` 
        : `/api/leagues/leave?id=${leagueId}`;
      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Error al abandonar la liga');
      } else {
        if (json.action === 'deleted') {
          toast.success(`🗑️ Liga "${leagueName}" eliminada porque eras el único miembro`);
        } else {
          toast.success(`🚪 Has abandonado la liga "${leagueName}"`);
        }
        setUserLeagues(prev => prev.filter(l => l.league.id !== leagueId));
        router.refresh();
        setTransferModal(null);
      }
    } catch {
      toast.error('Error de red al abandonar la liga');
    } finally {
      setLeavingLeagueId(null);
    }
  };

  const handleLeaveLeagueClick = async (league: any, memberCount: number) => {
    if (league.is_official) {
      toast.error('No puedes abandonar una liga oficial');
      return;
    }

    if (league.creator_id === userId) {
      // User is the creator
      if (memberCount === 1) {
        // Only member, confirm and delete
        if (window.confirm(`Eres el único participante en "${league.name}". Si abandonas, la liga será eliminada. ¿Continuar?`)) {
          executeLeave(league.id, league.name);
        }
      } else {
        // More members exist, need to transfer ownership
        setLeavingLeagueId(league.id); // Show spinner while loading members
        try {
          const res = await fetch(`/api/leagues/members?id=${league.id}`);
          const data = await res.json();
          if (res.ok) {
            // Filter out current user
            const otherMembers = data.members.filter((m: any) => m.user_id !== userId);
            setTransferModal({
              leagueId: league.id,
              leagueName: league.name,
              members: otherMembers
            });
            if (otherMembers.length > 0) {
              setSelectedNewCreator(otherMembers[0].user_id);
            }
          } else {
            toast.error('Error al cargar participantes para transferir la liga');
          }
        } catch (e) {
          toast.error('Error de red');
        } finally {
          setLeavingLeagueId(null);
        }
      }
    } else {
      // User is not the creator, just confirm and leave
      if (window.confirm(`¿Seguro que quieres abandonar la liga "${league.name}"? Perderás todos tus puntos acumulados en esta liga.`)) {
        executeLeave(league.id, league.name);
      }
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Introduce un nombre para la liga');
      return;
    }
    setCreating(true);

    try {
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          is_private: form.is_private,
          football_league: 'laliga',
          points_config: form.points_config,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const detail = json.detail ? ` (${json.detail})` : json.code ? ` [${json.code}]` : '';
        toast.error('Error: ' + json.error + detail);
        setCreating(false);
        return;
      }

      toast.success(`🎉 Liga "${form.name}" creada correctamente`);
      setCreating(false);
      router.refresh();
      setActiveTab('my');
    } catch {
      toast.error('Error de red al crear la liga');
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoiningLeague(true);

    try {
      const res = await fetch('/api/leagues/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Error al unirse a la liga');
        setJoiningLeague(false);
        return;
      }

      toast.success(`✅ ¡Te has unido a "${json.league.name}"!`);
      router.refresh();
      setActiveTab('my');
      setJoinCode('');
    } catch {
      toast.error('Error de red al unirse a la liga');
    }
    setJoiningLeague(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Mis Ligas</h1>
        <p className="text-slate-400 text-sm mt-1">Gestiona tus ligas de LaLiga y compite con amigos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl animate-fade-in"
        style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
        {[
          { id: 'my', label: 'Mis Ligas', icon: Users },
          { id: 'create', label: 'Crear Liga', icon: Plus },
          { id: 'join', label: 'Unirse', icon: ChevronRight },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: My Leagues ── */}
      {activeTab === 'my' && (
        <div className="space-y-3 stagger-children">
          {userLeagues.length === 0 && (
            <div className="glass-card p-10 text-center">
              <Users size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Aún no perteneces a ninguna liga.</p>
              <p className="text-slate-500 text-sm">Crea una o únete con un código.</p>
            </div>
          )}
          {userLeagues.map(({ league, total_points, member_count }) => {
            const canDelete = !league.is_official && (league.creator_id === userId || isAdmin);
            const canLeave = !league.is_official;
            const cfg = league.points_config || {};
            const filterTeam = cfg.filter_team;
            const teamLogo = filterTeam ? getTeamLogo(filterTeam) : null;
            const matchdayType = cfg.matchday_type || 'all';

            return (
              <div key={league.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: league.is_official ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                      {league.is_official ? (
                        <Sparkles size={18} className="text-white" />
                      ) : filterTeam && teamLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={teamLogo} alt="" className="w-6 h-6 object-contain" />
                      ) : league.is_private ? (
                        <Lock size={16} className="text-slate-400" />
                      ) : (
                        <Globe size={16} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{league.name}</h3>
                        {league.is_official && (
                          <span className="text-xs px-1.5 py-0.5 rounded text-emerald-400"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            Oficial
                          </span>
                        )}
                        {filterTeam && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1 font-medium">
                            ⚽ Solo {filterTeam}
                          </span>
                        )}
                        {matchdayType === 'single' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                            📅 Jornada {cfg.start_matchday || 1}
                          </span>
                        )}
                        {matchdayType === 'range' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                            📅 Jornadas {cfg.start_matchday || 1} a {cfg.end_matchday || 38}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {member_count} {member_count === 1 ? 'participante' : 'participantes'} · LaLiga 🇪🇸
                      </p>
                      {league.is_private && league.code_to_join && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500">Código:</span>
                          <code className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded"
                            style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                            {league.code_to_join}
                          </code>
                          <button
                            onClick={() => copyCode(league.code_to_join!)}
                            className="text-slate-500 hover:text-emerald-400 transition-colors">
                            {copiedCode === league.code_to_join ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-400">{total_points}</p>
                      <p className="text-xs text-slate-500">puntos</p>
                    </div>

                    {/* Actions (Leave / Delete) */}
                    <div className="flex flex-col gap-2">
                      {canLeave && (
                        <button
                          onClick={() => handleLeaveLeagueClick(league, member_count)}
                          disabled={leavingLeagueId === league.id}
                          className="p-2 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors border border-orange-500/20 text-xs flex items-center justify-center min-w-[36px]"
                          title={league.creator_id === userId ? "Abandonar y ceder liga" : "Abandonar liga"}>
                          {leavingLeagueId === league.id ? <Loader2 size={16} className="animate-spin" /> : '🚪'}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteLeague(league.id, league.name)}
                          disabled={deletingLeagueId === league.id}
                          className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 flex items-center justify-center min-w-[36px]"
                          title="Eliminar liga (solo creadores)">
                          {deletingLeagueId === league.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reglas de la liga */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="text-slate-500 font-medium">Reglas de la liga:</span>
                  <span className="text-slate-400">
                    🎯 Marcador exacto: <strong className="text-emerald-400">+{league.points_config.exact_score}</strong>
                  </span>
                  <span className="text-slate-400">
                    ✅ 1X2: <strong className="text-emerald-400">+{league.points_config.result_1x2}</strong>
                  </span>
                  {league.points_config.enable_scorers !== false && (
                    <span className="text-slate-400">
                      ⚽ Goleador: <strong className="text-emerald-400">+{league.points_config.scorer_per_goal}</strong>
                    </span>
                  )}
                  <span className="text-slate-400">
                    📊 Goles ind: <strong className="text-emerald-400">+{league.points_config.individual_goals}</strong>
                  </span>
                  {league.points_config.enable_mvp !== false && (
                    <span className="text-slate-400">
                      ⭐ MVP: <strong className="text-emerald-400">+{league.points_config.mvp}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Create League ── */}
      {activeTab === 'create' && (
        <div className="glass-card p-6 space-y-6 animate-fade-in">
          <h2 className="text-lg font-bold text-white">Crear Nueva Liga</h2>

          {/* Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Nombre de la liga *</label>
            <input
              type="text"
              placeholder="Ej: Liga del Barça entre amigos"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field"
              maxLength={50}
              id="league-name"
            />
          </div>

          {/* Private toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
            <div>
              <p className="text-sm font-medium text-white">Liga Privada</p>
              <p className="text-xs text-slate-500">Solo accesible con código de invitación</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, is_private: !f.is_private }))}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.is_private ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${form.is_private ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* ── Duración y Jornadas de la Liga ── */}
          <div className="p-4 rounded-xl space-y-3"
            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
            <label className="block text-sm font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-purple-400" />
              Duración y Jornadas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Toda la temporada' },
                { id: 'single', label: '1 sola jornada' },
                { id: 'range', label: 'Rango de jornadas' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    points_config: { ...f.points_config, matchday_type: opt.id as any }
                  }))}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                    (form.points_config.matchday_type || 'all') === opt.id
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Single matchday selector */}
            {form.points_config.matchday_type === 'single' && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 animate-fade-in">
                <label className="block text-xs text-slate-400 font-medium">Selecciona la Jornada en la que competirán:</label>
                <select
                  value={form.points_config.start_matchday || 1}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 1;
                    setForm(f => ({
                      ...f,
                      points_config: { ...f.points_config, start_matchday: val, end_matchday: val }
                    }));
                  }}
                  className="input-field text-xs">
                  {Array.from({ length: 38 }, (_, i) => i + 1).map(j => (
                    <option key={j} value={j}>Jornada {j}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Range matchday selector */}
            {form.points_config.matchday_type === 'range' && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Jornada Inicial:</label>
                  <select
                    value={form.points_config.start_matchday || 1}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setForm(f => ({
                        ...f,
                        points_config: {
                          ...f.points_config,
                          start_matchday: val,
                          end_matchday: Math.max(val, f.points_config.end_matchday || 38)
                        }
                      }));
                    }}
                    className="input-field text-xs">
                    {Array.from({ length: 38 }, (_, i) => i + 1).map(j => (
                      <option key={j} value={j}>Jornada {j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Jornada Final:</label>
                  <select
                    value={form.points_config.end_matchday || 38}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 38;
                      setForm(f => ({
                        ...f,
                        points_config: {
                          ...f.points_config,
                          end_matchday: Math.max(f.points_config.start_matchday || 1, val)
                        }
                      }));
                    }}
                    className="input-field text-xs">
                    {Array.from({ length: 38 }, (_, i) => i + 1).map(j => (
                      <option key={j} value={j}>Jornada {j}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Filtro por Equipo Específico ── */}
          <div className="p-4 rounded-xl space-y-3"
            style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
            <label className="block text-sm font-semibold text-white flex items-center gap-2">
              <Filter size={16} className="text-blue-400" />
              Filtro por Equipo (Liga Monotemática)
            </label>
            <p className="text-xs text-slate-400">Si seleccionas un equipo, la liga solo incluirá los partidos donde juegue ese equipo.</p>
            <select
              value={form.points_config.filter_team || ''}
              onChange={e => {
                const val = e.target.value;
                setForm(f => ({
                  ...f,
                  points_config: { ...f.points_config, filter_team: val ? val : null }
                }));
              }}
              className="input-field text-xs">
              <option value="">Todos los equipos de LaLiga (Sin filtro)</option>
              {SPANISH_TEAM_NAMES.map(team => (
                <option key={team} value={team}>
                  Solo {team}
                </option>
              ))}
            </select>
          </div>

          {/* Toggles for optional features */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-1.5">
                  ⚽ Incluir predicción de Goleadores
                </p>
                <p className="text-xs text-slate-500">Permite acertar los goleadores de cada partido</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  points_config: { ...f.points_config, enable_scorers: !f.points_config.enable_scorers }
                }))}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.points_config.enable_scorers !== false ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${form.points_config.enable_scorers !== false ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-1.5">
                  ⭐ Incluir predicción de MVP
                </p>
                <p className="text-xs text-slate-500">Permite acertar el MVP del partido</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  points_config: { ...f.points_config, enable_mvp: !f.points_config.enable_mvp }
                }))}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.points_config.enable_mvp !== false ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${form.points_config.enable_mvp !== false ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Points configuration */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-white">Configuración de Puntos</h3>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, points_config: { ...DEFAULT_POINTS_CONFIG } }))}
                className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                Restablecer
              </button>
            </div>
            <div className="space-y-5">
              {SCORING_OPTIONS.filter(({ key }) => {
                if (key === 'scorer_per_goal' && form.points_config.enable_scorers === false) return false;
                if (key === 'mvp' && form.points_config.enable_mvp === false) return false;
                return true;
              }).map(({ key, label, emoji, min, max, step }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-300 flex items-center gap-2">
                      <span>{emoji}</span> {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          points_config: { ...f.points_config, [key]: Math.max(min, f.points_config[key] - step) }
                        }))}
                        className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-sm transition-all">
                        −
                      </button>
                      <span className="text-emerald-400 font-bold w-8 text-center text-lg">
                        {form.points_config[key]}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          points_config: { ...f.points_config, [key]: Math.min(max, f.points_config[key] + step) }
                        }))}
                        className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-sm transition-all">
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={form.points_config[key]}
                    onChange={e => setForm(f => ({
                      ...f,
                      points_config: { ...f.points_config, [key]: parseInt(e.target.value) }
                    }))}
                    className="config-slider"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>{min} pts</span>
                    <span>{max} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !form.name.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              creating || !form.name.trim() ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'btn-primary'
            }`}>
            {creating ? 'Creando liga...' : '🚀 Crear Liga'}
          </button>
        </div>
      )}

      {/* ── Tab: Join League ── */}
      {activeTab === 'join' && (
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold text-white">Unirse a una Liga Privada</h2>
          <p className="text-slate-400 text-sm">Introduce el código de 8 caracteres que te ha compartido el creador de la liga.</p>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Código de invitación</label>
            <input
              type="text"
              placeholder="Ej: A1B2C3D4"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 8))}
              className="input-field text-center text-xl font-mono font-bold tracking-widest"
              maxLength={8}
              id="join-code"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={joiningLeague || joinCode.length < 6}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              joiningLeague || joinCode.length < 6 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'btn-primary'
            }`}>
            {joiningLeague ? 'Uniéndose...' : '🤝 Unirme a la Liga'}
          </button>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Ceder Liga</h3>
            <p className="text-sm text-slate-400 mb-6">
              Eres el creador de <strong>{transferModal.leagueName}</strong>. Para abandonarla, debes nombrar a un nuevo administrador de entre los participantes.
            </p>

            <label className="block text-sm font-medium text-slate-300 mb-2">Nuevo Administrador</label>
            <select
              value={selectedNewCreator}
              onChange={(e) => setSelectedNewCreator(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm mb-6 focus:ring-2 focus:ring-emerald-500 outline-none">
              {transferModal.members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles.nickname || m.profiles.email}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTransferModal(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors border border-slate-700">
                Cancelar
              </button>
              <button
                onClick={() => executeLeave(transferModal.leagueId, transferModal.leagueName, selectedNewCreator)}
                disabled={!selectedNewCreator || leavingLeagueId === transferModal.leagueId}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors flex justify-center items-center">
                {leavingLeagueId === transferModal.leagueId ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar y Salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
