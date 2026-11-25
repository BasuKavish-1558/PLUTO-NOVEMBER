import { ChevronRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/data/db'
import { buildCustomRows, buildPresetRows, PRESETS, type SplitRows } from '@/data/presets'
import { activateSplit, createSplit } from '@/data/repos/splits'
import { MAX_SPLIT_NAME } from './splitText'
import { splitPath } from '@/features/split/paths'

type Props = { profile: Profile; open: boolean; onOpenChange: (open: boolean) => void }

export function NewSplitDrawer({ profile, open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()

  async function create(rows: SplitRows) {
    const id = await createSplit(rows)
    // The first split becomes active; later ones wait until the user switches.
    if (!profile.active_split_id) await activateSplit(profile.id, id)
    toast.success(profile.active_split_id ? `Created ${rows.split.name}` : `${rows.split.name} is now your active split`)
    onOpenChange(false)
    navigate(splitPath(id))
  }

  function onCustom(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setError('Name your split')
    void create(buildCustomRows(n, profile.id))
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="mx-auto max-h-[90dvh] max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>New split</DrawerTitle>
          <DrawerDescription>Start from a preset and edit anything, or build your own.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-5 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <ul className="space-y-2">
            {PRESETS.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => void create(buildPresetRows(p, profile.id))}
                  className="flex min-h-16 w-full items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-left transition-[transform,background-color] active:scale-[0.98] active:bg-muted motion-reduce:active:scale-100"
                >
                  <span className="flex-1">
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-sm text-muted-foreground">{p.summary}</span>
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
          <form noValidate onSubmit={onCustom} className="space-y-2 border-t pt-5">
            <label htmlFor="custom-split-name" className="block text-sm font-medium">
              Or build a custom split
            </label>
            <div className="flex gap-2">
              <Input
                id="custom-split-name"
                placeholder="e.g. My 4-day plan"
                maxLength={MAX_SPLIT_NAME}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(undefined)
                }}
                aria-invalid={!!error}
              />
              <Button type="submit" size="lg">
                Create
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
