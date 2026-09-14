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
        // The 2.0 ground and the splash behind it. These are the installed
        // app's chrome, so they have to match --v-canvas / --v-feature in
        // src/index.css or the launch screen flashes the old brand navy.
        background_color: '#0B1220',
        theme_color: '#0B1220',
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
        /* Precache only the Latin cut of each font.
           Fontsource ships latin, latin-ext and Vietnamese, and every face
           carries a unicode-range, so a browser fetches at most the one it
           needs — but the service worker would otherwise download all of them
           up front, which is ~46 KB of a South African user's data bundle spent
           on glyph ranges this app will never render. They stay on the server
           and are still fetched on demand in the rare case one is needed. */
        globIgnores: ['**/*-{latin-ext,vietnamese}-*.woff2'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Notification handling lives in public/push-sw.js and is pulled into
        // the generated worker, so precaching and auto-update stay untouched.
        importScripts: ['push-sw.js'],
      },
      // Keep the SW out of the dev server to avoid caching surprises while coding.
      devOptions: { enabled: false },
    }),
  ],
});
