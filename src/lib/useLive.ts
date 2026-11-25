import { liveQuery } from 'dexie'
import { useEffect, useState, type DependencyList } from 'react'

/**
 * Subscribes to a Dexie query and re-renders whenever the tables it read change
 * (local writes and sync pulls alike). Returns undefined until the first result.
 */
export function useLive<T>(query: () => Promise<T>, deps: DependencyList): T | undefined {
  const [state, setState] = useState<{ deps: DependencyList; value: T } | undefined>()

  useEffect(() => {
    const sub = liveQuery(query).subscribe({
      next: (value) => setState({ deps, value }),
      error: (e) => console.error('live query failed', e),
    })
    return () => sub.unsubscribe()
    // The caller's deps decide when the query is re-created, like useMemo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Never show a result that belongs to the previous deps.
  return state && sameDeps(state.deps, deps) ? state.value : undefined
}

const sameDeps = (a: DependencyList, b: DependencyList) =>
  a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
