import { patternStyle } from '@/lib/backgrounds'
import { useTheme } from '@/stores/theme'

/** The chosen gym pattern behind everything: text color at ~5 %, masked by an SVG tile. Decorative. */
export function BackgroundPattern() {
  const style = patternStyle(useTheme((s) => s.background))
  if (!style) return null
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-foreground opacity-[0.05] dark:opacity-[0.07]" style={style} />
}
