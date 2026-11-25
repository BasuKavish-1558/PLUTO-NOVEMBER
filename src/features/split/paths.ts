/** Split lives under Workout (split is a sub-section, not a top-level destination). */
export const SPLIT_PATH = '/workout/split'
export const LIBRARY_PATH = '/workout/library'
export const splitPath = (splitId: string) => `${SPLIT_PATH}/${splitId}`
export const dayPath = (splitId: string, weekday: number) => `${SPLIT_PATH}/${splitId}/${weekday}`
