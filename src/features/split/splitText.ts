export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const MAX_SPLIT_NAME = 60
export const MAX_DAY_LABEL = 40

export const dayTitle = (d: { label: string; is_rest: boolean; weekday: number }) =>
  d.is_rest ? 'Rest' : d.label || `${WEEKDAYS[d.weekday - 1]} workout`
