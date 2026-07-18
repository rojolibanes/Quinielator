'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Check, Loader2, Flame, Target, Trophy } from 'lucide-react';
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

const PRESET_AVATARS = [
  { id: 'soccer', label: 'Futbolista ⚽', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=soccer' },
  { id: 'trophy', label: 'Campeón 🏆', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trophy' },
  { id: 'crown', label: 'Leyenda 👑', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=crown' },
  { id: 'fire', label: 'En Racha 🔥', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=fire' },
  { id: 'tactical', label: 'Táctico 🧠', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tactical' },
  { id: 'striker', label: 'Goleador 🎯', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=striker' },
  { id: 'lion', label: 'León 🦁', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=lion' },
  { id: 'coach', label: 'Entrenador 🕶️', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=coach' },
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
            <div className="w-20 h-20 rounded-2xl ring-4 ring-emerald-500/30 flex items-center justify-center overflow-hidden font-bold text-2xl text-white shadow-xl bg-slate-800"
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

        {/* Preset Avatars Selection */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Seleccionar Avatar Predeterminado</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
            {PRESET_AVATARS.map(avatar => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setAvatarUrl(avatar.url)}
                className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  avatarUrl === avatar.url
                    ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar.url} alt={avatar.label} className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-[10px] text-slate-400 truncate w-full text-center">{avatar.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Custom Avatar URL */}
          <div className="pt-2">
            <label className="block text-xs text-slate-500 mb-1">O introduce una URL de imagen propia:</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="input-field flex-1 py-1.5 text-xs"
                placeholder="https://ejemplo.com/mi-foto.jpg"
              />
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="btn-secondary px-3 py-1 text-xs text-red-400 hover:bg-red-500/10">
                  Quitar foto
                </button>
              )}
            </div>
          </div>
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
