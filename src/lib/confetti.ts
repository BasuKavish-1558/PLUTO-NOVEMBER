import confetti from 'canvas-confetti'

/** PR-4 celebration. Skipped entirely for prefers-reduced-motion. */
export function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colors = [getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#635ce5', '#fbbf24', '#ffffff']
  const burst = (x: number, angle: number) => confetti({ particleCount: 60, spread: 70, angle, origin: { x, y: 0.75 }, colors, disableForReducedMotion: true })
  burst(0.2, 60)
  burst(0.8, 120)
}
