import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { resolveDark, useTheme } from '@/stores/theme'

/** Sun/moon swap as CSS transitions (no Motion), since it sits on the sign-in screen too. */
const icon = (shown: boolean) =>
  cn(
    'absolute size-5 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none',
    shown ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0',
  )

export function ThemeToggle() {
  const { pref, toggle } = useTheme()
  const dark = resolveDark(pref)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="relative grid size-5 place-items-center" aria-hidden>
        <Sun className={icon(!dark)} />
        <Moon className={icon(dark)} />
      </span>
    </Button>
  )
}
