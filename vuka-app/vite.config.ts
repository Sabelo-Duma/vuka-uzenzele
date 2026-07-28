import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Root base for proper service-worker scope on static hosts (Netlify/Vercel/
// Cloudflare Pages). For a GitHub Pages sub-path, set base to '/<repo>/'.
export default defineConfig({
  base: '/',
  // Dev: proxy API calls to the local backend so the client can use relative
  // '/api' URLs (no CORS). In production set VITE_API_URL to the deployed API.
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'favicon-48x48.png'],
      manifest: {
        name: 'Vuka Uzenzele',
        short_name: 'Vuka',
        description: 'Find work near you. Start with no CV — let your work write it for you.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0D182B',
        theme_color: '#0E355A',
        lang: 'en-ZA',
        categories: ['business', 'productivity', 'social'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      // Keep the SW out of the dev server to avoid caching surprises while coding.
      devOptions: { enabled: false },
    }),
  ],
});
