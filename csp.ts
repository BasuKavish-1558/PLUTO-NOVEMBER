import { createHash } from 'node:crypto'
import type { Plugin } from 'vite'

/**
 * Production-only Content-Security-Policy as a <meta> tag, so it works on any static host.
 * Inline scripts (the pre-paint theme script) are allowed by hash, never 'unsafe-inline'.
 * Not applied in dev: Vite's dev server injects its own inline scripts.
 */
export function contentSecurityPolicy(supabaseUrl: string | undefined): Plugin {
  const api = supabaseUrl ? new URL(supabaseUrl).origin : ''
  const ws = api.replace(/^http/, 'ws')
  return {
    name: 'pluto-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
          ([, body]) => `'sha256-${createHash('sha256').update(body!).digest('base64')}'`,
        )
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')}`,
          "style-src 'self' 'unsafe-inline'", // drawer/toast libraries inject <style> tags
          `img-src 'self' data: blob: ${api} https://*.supabase.co`,
          `connect-src 'self' ${api} ${ws} https://*.supabase.co wss://*.supabase.co`,
          "font-src 'self'",
          "worker-src 'self'",
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
        return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
      },
    },
  }
}
