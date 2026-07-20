'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Loader2, Target, Trophy, CheckCircle2 } from 'lucide-react';
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

// 100% Football SVG Data URI Avatars (guaranteed zero loading errors, 0ms latency)
const PRESET_AVATARS = [
  {
    id: 'pelota',
    label: 'Balón ⚽',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%2310B981"/><polygon points="50,22 63,32 58,48 42,48 37,32" fill="%230f172a"/><polygon points="50,4 68,14 63,32 50,22" fill="%23ffffff"/><polygon points="50,4 32,14 37,32 50,22" fill="%23ffffff"/><polygon points="81,24 96,38 76,60 63,32" fill="%23ffffff"/><polygon points="19,24 4,38 24,60 37,32" fill="%23ffffff"/><polygon points="24,60 38,80 50,70 42,48" fill="%23ffffff"/><polygon points="76,60 62,80 50,70 58,48" fill="%23ffffff"/><polygon points="50,70 38,80 50,96 62,80" fill="%230f172a"/></svg>`,
  },
  {
    id: 'silbato',
    label: 'Silbato 📣',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><path d="M25 45 L55 45 C65 45 75 53 75 65 C75 77 65 85 53 85 C41 85 33 77 33 65 L33 45 L25 45 Z" fill="%23f59e0b"/><circle cx="53" cy="65" r="12" fill="%23d97706"/><rect x="15" y="40" width="18" height="10" rx="3" fill="%23cbd5e1"/><circle cx="20" cy="45" r="3" fill="%23475569"/></svg>`,
  },
  {
    id: 'entrenador',
    label: 'Míster 🧢',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><path d="M30 38 C30 24 70 24 70 38 L88 42 L82 48 L18 48 L12 42 Z" fill="%2310B981"/><rect x="24" y="44" width="52" height="8" fill="%23059669"/><circle cx="50" cy="64" r="18" fill="%23fcd34d"/><path d="M32 80 C32 68 68 68 68 80 L68 95 L32 95 Z" fill="%231e293b"/></svg>`,
  },
  {
    id: 'arbitro',
    label: 'Árbitro 🟨',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><rect x="42" y="15" width="36" height="50" rx="4" fill="%23facc15" stroke="%23eab308" stroke-width="2"/><circle cx="35" cy="55" r="16" fill="%23fcd34d"/><path d="M15 95 C15 75 55 75 55 95 Z" fill="%23facc15"/><path d="M25 75 L35 60 L45 75 Z" fill="%23000000"/></svg>`,
  },
  {
    id: 'smoking',
    label: 'Smoking 🤵',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><path d="M20 95 L35 55 L50 65 L65 55 L80 95 Z" fill="%231e293b"/><polygon points="50,45 35,55 65,55" fill="%23ffffff"/><polygon points="44,52 50,56 56,52 56,58 50,54 44,58" fill="%23ef4444"/><circle cx="50" cy="35" r="16" fill="%23fcd34d"/></svg>`,
  },
  {
    id: 'banderin',
    label: 'Banderín 🚩',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><rect x="25" y="15" width="6" height="75" rx="2" fill="%23e2e8f0"/><polygon points="31,20 85,35 31,50" fill="%23ef4444"/><polygon points="31,35 85,35 31,50" fill="%23facc15"/></svg>`,
  },
  {
    id: 'tarjetas',
    label: 'Tarjetas 🟥',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><rect x="20" y="25" width="38" height="56" rx="5" fill="%23facc15" transform="rotate(-12 39 53)" stroke="%23eab308" stroke-width="2"/><rect x="42" y="20" width="38" height="56" rx="5" fill="%23ef4444" transform="rotate(12 61 48)" stroke="%23dc2626" stroke-width="2"/></svg>`,
  },
  {
    id: 'trofeo',
    label: 'Trofeo 🏆',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><path d="M30 20 L70 20 L65 55 C65 65 55 70 50 70 C45 70 35 65 35 55 Z" fill="%23fbbf24"/><rect x="44" y="70" width="12" height="15" fill="%23f59e0b"/><rect x="30" y="85" width="40" height="10" rx="3" fill="%2378350f"/><path d="M22 25 C15 25 15 45 32 45" stroke="%23fbbf24" stroke-width="5" fill="none"/><path d="M78 25 C85 25 85 45 68 45" stroke="%23fbbf24" stroke-width="5" fill="none"/></svg>`,
  },
  {
    id: 'guantes',
    label: 'Guantes 🧤',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><path d="M30 35 C30 20 45 20 45 35 L45 80 L25 80 L25 50 Z" fill="%2338bdf8"/><path d="M45 25 C45 15 60 15 60 25 L60 80 L45 80 Z" fill="%230284c7"/><path d="M60 35 C60 25 75 25 75 35 L75 80 L60 80 Z" fill="%2338bdf8"/><rect x="25" y="70" width="50" height="18" rx="4" fill="%23f87171"/></svg>`,
  },
  {
    id: 'bota',
    label: 'Bota 👟',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%230f172a"/><path d="M15 50 C25 35 50 35 60 45 L88 55 C95 60 92 72 80 72 L20 72 C12 72 10 60 15 50 Z" fill="%2310b981"/><circle cx="30" cy="76" r="3" fill="%23f59e0b"/><circle cx="50" cy="76" r="3" fill="%23f59e0b"/><circle cx="70" cy="76" r="3" fill="%23f59e0b"/><path d="M35 45 L50 55 M45 42 L60 52" stroke="%23ffffff" stroke-width="3"/></svg>`,
  },
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
                <img src={avatarUrl} alt={nickname} className="w-full h-full object-contain p-1" />
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
          <label className="block text-sm text-slate-400 mb-2 font-medium">Iconos Futboleros Predeterminados ⚽</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
            {PRESET_AVATARS.map(avatar => {
              const isSelected = avatarUrl === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarUrl(avatar.url)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/40'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar.url} alt={avatar.label} className="w-12 h-12 rounded-lg object-contain p-0.5" />
                  <span className={`text-xs truncate w-full text-center font-medium ${isSelected ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>
                    {avatar.label}
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
