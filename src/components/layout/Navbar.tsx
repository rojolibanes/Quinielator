'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

interface NavbarProps {
  profile: Profile | null;
}

const navItems = [
  { href: '/dashboard', label: 'Predicciones', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Clasificación', icon: Trophy },
  { href: '/leagues', label: 'Mis Ligas', icon: Users },
];

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* ── Desktop Top Navbar ── */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-6"
        style={{
          background: 'rgba(10, 15, 26, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
        }}>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <span className="text-white font-black text-sm">Q</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">Quiniela</span>
            <span
              className="uppercase font-black italic text-glow-green"
              style={{ color: '#10B981', letterSpacing: '0.05em' }}>
              TOR
            </span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname.startsWith(href)
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {/* Admin link - only shown if user is admin */}
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname.startsWith('/admin')
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}>
            <ShieldCheck size={16} />
            Admin
          </Link>
        </nav>

        {/* User section */}
        <div className="flex items-center gap-3 ml-auto">
          {profile && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-white">{profile.nickname}</p>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-emerald-500/30"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.nickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  profile.nickname.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 text-sm"
            title="Cerrar sesión">
            <LogOut size={16} />
            <span className="hidden lg:block">Salir</span>
          </button>
        </div>
      </header>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{
          background: 'rgba(10, 15, 26, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
        }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <span className="text-white font-black text-xs">Q</span>
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Quiniela</span>
            <span
              className="uppercase font-black italic"
              style={{ color: '#10B981' }}>
              TOR
            </span>
          </span>
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Dropdown Menu ── */}
      {menuOpen && (
        <div
          className="md:hidden fixed top-14 left-0 right-0 z-40 p-4 animate-fade-in"
          style={{
            background: 'rgba(10, 15, 26, 0.98)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
          }}>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith(href)
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname.startsWith('/admin')
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}>
              <ShieldCheck size={18} />
              Admin
            </Link>
            <button
              onClick={() => { handleSignOut(); setMenuOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all duration-200 text-left w-full">
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </nav>
        </div>
      )}

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          background: 'rgba(10, 15, 26, 0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(30, 41, 59, 0.8)',
        }}>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}>
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
        <Link
          href="/admin"
          className={`nav-item ${pathname.startsWith('/admin') ? 'active' : ''}`}>
          <ShieldCheck size={22} />
          <span>Admin</span>
        </Link>
      </nav>
    </>
  );
}
