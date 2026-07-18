'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Award, Shield, Sparkles, Check, Loader2, Camera, Flame, Target, Trophy } from 'lucide-react';
import type { Profile } from '@/types';
import toast from 'react-hot-toast';

interface ProfileClientProps {
  profile: Profile;
  stats: {
    totalPredictions: number;
    totalPoints: number;
    exactScores: number;
  };
}

const LALIGA_TEAMS = [
  { name: 'Real Madrid', emoji: '👑', color: 'from-blue-600 to-amber-500' },
  { name: 'FC Barcelona', emoji: '🔵🔴', color: 'from-blue-700 to-red-600' },
  { name: 'Atlético de Madrid', emoji: '🔴⚪', color: 'from-red-600 to-blue-800' },
  { name: 'Athletic Club', emoji: '🔴⚪🦁', color: 'from-red-600 to-slate-800' },
  { name: 'Real Sociedad', emoji: '⚪🔵', color: 'from-blue-600 to-indigo-800' },
  { name: 'Villarreal', emoji: '💛', color: 'from-amber-400 to-yellow-600' },
  { name: 'Real Betis', emoji: '💚🤍', color: 'from-emerald-600 to-green-700' },
  { name: 'Valencia CF', emoji: '🦇', color: 'from-orange-500 to-slate-900' },
  { name: 'Celta de Vigo', emoji: '🩵', color: 'from-sky-400 to-blue-600' },
  { name: 'Osasuna', emoji: '🔴', color: 'from-red-700 to-slate-900' },
  { name: 'Sevilla FC', emoji: '⚪🔴', color: 'from-red-600 to-rose-700' },
  { name: 'Rayo Vallecano', emoji: '⚡', color: 'from-red-500 to-amber-500' },
  { name: 'Getafe CF', emoji: '💙', color: 'from-blue-600 to-blue-900' },
  { name: 'UD Las Palmas', emoji: '🌴', color: 'from-yellow-400 to-blue-600' },
  { name: 'Deportivo Alavés', emoji: '⚪🔵', color: 'from-blue-500 to-slate-800' },
  { name: 'Girona FC', emoji: '🔴⚪', color: 'from-red-500 to-rose-600' },
  { name: 'RCD Espanyol', emoji: '🐦', color: 'from-blue-600 to-teal-600' },
  { name: 'RCD Mallorca', emoji: '👺', color: 'from-red-600 to-amber-600' },
  { name: 'CD Leganés', emoji: '🥒', color: 'from-blue-500 to-emerald-600' },
  { name: 'Real Valladolid', emoji: '🟣', color: 'from-purple-600 to-indigo-800' },
];

const SUGGESTED_TAGLINES = [
  'El Nostradamus de LaLiga 🔮',
  'Solo pronostico 2-1 🎯',
  'Rumbo al liderato 🏆',
  'Confío en los minutos de descuento ⏱️',
  'Maestro del marcador exacto 🧠',
  'Analista táctico de sillón ⚽',
];

export default function ProfileClient({ profile, stats }: ProfileClientProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState(profile.nickname);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [favoriteTeam, setFavoriteTeam] = useState(profile.favorite_team ?? '');
  const [tagline, setTagline] = useState(profile.tagline ?? '');
  const [saving, setSaving] = useState(false);

  // Calculate Rank level
  const getRank = (pts: number) => {
    if (pts >= 500) return { title: 'Leyenda de Quinielator', icon: '👑', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (pts >= 200) return { title: 'Maestro de LaLiga', icon: '🥇', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (pts >= 50) return { title: 'Táctico Experto', icon: '🥈', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    return { title: 'Aspirante Quinielero', icon: '🥉', badge: 'bg-slate-700/60 text-slate-300 border-slate-600' };
  };

  const rank = getRank(stats.totalPoints);
  const selectedTeamObj = LALIGA_TEAMS.find(t => t.name === favoriteTeam);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 3) {
      toast.error('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          avatar_url: avatarUrl.trim() || null,
          favorite_team: favoriteTeam || null,
          tagline: tagline.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Error al guardar perfil');
      } else {
        toast.success('✨ Perfil actualizado con éxito');
        router.refresh();
      }
    } catch (err: any) {
      toast.error('Error de red: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header Profile Card */}
      <div className="glass-card p-6 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Trophy size={140} />
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          {/* Avatar view */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl ring-4 ring-emerald-500/30 flex items-center justify-center overflow-hidden font-bold text-2xl text-white shadow-xl"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
              ) : (
                nickname.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs">
              {rank.icon}
            </div>
          </div>

          {/* Info Header */}
          <div className="text-center sm:text-left flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-white">{nickname}</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${rank.badge}`}>
                <span>{rank.icon}</span> {rank.title}
              </span>
            </div>

            <p className="text-sm text-slate-400 italic">
              {tagline ? `"${tagline}"` : 'Sin lema quinielero aún'}
            </p>

            {selectedTeamObj && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 mt-2">
                <span>{selectedTeamObj.emoji}</span>
                <span>Fan del <strong>{selectedTeamObj.name}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* User Engagement Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400">{stats.totalPoints}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Trophy size={12} className="text-amber-400" /> Puntos Totales
            </p>
          </div>
          <div className="text-center border-x border-slate-800">
            <p className="text-2xl font-black text-amber-400">{stats.exactScores}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Target size={12} className="text-emerald-400" /> Plenos Exactos
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-blue-400">{stats.totalPredictions}</p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Flame size={12} className="text-blue-400" /> Predicciones
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="glass-card p-6 space-y-6 animate-slide-up">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <User size={18} className="text-emerald-400" />
          Editar Perfil
        </h2>

        {/* Nickname */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Nombre de Usuario (Nickname) *</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value.replace(/\s/g, ''))}
            required
            minLength={3}
            maxLength={20}
            className="input-field"
            placeholder="Ej: ElCrack99"
          />
          <p className="text-xs text-slate-500 mt-1">Este es el nombre visible en la clasificación de tus ligas.</p>
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">URL de Imagen / Avatar (Opcional)</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              className="input-field flex-1"
              placeholder="https://ejemplo.com/mi-foto.jpg"
            />
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="btn-secondary px-3 text-xs text-red-400 hover:bg-red-500/10">
                Quitar
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Puedes usar la URL de cualquier imagen web o foto de perfil.</p>
        </div>

        {/* Lema / Tagline */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Frase o Lema Quinielero</label>
          <input
            type="text"
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            maxLength={80}
            className="input-field"
            placeholder="Ej: El Nostradamus del fútbol 🔮"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_TAGLINES.map(sugg => (
              <button
                key={sugg}
                type="button"
                onClick={() => setTagline(sugg)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700">
                + {sugg}
              </button>
            ))}
          </div>
        </div>

        {/* Favorite Team */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Equipo Favorito de LaLiga</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LALIGA_TEAMS.map(team => (
              <button
                key={team.name}
                type="button"
                onClick={() => setFavoriteTeam(favoriteTeam === team.name ? '' : team.name)}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  favoriteTeam === team.name
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}>
                <span>{team.emoji}</span>
                <span className="truncate">{team.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl font-semibold text-sm btn-primary justify-center gap-2">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : '💾 Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}
