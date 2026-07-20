import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Iniciar Sesión — Quinielator',
  description: 'Accede a tu cuenta de Quinielator',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background: 'radial-gradient(ellipse at 30% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(16, 185, 129, 0.04) 0%, transparent 40%), #0a0f1a',
      }}>
      {/* Background field pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-[0.03] w-full max-w-3xl" viewBox="0 0 400 300" fill="none">
          <ellipse cx="200" cy="150" rx="190" ry="140" stroke="#10B981" strokeWidth="2"/>
          <circle cx="200" cy="150" r="40" stroke="#10B981" strokeWidth="2"/>
          <line x1="200" y1="10" x2="200" y2="290" stroke="#10B981" strokeWidth="2"/>
          <rect x="10" y="100" width="60" height="100" stroke="#10B981" strokeWidth="2"/>
          <rect x="330" y="100" width="60" height="100" stroke="#10B981" strokeWidth="2"/>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {children}
        
        {/* Link to Privacy Policy */}
        <Link href="/privacy" className="mt-8 text-xs text-slate-500 hover:text-slate-400 transition-colors underline">
          Política de Privacidad
        </Link>
      </div>
    </div>
  );
}
