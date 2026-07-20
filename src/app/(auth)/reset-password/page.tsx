'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error('Error al actualizar la contraseña: ' + error.message);
      setLoading(false);
    } else {
      toast.success('🎉 Contraseña actualizada con éxito');
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-green"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <span className="text-white font-black">Q</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-white">Quiniela</span>
          <span className="uppercase font-black italic text-glow-green" style={{ color: '#10B981' }}>TOR</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">Restablecer Contraseña</p>
      </div>

      {/* Card */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-4">Nueva Contraseña</h2>
        <p className="text-xs text-slate-400 mb-6">Introduce tu nueva contraseña para acceder a tu cuenta.</p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Confirmar Nueva Contraseña</label>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 justify-center text-sm flex items-center gap-2">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Actualizando...
              </>
            ) : (
              'Guardar Nueva Contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
