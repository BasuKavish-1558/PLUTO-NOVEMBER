import { ImageIcon, Trophy } from 'lucide-react'
import type { PersonalRecord } from '@/data/db'
import { beatsPrevious, previousRecord } from '@/domain/personalRecords'
import type { WeightUnit } from '@/domain/units'
import { prDate, prTitle, prValue } from './prText'

type Props = {
  prs: readonly PersonalRecord[] // this exercise's PRs
  allPrs: readonly PersonalRecord[]
  unit: WeightUnit
  onSelect: (pr: PersonalRecord) => void
  showExercise?: (pr: PersonalRecord) => string | undefined
}

/** PR-5: each record with its date and the previous record it beat (computed, never stored). */
export function PrList({ prs, allPrs, unit, onSelect, showExercise }: Props) {
  if (!prs.length) return <p className="py-2 text-sm text-muted-foreground">No records yet.</p>
  const newest = [...prs].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {newest.map((pr) => {
        const prev = previousRecord(pr, allPrs)
        const beat = beatsPrevious(pr, prev)
        return (
          <li key={pr.id}>
            <button type="button" onClick={() => onSelect(pr)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 active:bg-muted">
              <Trophy className={`mt-0.5 size-5 shrink-0 ${beat ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold tabular-nums">{prValue(pr, unit)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{prDate(pr.created_at)}</span>
                </span>
                <span className="block text-sm text-muted-foreground">
                  {showExercise?.(pr) ? `${showExercise(pr)} · ` : ''}
                  {prTitle(pr, unit)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {prev ? `${beat ? 'Beat' : "Didn't beat"} ${prValue(prev, unit)} (${prDate(prev.created_at)})` : 'First record'}
                </span>
                {pr.note && <span className="mt-1 block text-sm">{pr.note}</span>}
                {pr.photo_path && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ImageIcon className="size-3.5" /> Photo
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
