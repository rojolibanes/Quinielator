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
    categories: ['sports', 'entertainment', 'games'],
    related_applications: [
      {
        platform: 'play',
        url: 'https://play.google.com/store/apps/details?id=es.quinielator.qui',
        id: 'es.quinielator.qui',
      },
    ],
    prefer_related_applications: false,
    lang: 'es',
    dir: 'ltr',
    scope: '/',
    scope_extensions: [{ origin: '*.quinielator.es' }],
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
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
