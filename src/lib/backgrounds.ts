import type { CSSProperties } from 'react'

/**
 * Minimal gym line patterns. Each is a one-color SVG tile used as a CSS *mask* over a layer
 * filled with the text color at a few percent opacity, so it follows light/dark automatically
 * and never competes with content (one accent, no clutter).
 */
export const BACKGROUND_IDS = ['none', 'floor', 'plates', 'dumbbells', 'kettlebells', 'mixed'] as const
export type BackgroundId = (typeof BACKGROUND_IDS)[number]

const S = `fill='none' stroke='#000' stroke-linecap='round' stroke-linejoin='round'`

const plate = (x: number, y: number, r: number) =>
  `<circle cx='${x}' cy='${y}' r='${r}' ${S} stroke-width='2'/>` +
  `<circle cx='${x}' cy='${y}' r='${Math.round(r * 0.58)}' ${S} stroke-width='1.5'/>` +
  `<circle cx='${x}' cy='${y}' r='${Math.max(2, Math.round(r * 0.15))}' fill='#000'/>`

const dumbbell = (x: number, y: number, angle: number) =>
  `<g transform='translate(${x} ${y}) rotate(${angle})' ${S} stroke-width='2'>` +
  `<path d='M-14 0H14' stroke-width='3'/>` +
  `<rect x='-24' y='-10' width='8' height='20' rx='2'/><rect x='-31' y='-6' width='6' height='12' rx='1.5'/>` +
  `<rect x='16' y='-10' width='8' height='20' rx='2'/><rect x='25' y='-6' width='6' height='12' rx='1.5'/></g>`

const kettlebell = (x: number, y: number) =>
  `<g transform='translate(${x} ${y})' ${S} stroke-width='2'>` +
  `<path d='M-11 -6V-13a11 11 0 0 1 22 0V-6' stroke-width='2.5'/>` +
  `<circle cx='0' cy='8' r='16'/><path d='M-10 23H10'/></g>`

const svg = (size: number, body: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${body}</svg>`

const TILES: Record<Exclude<BackgroundId, 'none'>, { label: string; size: number; svg: string }> = {
  floor: {
    label: 'Gym floor',
    size: 44,
    svg: svg(44, `<path d='M44 0.5H0.5V44' ${S} stroke-width='1'/><circle cx='22' cy='22' r='1' fill='#000'/>`),
  },
  plates: { label: 'Plates', size: 140, svg: svg(140, plate(38, 40, 24) + plate(104, 100, 15)) },
  dumbbells: { label: 'Dumbbells', size: 120, svg: svg(120, dumbbell(36, 36, -30) + dumbbell(92, 90, -30)) },
  kettlebells: { label: 'Kettlebells', size: 120, svg: svg(120, kettlebell(34, 36) + kettlebell(90, 92)) },
  mixed: {
    label: 'Mixed',
    size: 220,
    svg: svg(220, dumbbell(52, 48, -30) + plate(160, 58, 22) + kettlebell(62, 160) + dumbbell(168, 168, 30)),
  },
}

export const BACKGROUND_LABELS: Record<BackgroundId, string> = {
  none: 'Plain',
  ...(Object.fromEntries(Object.entries(TILES).map(([id, t]) => [id, t.label])) as Record<Exclude<BackgroundId, 'none'>, string>),
}

/** Inline style for a layer showing the pattern (null for "none"). `scale` shrinks it for previews. */
export function patternStyle(id: BackgroundId, scale = 1): CSSProperties | null {
  if (id === 'none') return null
  const tile = TILES[id]
  const url = `url("data:image/svg+xml,${encodeURIComponent(tile.svg)}")`
  const size = `${tile.size * scale}px ${tile.size * scale}px`
  return { maskImage: url, WebkitMaskImage: url, maskSize: size, WebkitMaskSize: size, maskRepeat: 'repeat', WebkitMaskRepeat: 'repeat' }
}
