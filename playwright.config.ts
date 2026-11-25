import { defineConfig, devices } from '@playwright/test'

// A fake backend: e2e/support/fakeSupabase.ts answers these URLs, and process env beats .env.
const fakeEnv = { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'e2e-anon-key' }
const PWA = /pwa\.spec\.ts/

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4199' },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] }, testIgnore: PWA },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: PWA },
    // Service worker, install and load-time checks need the production build (dev has no SW).
    { name: 'pwa', use: { ...devices['Pixel 7'], baseURL: 'http://localhost:4198', serviceWorkers: 'allow' }, testMatch: PWA },
  ],
  webServer: [
    {
      command: 'npm run dev -- --port 4199 --strictPort',
      url: 'http://localhost:4199',
      reuseExistingServer: false,
      env: fakeEnv,
    },
    {
      command: 'npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port 4198 --strictPort',
      url: 'http://localhost:4198',
      reuseExistingServer: false,
      timeout: 180_000,
      env: fakeEnv,
    },
  ],
})
