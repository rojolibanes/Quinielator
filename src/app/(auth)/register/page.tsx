'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Chrome } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (nickname.length < 3) {
      toast.error('El nickname debe tener al menos 3 caracteres');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Cuenta creada! Revisa tu email para confirmarla.');
      router.push('/login');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error('Error al conectar con Google');
      setGoogleLoading(false);
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
        <p className="text-slate-400 text-sm mt-2">Únete a la competición</p>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6">Crear Cuenta</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Nickname *</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Tu nombre en la plataforma"
                value={nickname}
                onChange={e => setNickname(e.target.value.replace(/\s/g, ''))}
                required
                minLength={3}
                maxLength={20}
                className="input-field pl-10"
                id="register-nickname"
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">Sin espacios, 3–20 caracteres. Visible en el ranking.</p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Email *</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input-field pl-10"
                id="register-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Contraseña *</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="input-field pl-10 pr-10"
                id="register-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Confirmar contraseña *</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className={`input-field pl-10 ${
                  confirmPassword && confirmPassword !== password ? 'border-red-500/60' : ''
                }`}
                id="register-confirm-password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} id="register-submit"
            className="w-full btn-primary py-3 justify-center text-base mt-2">
            {loading ? 'Creando cuenta...' : '🚀 Crear Cuenta Gratis'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500">o regístrate con</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <button onClick={handleGoogleLogin} disabled={googleLoading}
          className="w-full btn-secondary py-3 justify-center text-sm">
          <Chrome size={18} />
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
