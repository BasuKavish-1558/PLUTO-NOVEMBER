import { Search, X } from 'lucide-react'
import { Chip, ChipRow } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { EQUIPMENT, equipmentLabel, MUSCLE_GROUPS } from '@/domain/library'
import type { useLibraryFilter } from './useLibraryFilter'

type Props = Omit<ReturnType<typeof useLibraryFilter>, 'results'>

export function LibraryFilters({ query, setQuery, muscle, setMuscle, equipment, setEquipment }: Props) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search exercises"
          placeholder="Search exercises"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pr-12 pl-12 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
      <ChipRow role="group" aria-label="Muscle group">
        <Chip selected={muscle === null} onClick={() => setMuscle(null)}>
          All muscles
        </Chip>
        {MUSCLE_GROUPS.map((m) => (
          <Chip key={m.id} selected={muscle === m.id} onClick={() => setMuscle(muscle === m.id ? null : m.id)}>
            {m.name}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow role="group" aria-label="Equipment">
        <Chip selected={equipment === null} onClick={() => setEquipment(null)}>
          Any equipment
        </Chip>
        {EQUIPMENT.map((e) => (
          <Chip key={e} selected={equipment === e} onClick={() => setEquipment(equipment === e ? null : e)}>
            {equipmentLabel(e)}
          </Chip>
        ))}
      </ChipRow>
    </div>
  )
}
