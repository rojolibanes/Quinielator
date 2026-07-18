import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest | any {
  return {
    id: '/',
    name: 'Quinielator — Predicciones de Fútbol',
    short_name: 'Quinielator',
    description: 'La plataforma competitiva de predicciones de fútbol. Compite con tus amigos en ligas privadas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#10B981',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/mobile.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Quinielator en Móvil',
      },
      {
        src: '/screenshots/desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Quinielator en Escritorio',
      },
    ],
  };
}
