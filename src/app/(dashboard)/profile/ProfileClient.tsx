'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Loader2, Target, Trophy, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Profile } from '@/types';
import toast from 'react-hot-toast';

interface ProfileClientProps {
  profile: Profile;
  stats: {
    totalPoints: number;
    exactPct: number;
    result1X2Pct: number;
    totalFinished: number;
  };
}

// 9 Premium Football Badge Avatars matching user reference image
const PRESET_AVATARS = [
  { id: 'balon_dorado', label: 'Balón Dorado ⚽', url: '/avatars/avatar_1.png' },
  { id: 'escudo_honor', label: 'Escudo Honor 🛡️', url: '/avatars/avatar_2.png' },
  { id: 'celebracion', label: 'Celebración 🚀', url: '/avatars/avatar_3.png' },
  { id: 'bota_oro', label: 'Bota de Oro 👟', url: '/avatars/avatar_4.png' },
  { id: 'corona_laurel', label: 'Corona & Laurel 👑', url: '/avatars/avatar_5.png' },
  { id: 'palomita', label: 'Palomita 🧤', url: '/avatars/avatar_6.png' },
  { id: 'silbato_tarjeta', label: 'Silbato & Tarjeta 🟨', url: '/avatars/avatar_7.png' },
  { id: 'golazo', label: 'Golazo 🥅', url: '/avatars/avatar_8.png' },
  { id: 'aficion', label: 'La Afición 🧣', url: '/avatars/avatar_9.png' },
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
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Calculate Rank level
  const getRank = (pts: number) => {
    if (pts >= 500) return { title: 'Leyenda de Quinielator', icon: '👑', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (pts >= 200) return { title: 'Maestro de LaLiga', icon: '🥇', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (pts >= 50) return { title: 'Táctico Experto', icon: '🥈', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    return { title: 'Aspirante Quinielero', icon: '🥉', badge: 'bg-slate-700/60 text-slate-300 border-slate-600' };
  };

  const rank = getRank(stats.totalPoints);

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿ESTÁS SEGURO? Esta acción es irreversible. Se eliminará tu cuenta, tu perfil y todas tus predicciones para siempre.')) return;
    
    // Double confirmation for safety
    if (!window.confirm('ÚLTIMA CONFIRMACIÓN. ¿Borrar tu cuenta de QuinielaTOR definitivamente?')) return;

    setDeletingAccount(true);
    try {
      const res = await fetch('/api/profile/delete', { method: 'DELETE' });
      const json = await res.json();
      
      if (!res.ok) {
        toast.error(json.error || 'Error al eliminar la cuenta');
      } else {
        toast.success('Cuenta eliminada correctamente. Adiós.');
        // User will be signed out by the server, but let's force a client side redirect to login
        router.push('/login');
        router.refresh();
      }
    } catch (e) {
      toast.error('Error de red al eliminar la cuenta');
    } finally {
      setDeletingAccount(false);
    }
  };

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
    <div className="max-w-3xl mx-auto px-4 space-y-6">
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
                <img src={avatarUrl} alt={nickname} className="w-full h-full object-contain p-0.5" />
              ) : (
                nickname.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs shadow-md">
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
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5 font-medium">
              <Trophy size={13} className="text-amber-400" /> Puntos Totales
            </p>
          </div>
          <div className="text-center border-x border-slate-800">
            <p className="text-2xl font-black text-amber-400">{stats.exactPct}%</p>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5 font-medium">
              <Target size={13} className="text-emerald-400" /> % Plenos Exactos
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-blue-400">{stats.result1X2Pct}%</p>
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 size={13} className="text-blue-400" /> % Acierto 1X2
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

        {/* Football Preset Avatars Selection */}
        <div>
          <label className="block text-sm text-slate-400 mb-2 font-medium">Avatares Futboleros Oficiales ⚽</label>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-9 gap-2.5 mb-3">
            {PRESET_AVATARS.map(avatar => {
              const isSelected = avatarUrl === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarUrl(avatar.url)}
                  className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/40'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar.url} alt={avatar.label} className="w-14 h-14 rounded-full object-contain p-0.5" />
                  <span className={`text-[11px] truncate w-full text-center font-medium ${isSelected ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>
                    {avatar.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Avatar URL */}
          <div className="pt-2">
            <label className="block text-xs text-slate-500 mb-1">O introduce una URL de imagen propia:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="input-field flex-1 py-1.5 text-xs"
                placeholder="https://ejemplo.com/mi-foto.jpg o /avatars/avatar_1.png"
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
      {/* Danger Zone */}
      <div className="mt-8 pt-6 border-t border-red-900/30">
        <h3 className="text-red-400 font-semibold flex items-center gap-2 mb-2 text-sm">
          <AlertTriangle size={16} /> Zona Peligrosa
        </h3>
        <div className="glass-card p-4 border border-red-900/50 bg-red-950/10">
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Eliminar tu cuenta borrará permanentemente tu perfil, todas tus predicciones y te eliminará de todas las ligas. Esta acción <strong>no se puede deshacer</strong>.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="w-full py-2.5 rounded-lg font-medium text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center gap-2">
            {deletingAccount ? <><Loader2 size={14} className="animate-spin" /> Eliminando...</> : 'Eliminar mi cuenta definitivamente'}
          </button>
        </div>
      </div>

      {/* Link to Privacy Policy */}
      <div className="text-center pt-6 pb-2">
        <Link href="/privacy" className="text-xs text-slate-500 hover:text-slate-400 transition-colors underline">
          Política de Privacidad
        </Link>
      </div>
    </div>
  );
}
