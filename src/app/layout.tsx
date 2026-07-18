import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import RegisterSW from '@/components/pwa/RegisterSW';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#10B981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Quinielator — Predicciones de Fútbol',
  description: 'La plataforma competitiva de predicciones de fútbol. Compite con tus amigos en ligas privadas, predice los marcadores de LaLiga y sube al top del ranking.',
  keywords: ['quinielator', 'predicciones fútbol', 'LaLiga', 'quiniela', 'pronosticos'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quinielator',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-icon.png',
  },
  openGraph: {
    title: 'Quinielator — Predicciones de Fútbol',
    description: 'Compite con tus amigos en predicciones de LaLiga',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans bg-dark-800 text-white antialiased`}>
        <RegisterSW />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0f172a',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

