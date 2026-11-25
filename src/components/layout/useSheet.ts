import { useState } from 'react'

/** Open state for a sheet plus a key that changes on every opening, so its form state resets. */
export function useSheet() {
  const [state, setState] = useState({ open: false, key: 0 })
  return {
    open: state.open,
    key: state.key,
    show: () => setState((s) => ({ open: true, key: s.key + 1 })),
    onOpenChange: (open: boolean) => setState((s) => ({ ...s, open })),
  }
}
