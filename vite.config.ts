import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { contentSecurityPolicy } from './csp.ts'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // process.env wins over .env files, so the e2e build allows its fake backend too.
    contentSecurityPolicy(process.env.VITE_SUPABASE_URL ?? loadEnv(mode, process.cwd(), 'VITE_').VITE_SUPABASE_URL),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'Pluto',
        short_name: 'Pluto',
        description: 'Workout splits, logging, progress and protein in one place.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  // Screens are lazy chunks, so in dev Vite would discover these late, re-optimize and force a page reload.
  optimizeDeps: {
    include: ['motion/react', 'recharts', 'sonner', '@supabase/supabase-js', 'vaul', 'radix-ui', 'canvas-confetti', 'zod', 'zod/mini'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
}))
