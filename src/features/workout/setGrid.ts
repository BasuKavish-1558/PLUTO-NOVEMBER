import type { Tracking } from '@/domain/tracking'

/** Grid columns of a set row, shared by the rows (SetRow) and the column header (ExerciseCard). */
export const setGrid = (tracking: Tracking, showCheck: boolean) =>
  tracking === 'weight_reps'
    ? showCheck
      ? 'grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem]'
      : 'grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)]'
    : showCheck
      ? 'grid-cols-[2.75rem_minmax(0,1fr)_2.75rem]'
      : 'grid-cols-[2.75rem_minmax(0,1fr)]'
