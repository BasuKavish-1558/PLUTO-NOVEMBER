import { Check } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { Card } from '@/components/ui/card'
import { Segmented } from '@/components/ui/segmented'
import { BACKGROUND_IDS, BACKGROUND_LABELS, patternStyle, type BackgroundId } from '@/lib/backgrounds'
import { cn } from '@/lib/utils'
import { useTheme, type ThemePref } from '@/stores/theme'

const THEMES: readonly { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

/** Theme and background, saved to the profile by ThemeSync and applied on every device. */
export function AppearanceCard() {
  const { pref, setPref, background, setBackground } = useTheme()

  return (
    <Card className="space-y-5">
      <h2 className="font-semibold">Appearance</h2>
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Theme</h3>
        <Segmented label="Theme" value={pref} options={THEMES} onChange={setPref} />
      </section>
      <section className="space-y-2">
        <h3 id="background-label" className="text-sm font-medium text-muted-foreground">
          Background
        </h3>
        <BackgroundPicker value={background} onChange={setBackground} />
      </section>
    </Card>
  )
}

function BackgroundPicker({ value, onChange }: { value: BackgroundId; onChange: (id: BackgroundId) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (i + step + BACKGROUND_IDS.length) % BACKGROUND_IDS.length
    onChange(BACKGROUND_IDS[next]!)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-labelledby="background-label" className="grid grid-cols-3 gap-2">
      {BACKGROUND_IDS.map((id, i) => {
        const checked = value === id
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'group flex flex-col gap-1.5 rounded-xl p-1.5 text-left outline-none transition-transform active:scale-95 motion-reduce:active:scale-100',
              'focus-visible:ring-[3px] focus-visible:ring-ring/50',
            )}
          >
            <span
              className={cn(
                'relative block h-16 overflow-hidden rounded-lg border bg-background transition-shadow',
                checked && 'border-primary ring-2 ring-primary',
              )}
            >
              <span aria-hidden className="absolute inset-0 bg-foreground opacity-30" style={patternStyle(id, 0.5) ?? { display: 'none' }} />
              {checked && (
                <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
            </span>
            <span className={cn('px-0.5 text-xs font-medium', !checked && 'text-muted-foreground')}>{BACKGROUND_LABELS[id]}</span>
          </button>
        )
      })}
    </div>
  )
}
